import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function TrackMap({
  dark,
  region,
  routeCoords,
  onRegionChangeComplete
}) {
  return (
    <MapView
      style={styles.map}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      userInterfaceStyle={dark ? 'dark' : 'light'}
    >
      {routeCoords.length > 1 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor="#F4621F"
          strokeWidth={5}
        />
      )}
      <Marker coordinate={region}>
        <View style={styles.playerMarker}>
          <View style={styles.playerDot} />
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  playerMarker: { alignItems: 'center', justifyContent: 'center', width: 30, height: 30 },
  playerDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#F4621F', borderWidth: 2, borderColor: '#fff' },
});
