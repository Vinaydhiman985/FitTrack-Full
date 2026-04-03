import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

export default function MapPreview({ dark }) {
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // First try cached location (much faster!)
        const cached = await Location.getLastKnownPositionAsync({});
        if (cached && mounted) {
          setLocation(cached.coords);
          return;
        }
        // Fall back to fresh location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !mounted) return;
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // faster than High
        });
        if (mounted) setLocation(current.coords);
      } catch (e) {

      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!location) {
    return (
      <View style={[styles.container, { backgroundColor: dark ? '#1a2535' : '#e8f0dc' }]}>
        <ActivityIndicator color="#F4621F" size="small" />
        <Text style={[styles.loadingText, { color: dark ? 'rgba(255,255,255,0.5)' : '#6B7280' }]}>
          Loading map...
        </Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      userInterfaceStyle={dark ? 'dark' : 'light'}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      showsUserLocation={true}
      showsPointsOfInterest={false}
      showsBuildings={false}
      showsTraffic={false}
      showsIndoors={false}
      loadingEnabled={true}
      loadingIndicatorColor="#F4621F"
    >
      <Marker
        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.playerDot}>
          <Text style={styles.playerEmoji}>🏃</Text>
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  container: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  loadingText: { fontSize: 12 },
  playerDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F4621F',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'white',
  },
  playerEmoji: { fontSize: 16 },
});