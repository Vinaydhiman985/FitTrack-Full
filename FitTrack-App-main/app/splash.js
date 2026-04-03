import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.emoji, { transform: [{ scale: scaleAnim }] }]}>
        🏃
      </Animated.Text>
      <Text style={styles.title}>FitTrack</Text>
      <Text style={styles.sub}>Conquer your city</Text>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4621F',
  },
  emoji: { fontSize: 72, marginBottom: 16 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  sub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  progressTrack: {
    marginTop: 48,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});