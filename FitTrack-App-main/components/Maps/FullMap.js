import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';

const PLAYER_COLORS = ['#7C3AED', '#0EA5E9', '#EF4444', '#16A34A', '#F59E0B'];

export default function FullMap({
  dark,
  mapRef,
  playerPosition,
  heading,
  territory,
  gridToPolygon,
  routeCoords,
  isCheating,
  isTracking,
  nearbyPlayers
}) {
  return (
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
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  playerMarker: { alignItems: 'center', justifyContent: 'center', width: 60, height: 60 },
  playerPulse: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(244, 98, 31, 0.2)' },
  playerPulseCheat: { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
  playerDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4621F', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: 'white', elevation: 4 },
  playerDotCheat: { backgroundColor: '#EF4444' },
  playerEmoji: { fontSize: 18 },
  playerRing: { position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: '#F4621F', opacity: 0.5 },
  playerRingCheat: { borderColor: '#EF4444' },
  otherPlayerWrap: { alignItems: 'center' },
  otherPlayerDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  otherPlayerEmoji: { fontSize: 16 },
  otherPlayerLabel: { marginTop: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  otherPlayerName: { fontSize: 9, fontWeight: '700', color: 'white' },
});
