import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from '../../hooks';
import { STORAGE_KEYS } from '../../constants';
import TerritoryMap from '../../components/Maps/TerritoryMap';

// Each grid cell = ~55m × 55m
const GRID_SIZE = 0.0005;

const toGridKey = (lat, lng) => {
  const r = Math.floor(lat / GRID_SIZE);
  const c = Math.floor(lng / GRID_SIZE);
  return `${r}_${c}`;
};

const gridToPolygon = (key) => {
  const [r, c] = key.split('_').map(Number);
  const lat = r * GRID_SIZE;
  const lng = c * GRID_SIZE;
  return [
    { latitude: lat,             longitude: lng             },
    { latitude: lat + GRID_SIZE, longitude: lng             },
    { latitude: lat + GRID_SIZE, longitude: lng + GRID_SIZE },
    { latitude: lat,             longitude: lng + GRID_SIZE },
  ];
};

const getAdjacentKeys = (key) => {
  const [r, c] = key.split('_').map(Number);
  return [
    `${r-1}_${c}`, `${r+1}_${c}`,
    `${r}_${c-1}`, `${r}_${c+1}`,
  ];
};

const CELL_AREA_M2 = GRID_SIZE * 111320 * GRID_SIZE * 111320;

const formatArea = (cellCount) => {
  const m2 = cellCount * CELL_AREA_M2;
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`;
  if (m2 >= 10_000)    return `${(m2 / 10_000).toFixed(1)} ha`;
  return `${Math.round(m2)} m²`;
};

export default function TerritoryScreen({ onNav }) {
  const { dark, user } = useApp();
  const mapRef          = useRef(null);
  const locationSubRef  = useRef(null);

  const [location,    setLocation]    = useState(null);
  const [isTracking,  setIsTracking]  = useState(false);
  const [errorMsg,    setErrorMsg]    = useState(null);
  const [cells,       setCells]       = useState({});   // { gridKey: true }
  const [pathCoords,  setPathCoords]  = useState([]);   // walk trail coords

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.TERRITORY);
        if (saved) setCells(JSON.parse(saved));
      } catch (_) {}
    };
    load();
    requestPermission();
    return () => {
      if (locationSubRef.current) locationSubRef.current.remove();
    };
  }, []);

  useEffect(() => {
    if (Object.keys(cells).length === 0) return;
    AsyncStorage.setItem(STORAGE_KEYS.TERRITORY, JSON.stringify(cells)).catch(() => {});
  }, [cells]);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Location permission denied. Enable it to use the territory map.');
      return;
    }
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(current);
    } catch (e) {
      setErrorMsg('Could not get your location. Make sure GPS is enabled.');
    }
  };

  const startTracking = useCallback(async () => {
    setIsTracking(true);
    setPathCoords([]);

    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy:         Location.Accuracy.High,
        timeInterval:     1500,
        distanceInterval: 3,
      },
      (loc) => {
        setLocation(loc);
        const { latitude, longitude } = loc.coords;

        const centerKey = toGridKey(latitude, longitude);
        setCells(prev => {
          const next = { ...prev };
          next[centerKey] = true;
          getAdjacentKeys(centerKey).forEach(k => {
            next[k] = true;
          });
          return next;
        });

        setPathCoords(trail => [...trail, { latitude, longitude }]);

        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta:  0.006,
          longitudeDelta: 0.006,
        }, 600);
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  }, []);

  const clearTerritory = () => {
    const handleClear = async () => {
      setCells({});
      setPathCoords([]);
      await AsyncStorage.removeItem(STORAGE_KEYS.TERRITORY);
    };

    Alert.alert(
      'Clear Territory',
      'This will erase all your claimed cells. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: handleClear },
      ]
    );
  };

  const cellCount = Object.keys(cells).length;
  const area      = formatArea(cellCount);

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>📍</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={requestPermission}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingEmoji}>📡</Text>
        <Text style={styles.loadingText}>Locating you…</Text>
      </View>
    );
  }

  const { latitude, longitude } = location.coords;

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#0D1117' : '#F7F7FA' }]}>

      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, { backgroundColor: isTracking ? '#22C55E' : '#EF4444' }]} />
          <Text style={[styles.liveText, { color: isTracking ? '#22C55E' : '#EF4444' }]}>
            {isTracking ? 'CLAIMING' : 'GPS LIVE'}
          </Text>
        </View>
        <Text style={[styles.coordText, { color: dark ? '#9BA1A6' : '#6B7280' }]}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
        <TouchableOpacity
          style={styles.centerBtn}
          onPress={() => mapRef.current?.animateToRegion({
            latitude, longitude,
            latitudeDelta: 0.008, longitudeDelta: 0.008,
          })}
        >
          <Text style={styles.centerBtnText}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* ── MAP ── */}
      <View style={styles.mapWrap}>
        <TerritoryMap 
          dark={dark}
          latitude={latitude}
          longitude={longitude}
          isTracking={isTracking}
          cellCount={cellCount}
          cells={cells}
          gridToPolygon={gridToPolygon}
          mapRef={mapRef}
        />

        <View style={styles.cellBadge}>
          <Text style={styles.cellBadgeTitle}>{cellCount}</Text>
          <Text style={styles.cellBadgeSub}>cells</Text>
        </View>
      </View>

      {/* ── STATS PANEL ── */}
      <View style={[styles.statsPanel, { backgroundColor: dark ? 'rgba(10,12,18,0.97)' : 'rgba(255,255,255,0.97)' }]}>
        <View style={styles.statsPanelTop}>
          <View>
            <Text style={[styles.statLabel, { color: dark ? '#9BA1A6' : '#6B7280' }]}>Your Territory</Text>
            <Text style={styles.statArea}>{area}</Text>
            <Text style={[styles.statCells, { color: dark ? '#9BA1A6' : '#6B7280' }]}>{cellCount} cells claimed</Text>
          </View>
          <View style={styles.statMeta}>
            <View style={styles.statMetaRow}>
              <Text style={[styles.statMetaVal, { color: dark ? '#F0F0F5' : '#141416' }]}>{(user?.totalSteps || 0).toLocaleString()}</Text>
              <Text style={[styles.statMetaLabel, { color: dark ? '#9BA1A6' : '#6B7280' }]}>steps</Text>
            </View>
            <View style={styles.statMetaRow}>
              <Text style={[styles.statMetaVal, { color: dark ? '#F0F0F5' : '#141416' }]}>{(user?.distance || 0).toFixed(1)}</Text>
              <Text style={[styles.statMetaLabel, { color: dark ? '#9BA1A6' : '#6B7280' }]}>km</Text>
            </View>
          </View>
        </View>

        <View style={[styles.progressBg, { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]}>
          <View style={[styles.progressFill, { width: cellCount === 0 ? '0%' : `${Math.min(100, (cellCount / 500) * 100).toFixed(1)}%` }]} />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.trackBtn, isTracking && styles.trackBtnStop]}
            onPress={isTracking ? stopTracking : startTracking}
          >
            <Text style={styles.trackBtnText}>{isTracking ? '⏹ Stop Claiming' : '▶ Start Claiming'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walkBtn} onPress={() => onNav('track')}>
            <Text style={styles.walkBtnText}>🚶</Text>
          </TouchableOpacity>
          {cellCount > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearTerritory}>
              <Text style={styles.clearBtnText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingEmoji: { fontSize: 40 },
  loadingText:  { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  errorEmoji:   { fontSize: 40 },
  errorText:    { fontSize: 15, color: '#EF4444', textAlign: 'center', lineHeight: 22 },
  retryBtn: { marginTop: 8, backgroundColor: '#F4621F', borderRadius: 999, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '700' },
  coordText: { flex: 1, fontSize: 10, fontWeight: '500' },
  centerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(244,98,31,0.15)', alignItems: 'center', justifyContent: 'center' },
  centerBtnText: { fontSize: 18 },
  mapWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  cellBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(10,12,18,0.85)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  cellBadgeTitle: { fontSize: 18, fontWeight: '900', color: '#F4621F' },
  cellBadgeSub: { fontSize: 10, color: '#9BA1A6', fontWeight: '600' },
  statsPanel: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statsPanelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  statArea: { fontSize: 26, fontWeight: '900', color: '#F4621F', lineHeight: 30 },
  statCells: { fontSize: 11, marginTop: 3 },
  statMeta: { gap: 8, alignItems: 'flex-end' },
  statMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statMetaVal: { fontSize: 16, fontWeight: '800' },
  statMetaLabel: { fontSize: 11, fontWeight: '500' },
  progressBg: { height: 6, borderRadius: 999, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#F4621F', borderRadius: 999 },
  btnRow: { flexDirection: 'row', gap: 10 },
  trackBtn: { flex: 1, backgroundColor: '#F4621F', borderRadius: 999, paddingVertical: 13, alignItems: 'center' },
  trackBtnStop: { backgroundColor: '#EF4444' },
  trackBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
  walkBtn: { width: 48, backgroundColor: '#FFF1EB', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  walkBtnText: { fontSize: 20 },
  clearBtn: { width: 48, backgroundColor: '#FEE2E2', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { fontSize: 18 },
});