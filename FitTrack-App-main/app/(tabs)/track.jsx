import * as Location from 'expo-location';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useApp } from '../../hooks';
import { useTracking } from '../../hooks/useTracking';

export default function TrackingScreen({ onNav }) {
  const { dark } = useApp();
  const { steps, running, time, xpEarned, distance, pace, formatTime, toggle } = useTracking();
  const locationRef = useRef(null);
  const mapRef = useRef(null);
  const [trackLocation, setTrackLocation] = useState(null);
  const [trackRoute, setTrackRoute] = useState([]);

  useEffect(() => {
    const startLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const current = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setTrackLocation(coords);
      setTrackRoute([coords]);

      locationRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (loc) => {
          const newCoords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setTrackLocation(newCoords);
          setTrackRoute(prev => [...prev, newCoords]);

          // Move map to follow player
          mapRef.current?.animateToRegion({
            latitude: newCoords.latitude,
            longitude: newCoords.longitude,
            latitudeDelta: 0.003,
            longitudeDelta: 0.003,
          }, 500);
        }
      );
    };
    startLocation();
    return () => {
      if (locationRef.current) locationRef.current.remove();
    };
  }, []);

  const stats = [
    { label: 'Distance', val: `${distance} km`, color: '#F4621F' },
    { label: 'Time', val: formatTime(time), color: '#fff' },
    { label: 'Pace', val: `${pace} min/km`, color: '#F59E0B' },
    { label: 'XP Earned', val: `+${xpEarned}`, color: '#7C3AED' },
  ];

  const milestones = [
    { label: '1k Steps',  icon: steps >= 1000  ? '✅' : '👟', color: '#16A34A', pct: Math.round(steps / 1000  * 100), done: steps >= 1000  },
    { label: '5k Steps',  icon: steps >= 5000  ? '🔥' : '🔥', color: '#F4621F', pct: Math.round(steps / 5000  * 100), xp: 200 },
    { label: '8k Goal',   icon: steps >= 8000  ? '🥇' : '⭐', color: '#7C3AED', pct: Math.round(steps / 8000  * 100), xp: 500 },
    { label: '15k Elite', icon: steps >= 15000 ? '👑' : '🪙', color: '#F59E0B', pct: Math.round(steps / 15000 * 100), xp: 1000 },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNav('home')}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Real Mini Map */}
      <View style={styles.miniMap}>
        {trackLocation ? (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: trackLocation.latitude,
                longitude: trackLocation.longitude,
                latitudeDelta: 0.003,
                longitudeDelta: 0.003,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              userInterfaceStyle={dark ? 'dark' : 'light'}
            >
              {/* Route line */}
              {trackRoute.length > 1 && (
                <Polyline
                  coordinates={trackRoute}
                  strokeColor="#F4621F"
                  strokeWidth={4}
                />
              )}

              {/* Start point */}
              {trackRoute.length > 0 && (
                <Marker coordinate={trackRoute[0]} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={styles.startDot} />
                </Marker>
              )}

              {/* Player position */}
              <Marker coordinate={trackLocation} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.miniPlayerWrap}>
                  <View style={styles.miniPlayerPulse} />
                  <View style={styles.miniPlayerDot}>
                    <Text style={styles.miniPlayerEmoji}>🏃</Text>
                  </View>
                </View>
              </Marker>
            </MapView>

            {/* Location badge */}
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>📍 Live Route</Text>
            </View>

            {/* Route length badge */}
            <View style={styles.routeLengthBadge}>
              <Text style={styles.routeLengthText}>{distance} km</Text>
            </View>
          </>
        ) : (
          <View style={styles.miniMapLoading}>
            <ActivityIndicator color="#F4621F" />
            <Text style={styles.miniMapLoadingText}>Getting location...</Text>
          </View>
        )}
      </View>


      {/* Steps counter */}
      <View style={styles.stepsWrap}>
        <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
        <Text style={styles.stepsLabel}>STEPS</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {stats.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label.toUpperCase()}</Text>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
          </View>
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Map button */}
        <TouchableOpacity 
          style={styles.sideBtn} 
          onPress={() => onNav('map')}
        >
          <Text style={styles.sideBtnText}>🗺️</Text>
          <Text style={styles.sideBtnLabel}>Map</Text>
        </TouchableOpacity>

        {/* Play/Pause button */}
        <TouchableOpacity style={styles.mainBtn} onPress={toggle}>
          <Text style={styles.mainBtnText}>{running ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* Stop button */}
        <TouchableOpacity 
          style={[styles.sideBtn, styles.stopBtn]} 
          onPress={() => {
            toggle(); // stop tracking
            onNav('home'); // go back home
          }}
        >
          <Text style={styles.sideBtnText}>⏹</Text>
          <Text style={styles.sideBtnLabel}>Stop</Text>
        </TouchableOpacity>
      </View>

      {/* Milestones */}
      <View style={styles.milestones}>
        <Text style={styles.milestonesTitle}>MILESTONES</Text>
        {milestones.map((m, i) => (
          <View key={i} style={styles.milestoneRow}>
            <Text style={styles.milestoneIcon}>{m.icon}</Text>
            <View style={styles.milestoneInfo}>
              <View style={styles.milestoneLabelRow}>
                <Text style={styles.milestoneLabel}>{m.label}</Text>
                {m.xp && <Text style={[styles.milestoneXp, { color: m.color }]}>+{m.xp} XP</Text>}
              </View>
              <View style={styles.milestoneTrack}>
                <View style={[styles.milestoneFill, { width: `${Math.min(100, m.pct)}%`, backgroundColor: m.color }]} />
              </View>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#141416' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },

  // Mini map
  miniMap: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 175,
    backgroundColor: '#1a2535',
    position: 'relative',
  },
  map: { width: '100%', height: '100%' },
  miniMapLoading: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  miniMapLoadingText: {
    color: 'rgba(255,255,255,0.6)', fontSize: 12,
  },
  locationBadge: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(20,20,22,0.8)',
    borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  locationText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600' },
  routeLengthBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(244,98,31,0.9)',
    borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  routeLengthText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Player markers
  miniPlayerWrap: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  miniPlayerPulse: {
    position: 'absolute',
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(244,98,31,0.25)',
  },
  miniPlayerDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F4621F',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'white',
  },
  miniPlayerEmoji: { fontSize: 13 },
  startDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#16A34A',
    borderWidth: 2, borderColor: 'white',
  },

  banner: {
    marginHorizontal: 20, marginVertical: 12,
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 14, padding: 12,
  },
  bannerTitle: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 },

  stepsWrap: { alignItems: 'center', paddingVertical: 16 },
  stepsCount: { fontSize: 64, fontWeight: '800', color: '#fff', lineHeight: 64 },
  stepsLabel: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: 4 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginHorizontal: 20, marginBottom: 8,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 6 },
  statVal: { fontSize: 20, fontWeight: '800' },

  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 20, paddingVertical: 16,
  },
  sideBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  sideBtnText: { fontSize: 20 },
  sideBtnLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginTop: 3,
  },
  stopBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  mainBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F4621F',
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#F4621F',
    shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  mainBtnText: { fontSize: 28, color: '#fff' },

  milestones: { padding: 20, paddingBottom: 100 },
  milestonesTitle: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 10 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  milestoneIcon: { fontSize: 18, width: 24 },
  milestoneInfo: { flex: 1 },
  milestoneLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  milestoneLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  milestoneXp: { fontSize: 11, fontWeight: '700' },
  milestoneTrack: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999, height: 5, overflow: 'hidden',
  },
  milestoneFill: { height: '100%', borderRadius: 999 },
});