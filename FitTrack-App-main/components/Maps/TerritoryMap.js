import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

export default function TerritoryMap({
  dark,
  latitude,
  longitude,
  isTracking,
  cellCount,
  cells,
  gridToPolygon,
  mapRef
}) {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      userInterfaceStyle={dark ? 'dark' : 'light'}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title="Your Area"
        description={`${cellCount} units captured`}
      >
        <View style={styles.playerMarker}>
          <View style={styles.playerDot} />
          {isTracking && <View style={styles.playerRing} />}
        </View>
      </Marker>

      {Object.keys(cells).map((cell) => (
        <Polygon
          key={cell}
          coordinates={gridToPolygon(cell)}
          fillColor="rgba(244, 98, 31, 0.4)"
          strokeColor="#F4621F"
          strokeWidth={1}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  playerMarker: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40 },
  playerDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#F4621F', borderWidth: 2, borderColor: '#fff' },
  playerRing: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#F4621F', opacity: 0.4 },
});
