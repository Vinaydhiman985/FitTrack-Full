import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Avatar3DViewer — visual preview card shown in the shop modal.
 *
 * expo-three / GLTFLoader is not reliable on all Expo SDK versions,
 * so we use an animated 2D card instead. The card shows:
 *  - a rotating glow ring
 *  - the avatar preview image (previewStill) if provided
 *  - a large emoji + name fallback otherwise
 *  - a pulsing "Live Preview" badge
 *
 * Props:
 *   modelUrl    {string}  — kept for API compat (unused in 2D mode)
 *   background  {string}  — card background colour
 *   cfg         {object}  — AVATAR_CONFIGS entry (name, color, previewStill, effect)
 */
export default function Avatar3DViewer({
  modelUrl,
  background = '#0B1220',
  cfg = {},
}) {
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow spin for the glow ring
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Subtle pulse on the badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.14, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();

    // Float the avatar up & down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, [spinAnim, pulseAnim, floatAnim]);

  const spin = spinAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const accentColor = cfg.color || '#F59E0B';
  const avatarName  = cfg.name  || 'Avatar';
  const emoji       = cfg.effect || '⚡';

  return (
    <View style={[styles.wrap, { backgroundColor: background }]}>

      {/* Radial glow backdrop */}
      <View style={[styles.glow, { shadowColor: accentColor }]} />

      {/* Spinning ring */}
      <Animated.View
        style={[
          styles.ring,
          { borderColor: accentColor, transform: [{ rotate: spin }] },
        ]}
      />

      {/* Avatar content */}
      <Animated.View style={[styles.avatarBox, { transform: [{ translateY: floatAnim }] }]}>
        {cfg.previewStill ? (
          <Image
            source={{ uri: cfg.previewStill }}
            style={styles.avatarImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.emojiCircle, { backgroundColor: accentColor + '22', borderColor: accentColor }]}>
            <Text style={styles.emojiText}>{emoji}</Text>
          </View>
        )}
      </Animated.View>

      {/* Name */}
      <Text style={[styles.name, { color: accentColor }]}>{avatarName}</Text>
      {cfg.desc ? (
        <Text style={styles.desc} numberOfLines={2}>{cfg.desc}</Text>
      ) : null}

      {/* "Live Preview" badge */}
      <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.badgeText}>✦ Live Preview</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 320,
    borderRadius: 18,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    shadowOpacity: 0.55,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.35,
  },
  avatarBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 56,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  desc: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 15,
    marginBottom: 8,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
