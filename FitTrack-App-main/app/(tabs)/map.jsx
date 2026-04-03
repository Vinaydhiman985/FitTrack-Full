import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import { useAntiCheat, useApp, useSocket } from '../../hooks';
import { MOVEMENT } from '../../hooks/useAntiCheat';

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

        // AI Anti-cheat analysis
        analyzeMovement({
          latitude,
          longitude,
          heading: h || 0,
          speed: s || 0,
          timestamp: Date.now(),
        });

        // Only claim territory if NOT cheating!
        if (!isCheating && movementType !== MOVEMENT.VEHICLE) {
          setTerritory((prev) => new Set(prev).add(toGridKey(latitude, longitude)));
          claimTerritory(toGridKey(latitude, longitude), '#F4621F');
        }

        // Always send location to socket
        updateLocation(latitude, longitude, h || 0, s || 0);

        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
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

  // Get movement badge color
  const getMovementColor = () => {
    if (isCheating) return 'rgba(239,68,68,0.95)';
    if (movementType === MOVEMENT.VEHICLE) return 'rgba(239,68,68,0.95)';
    if (movementType === MOVEMENT.RUNNING) return 'rgba(124,58,237,0.95)';
    if (movementType === MOVEMENT.WALKING) return 'rgba(22,163,74,0.95)';
    return 'rgba(107,114,128,0.95)';
  };

  // Get movement emoji
  const getMovementEmoji = () => {
    if (isCheating) return '🚨';
    if (movementType === MOVEMENT.VEHICLE) return '🚗';
    if (movementType === MOVEMENT.RUNNING) return '🏃';
    if (movementType === MOVEMENT.WALKING) return '🚶';
    return '⏸';
  };

  // Get movement label
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
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: playerPosition.latitude,
          longitude: playerPosition.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        followsUserLocation={false}
        userInterfaceStyle={dark ? 'dark' : 'light'}
      >
        {/* Your territory */}
        {Array.from(territory).map((key) => (
          <Polygon
            key={key}
            coordinates={gridToPolygon(key)}
            fillColor="rgba(244, 98, 31, 0.3)"
            strokeColor="#F4621F"
            strokeWidth={1}
          />
        ))}

        {/* Route line */}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#F4621F"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {/* Your player marker */}
        <Marker
          coordinate={playerPosition}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={true}
          rotation={heading}
        >
          <View style={styles.playerMarker}>
            <View style={[styles.playerPulse, isCheating && styles.playerPulseCheat]} />
            <View style={[styles.playerDot, isCheating && styles.playerDotCheat]}>
              <Text style={styles.playerEmoji}>
                {isCheating ? '🚨' : '🏃'}
              </Text>
            </View>
            {isTracking && <View style={[styles.playerRing, isCheating && styles.playerRingCheat]} />}
          </View>
        </Marker>

        {/* Real nearby players */}
        {nearbyPlayers.map((player, index) => {
          if (!player.latitude || !player.longitude) return null;
          const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
          return (
            <Marker
              key={player.id}
              coordinate={{
                latitude: player.latitude,
                longitude: player.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.otherPlayerWrap}>
                <View style={[styles.otherPlayerDot, { backgroundColor: color }]}>
                  <Text style={styles.otherPlayerEmoji}>🚶</Text>
                </View>
                <View style={[styles.otherPlayerLabel, { backgroundColor: color }]}>
                  <Text style={styles.otherPlayerName}>{player.name}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Cheat warning banner */}
      {isCheating && (
        <View style={styles.cheatWarning}>
          <Text style={styles.cheatWarningTitle}>⚠️ Cheat Detected!</Text>
          <Text style={styles.cheatWarningText}>{cheatReason}</Text>
          <Text style={styles.cheatWarningText}>Territory gains paused 🚫</Text>
        </View>
      )}

      {/* Live badge */}
      {isTracking && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Stats bar */}
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

      {/* Movement type badge */}
      {isTracking && (
        <View style={[styles.movementBadge, { backgroundColor: getMovementColor() }]}>
          <Text style={styles.movementEmoji}>{getMovementEmoji()}</Text>
          <Text style={styles.movementText}>{getMovementLabel()}</Text>
          {!modelReady && <Text style={styles.movementText}> ⏳</Text>}
        </View>
      )}

      {/* Players nearby */}
      <View style={styles.playersNearby}>
        <Text style={styles.playersNearbyText}>
          👥 {nearbyPlayers.length} nearby {connected ? '🟢' : '🔴'}
        </Text>
      </View>

      {/* AI status */}
      <View style={styles.aiStatus}>
        <Text style={styles.aiStatusText}>
          🤖 AI {modelReady ? '✅' : '⏳'}
        </Text>
      </View>

      {/* Start/Stop button */}
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

  playerMarker: {
    alignItems: 'center', justifyContent: 'center',
    width: 60, height: 60,
  },
  playerPulse: {
    position: 'absolute', width: 50, height: 50,
    borderRadius: 25, backgroundColor: 'rgba(244, 98, 31, 0.2)',
  },
  playerPulseCheat: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  playerDot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F4621F',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'white', elevation: 4,
    shadowColor: '#F4621F', shadowOpacity: 0.4,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  playerDotCheat: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  playerEmoji: { fontSize: 18 },
  playerRing: {
    position: 'absolute', width: 54, height: 54,
    borderRadius: 27, borderWidth: 2,
    borderColor: '#F4621F', opacity: 0.5,
  },
  playerRingCheat: {
    borderColor: '#EF4444',
  },

  otherPlayerWrap: { alignItems: 'center' },
  otherPlayerDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'white', elevation: 3,
  },
  otherPlayerEmoji: { fontSize: 16 },
  otherPlayerLabel: {
    marginTop: 2, paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 6,
  },
  otherPlayerName: { fontSize: 9, fontWeight: '700', color: 'white' },

  // Cheat warning
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

  // Movement badge
  movementBadge: {
    position: 'absolute', bottom: 120, right: 16,
    borderRadius: 12, paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center',
    gap: 6, elevation: 4,
  },
  movementEmoji: { fontSize: 16 },
  movementText: { fontSize: 11, fontWeight: '700', color: 'white' },

  // AI status
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