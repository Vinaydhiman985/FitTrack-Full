import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs-react-native';
// Movement types
export const MOVEMENT = {
  WALKING: 'walking',
  RUNNING: 'running',
  VEHICLE: 'vehicle',
  TELEPORT: 'teleport',
  STATIONARY: 'stationary',
};

// Thresholds
const THRESHOLDS = {
  STATIONARY: 0.5,    // < 0.5 km/h = not moving
  WALKING_MAX: 8,     // < 8 km/h = walking
  RUNNING_MAX: 20,    // < 20 km/h = running
  VEHICLE_MIN: 20,    // > 20 km/h = vehicle
  TELEPORT_DIST: 0.1, // > 100m jump in 1 second = teleport
  MAX_ACCEL: 10,      // max acceleration m/s² for humans
};

// Calculate distance between two coordinates in km
const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export function useAntiCheat() {
  const [movementType, setMovementType] = useState(MOVEMENT.STATIONARY);
  const [isCheating, setIsCheating] = useState(false);
  const [cheatReason, setCheatReason] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [model, setModel] = useState(null);
  const [modelReady, setModelReady] = useState(false);

  const locationHistory = useRef([]);
  const speedHistory = useRef([]);
  const lastAlert = useRef(0);

  // Initialize TensorFlow
  useEffect(() => {
    const initTF = async () => {
      try {
        await tf.ready();


        // Create a simple model for movement classification
        const model = tf.sequential({
          layers: [
            tf.layers.dense({
              inputShape: [6], // speed, acceleration, distance, speed_variance, heading_change, time_delta
              units: 16,
              activation: 'relu',
            }),
            tf.layers.dense({
              units: 8,
              activation: 'relu',
            }),
            tf.layers.dense({
              units: 4, // stationary, walking, running, vehicle
              activation: 'softmax',
            }),
          ],
        });

        model.compile({
          optimizer: 'adam',
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy'],
        });

        // Pre-train with synthetic data
        await trainModel(model);

        setModel(model);
        setModelReady(true);

      } catch (error) {

        setModelReady(true); // continue with rule-based only
      }
    };

    initTF();

    return () => {
      if (model) model.dispose();
    };
  }, []);

  // Train model with synthetic data
  const trainModel = async (model) => {
    // Generate training data
    // Features: [speed, acceleration, distance, speed_variance, heading_change, time_delta]
    // Labels: [stationary, walking, running, vehicle]

    const trainingData = [];
    const trainingLabels = [];

    // Stationary (label: [1,0,0,0])
    for (let i = 0; i < 50; i++) {
      trainingData.push([
        Math.random() * 0.5,  // speed 0-0.5 km/h
        Math.random() * 0.1,  // low acceleration
        Math.random() * 0.001, // tiny distance
        Math.random() * 0.1,  // low variance
        Math.random() * 5,    // heading change
        1.0,                   // time delta
      ]);
      trainingLabels.push([1, 0, 0, 0]);
    }

    // Walking (label: [0,1,0,0])
    for (let i = 0; i < 50; i++) {
      trainingData.push([
        2 + Math.random() * 4,  // speed 2-6 km/h
        Math.random() * 1.5,    // moderate acceleration
        0.001 + Math.random() * 0.002, // small distance
        Math.random() * 1,      // low-moderate variance
        Math.random() * 30,     // moderate heading change
        1.0,
      ]);
      trainingLabels.push([0, 1, 0, 0]);
    }

    // Running (label: [0,0,1,0])
    for (let i = 0; i < 50; i++) {
      trainingData.push([
        6 + Math.random() * 8,  // speed 6-14 km/h
        1 + Math.random() * 3,  // higher acceleration
        0.002 + Math.random() * 0.003,
        1 + Math.random() * 2,
        Math.random() * 20,
        1.0,
      ]);
      trainingLabels.push([0, 0, 1, 0]);
    }

    // Vehicle (label: [0,0,0,1])
    for (let i = 0; i < 50; i++) {
      trainingData.push([
        20 + Math.random() * 80, // speed 20-100 km/h
        3 + Math.random() * 5,   // high acceleration
        0.01 + Math.random() * 0.05, // large distance
        5 + Math.random() * 20,  // high variance
        Math.random() * 45,
        1.0,
      ]);
      trainingLabels.push([0, 0, 0, 1]);
    }

    const xs = tf.tensor2d(trainingData);
    const ys = tf.tensor2d(trainingLabels);

    await model.fit(xs, ys, {
      epochs: 30,
      batchSize: 16,
      verbose: 0,
    });

    xs.dispose();
    ys.dispose();
  };

  // Analyze movement with both TF model + rule-based system
  const analyzeMovement = async (newLocation) => {
    const history = locationHistory.current;

    if (history.length === 0) {
      locationHistory.current.push(newLocation);
      return;
    }

    const prev = history[history.length - 1];
    const timeDelta = (newLocation.timestamp - prev.timestamp) / 1000; // seconds

    if (timeDelta <= 0) return;

    // Calculate metrics
    const distance = getDistance(
      prev.latitude, prev.longitude,
      newLocation.latitude, newLocation.longitude
    );
    const speedKmh = (distance / timeDelta) * 3600;
    const speedMs = speedKmh / 3.6;
    const acceleration = Math.abs(speedMs - (prev.speed || 0)) / timeDelta;

    // Store speed history
    speedHistory.current.push(speedKmh);
    if (speedHistory.current.length > 10) speedHistory.current.shift();

    // Calculate speed variance
    const speeds = speedHistory.current;
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((a, b) => a + Math.pow(b - avgSpeed, 2), 0) / speeds.length;

    // Heading change
    const headingChange = Math.abs((newLocation.heading || 0) - (prev.heading || 0));

    // ── Rule-based checks ──

    // Check teleporting
    if (timeDelta < 2 && distance > THRESHOLDS.TELEPORT_DIST) {
      flagCheat('teleport', `Teleported ${(distance * 1000).toFixed(0)}m in ${timeDelta.toFixed(1)}s`, 99);
      locationHistory.current.push(newLocation);
      return;
    }

    // Check impossible acceleration
    if (acceleration > THRESHOLDS.MAX_ACCEL && speedKmh > 5) {
      flagCheat('acceleration', `Impossible acceleration: ${acceleration.toFixed(1)} m/s²`, 90);
    }

    // ── TensorFlow prediction ──
    if (model && modelReady) {
      try {
        const features = tf.tensor2d([[
          Math.min(speedKmh, 150) / 150, // normalize
          Math.min(acceleration, 20) / 20,
          Math.min(distance, 0.1) / 0.1,
          Math.min(variance, 50) / 50,
          Math.min(headingChange, 180) / 180,
          Math.min(timeDelta, 5) / 5,
        ]]);

        const prediction = model.predict(features);
        const scores = await prediction.data();

        const [stationaryScore, walkingScore, runningScore, vehicleScore] = scores;
        const maxScore = Math.max(...scores);
        const conf = Math.round(maxScore * 100);

        features.dispose();
        prediction.dispose();

        if (vehicleScore > 0.7) {
          flagCheat('vehicle', `Vehicle detected (${conf}% confidence)`, conf);
          setMovementType(MOVEMENT.VEHICLE);
        } else if (runningScore > 0.5) {
          clearCheat();
          setMovementType(MOVEMENT.RUNNING);
          setConfidence(conf);
        } else if (walkingScore > 0.5) {
          clearCheat();
          setMovementType(MOVEMENT.WALKING);
          setConfidence(conf);
        } else {
          clearCheat();
          setMovementType(MOVEMENT.STATIONARY);
          setConfidence(conf);
        }

      } catch (e) {
        // Fallback to rule-based
        ruleBased(speedKmh);
      }
    } else {
      // Pure rule-based fallback
      ruleBased(speedKmh);
    }

    // Update history
    locationHistory.current.push({ ...newLocation, speed: speedMs });
    if (locationHistory.current.length > 20) locationHistory.current.shift();
  };

  const ruleBased = (speedKmh) => {
    if (speedKmh < THRESHOLDS.STATIONARY) {
      setMovementType(MOVEMENT.STATIONARY);
      clearCheat();
    } else if (speedKmh < THRESHOLDS.WALKING_MAX) {
      setMovementType(MOVEMENT.WALKING);
      clearCheat();
    } else if (speedKmh < THRESHOLDS.RUNNING_MAX) {
      setMovementType(MOVEMENT.RUNNING);
      clearCheat();
    } else {
      setMovementType(MOVEMENT.VEHICLE);
      flagCheat('vehicle', `Speed too high: ${speedKmh.toFixed(1)} km/h`, 85);
    }
  };

  const flagCheat = (reason, message, conf) => {
    const now = Date.now();
    // Only alert every 5 seconds to avoid spam
    if (now - lastAlert.current > 5000) {
      lastAlert.current = now;
      setIsCheating(true);
      setCheatReason(message);
      setConfidence(conf);

    }
  };

  const clearCheat = () => {
    setIsCheating(false);
    setCheatReason(null);
  };

  const resetHistory = () => {
    locationHistory.current = [];
    speedHistory.current = [];
    clearCheat();
  };

  return {
    movementType,
    isCheating,
    cheatReason,
    confidence,
    modelReady,
    analyzeMovement,
    resetHistory,
  };
}