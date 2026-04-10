import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAntiCheat, useApp, useSocket } from '../../hooks';
import { MOVEMENT } from '../../hooks/useAntiCheat';
import FullMap from '../../components/Maps/FullMap';

const GRID_SIZE = 0.0005;

const toGridKey = (lat, lng) => {
  const gridLat = Math.floor(lat / GRID_SIZE);
  const gridLng = Math.floor(lng / GRID_SIZE);
  return `${gridLat}_${gridLng}`;
};

const gridToPolygon = (key) => {
  const [gridLat, gridLng] = key.split('_').map(Number);
  const lat = gridLat * GRID_SIZE;
  const lng = gridLng * GRID_SIZE;
  return [
    { latitude: lat, longitude: lng },
    { latitude: lat + GRID_SIZE, longitude: lng },
    { latitude: lat + GRID_SIZE, longitude: lng + GRID_SIZE },
    { latitude: lat, longitude: lng + GRID_SIZE },
  ];
};

const PLAYER_COLORS = ['#7C3AED', '#0EA5E9', '#EF4444', '#16A34A', '#F59E0B'];

export default function MapScreen() {
  const { dark, user } = useApp();
  const { connected, nearbyPlayers, joinGame, updateLocation, claimTerritory } = useSocket();
  const {
    movementType,
    isCheating,
    cheatReason,
    confidence,
    modelReady,
    analyzeMovement,
    resetHistory,
  } = useAntiCheat();

  const mapRef = useRef(null);
  const locationSubRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [routeCoords, setRouteCoords] = useState([]);
  const [territory, setTerritory] = useState(new Set());
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    requestPermission();
    return () => {
      if (locationSubRef.current) locationSubRef.current.remove();
    };
  }, []);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }
    const current = await Location.getCurrentPositionAsync({});
    setLocation(current);
    setPlayerPosition({
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    });
    const { latitude, longitude } = current.coords;
    setTerritory(new Set([toGridKey(latitude, longitude)]));

    joinGame({
      name: user?.name || 'Player',
      avatar: user?.selectedAvatar || 'blaze',
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
      coins: user?.coins || 0,
      xp: user?.xp || 0,
      level: user?.level || 1,
    });
  };

  const startTracking = async () => {
    setIsTracking(true);
    resetHistory();
    setRouteCoords(location ? [{
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }] : []);

    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 500,
        distanceInterval: 1,
      },
      (loc) => {
        const { latitude, longitude, heading: h, speed: s } = loc.coords;

        setPlayerPosition({ latitude, longitude });
        setLocation(loc);
        setHeading(h || 0);
        setSpeed(s ? (s * 3.6).toFixed(1) : 0);
        setRouteCoords((prev) => [...prev, { latitude, longitude }]);
        setSteps((prev) => prev + 1);

        analyzeMovement({
          latitude,
          longitude,
          heading: h || 0,
          speed: s || 0,
          timestamp: Date.now(),
        });

        if (!isCheating && movementType !== MOVEMENT.VEHICLE) {
          setTerritory((prev) => new Set(prev).add(toGridKey(latitude, longitude)));
          claimTerritory(toGridKey(latitude, longitude), '#F4621F');
        }

        updateLocation(latitude, longitude, h || 0, s || 0);

        if (Platform.OS !== 'web') {
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 500);
        }
      }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    resetHistory();
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  };

  const getMovementColor = () => {
    if (isCheating) return 'rgba(239,68,68,0.95)';
    if (movementType === MOVEMENT.VEHICLE) return 'rgba(239,68,68,0.95)';
    if (movementType === MOVEMENT.RUNNING) return 'rgba(124,58,237,0.95)';
    if (movementType === MOVEMENT.WALKING) return 'rgba(22,163,74,0.95)';
    return 'rgba(107,114,128,0.95)';
  };

  const getMovementEmoji = () => {
    if (isCheating) return '🚨';
    if (movementType === MOVEMENT.VEHICLE) return '🚗';
    if (movementType === MOVEMENT.RUNNING) return '🏃';
    if (movementType === MOVEMENT.WALKING) return '🚶';
    return '⏸';
  };

  const getMovementLabel = () => {
    if (isCheating) return 'CHEAT!';
    if (movementType === MOVEMENT.VEHICLE) return 'Vehicle!';
    if (movementType === MOVEMENT.RUNNING) return 'Running';
    if (movementType === MOVEMENT.WALKING) return 'Walking';
    return 'Stopped';
  };

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!location || !playerPosition) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F4621F" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FullMap 
        dark={dark}
        mapRef={mapRef}
        playerPosition={playerPosition}
        heading={heading}
        territory={territory}
        gridToPolygon={gridToPolygon}
        routeCoords={routeCoords}
        isCheating={isCheating}
        isTracking={isTracking}
        nearbyPlayers={nearbyPlayers}
      />

      {isCheating && (
        <View style={styles.cheatWarning}>
          <Text style={styles.cheatWarningTitle}>⚠️ Cheat Detected!</Text>
          <Text style={styles.cheatWarningText}>{cheatReason}</Text>
          <Text style={styles.cheatWarningText}>Territory gains paused 🚫</Text>
        </View>
      )}

      {isTracking && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{territory.size}</Text>
          <Text style={styles.statLabel}>Cells</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{steps}</Text>
          <Text style={styles.statLabel}>Steps</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{speed}</Text>
          <Text style={styles.statLabel}>km/h</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{Math.floor(steps * 0.04)}</Text>
          <Text style={styles.statLabel}>Cal</Text>
        </View>
      </View>

      {isTracking && (
        <View style={[styles.movementBadge, { backgroundColor: getMovementColor() }]}>
          <Text style={styles.movementEmoji}>{getMovementEmoji()}</Text>
          <Text style={styles.movementText}>{getMovementLabel()}</Text>
          {!modelReady && <Text style={styles.movementText}> ⏳</Text>}
        </View>
      )}

      <View style={styles.playersNearby}>
        <Text style={styles.playersNearbyText}>
          👥 {nearbyPlayers.length} nearby {connected ? '🟢' : '🔴'}
        </Text>
      </View>

      <View style={styles.aiStatus}>
        <Text style={styles.aiStatusText}>
          🤖 AI {modelReady ? '✅' : '⏳'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.trackBtn, isTracking && styles.trackBtnStop]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Text style={styles.trackBtnText}>
          {isTracking ? '⏹  Stop Walk' : '▶  Start Walk'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: '#EF4444' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },

  cheatWarning: {
    position: 'absolute', top: 120, left: 16, right: 16,
    backgroundColor: 'rgba(239,68,68,0.95)',
    borderRadius: 14, padding: 14, elevation: 6,
  },
  cheatWarningTitle: {
    fontSize: 14, fontWeight: '800',
    color: 'white', marginBottom: 4,
  },
  cheatWarningText: {
    fontSize: 12, color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  movementBadge: {
    position: 'absolute', bottom: 120, right: 16,
    borderRadius: 12, paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center',
    gap: 6, elevation: 4,
  },
  movementEmoji: { fontSize: 16 },
  movementText: { fontSize: 11, fontWeight: '700', color: 'white' },

  aiStatus: {
    position: 'absolute', bottom: 160, right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8, paddingVertical: 4,
    paddingHorizontal: 8,
  },
  aiStatusText: { fontSize: 10, color: 'white', fontWeight: '600' },

  liveBadge: {
    position: 'absolute', top: 60, right: 16,
    backgroundColor: '#F4621F', borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  liveText: { fontSize: 11, fontWeight: '700', color: 'white' },

  statsBar: {
    position: 'absolute', top: 60, left: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16, paddingVertical: 10,
    paddingHorizontal: 12, flexDirection: 'row',
    alignItems: 'center', elevation: 4,
  },
  statItem: { alignItems: 'center', paddingHorizontal: 8 },
  statVal: { fontSize: 16, fontWeight: '700', color: '#141416' },
  statLabel: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#EBEBEF' },

  playersNearby: {
    position: 'absolute', bottom: 120, left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12,
  },
  playersNearbyText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },

  trackBtn: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: '#F4621F', paddingVertical: 16,
    paddingHorizontal: 48, borderRadius: 30, elevation: 6,
    shadowColor: '#F4621F', shadowOpacity: 0.35,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  trackBtnStop: { backgroundColor: '#EF4444' },
  trackBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});