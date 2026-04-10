import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AVATAR_CONFIGS } from '../constants';

/**
 * Human-style walking avatar with:
 *  - Round head with face emoji
 *  - Neck
 *  - Torso (shirt color)
 *  - Two animated arms swinging opposite
 *  - Two animated legs swinging opposite
 *  - Shoes
 *  - Floating effect particle above head
 *  - Bob / bounce animation
 */
export default function WalkingAvatar({ type = 'blaze', size = 1, showRing = false, showName = false, onPress }) {
  const cfg = AVATAR_CONFIGS?.[type] || AVATAR_CONFIGS?.blaze;

  // Animations
  const bobAnim   = useRef(new Animated.Value(0)).current;
  const armLAnim  = useRef(new Animated.Value(0)).current;
  const armRAnim  = useRef(new Animated.Value(1)).current;
  const legLAnim  = useRef(new Animated.Value(0)).current;
  const legRAnim  = useRef(new Animated.Value(1)).current;
  const effectAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const STEP = 340;

    // Body bob
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: -4 * size, duration: STEP, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0,         duration: STEP, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Arms (opposite phase)
    Animated.loop(
      Animated.sequence([
        Animated.timing(armLAnim, { toValue: 1, duration: STEP, useNativeDriver: true }),
        Animated.timing(armLAnim, { toValue: 0, duration: STEP, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(armRAnim, { toValue: 0, duration: STEP, useNativeDriver: true }),
        Animated.timing(armRAnim, { toValue: 1, duration: STEP, useNativeDriver: true }),
      ])
    ).start();

    // Legs (opposite phase)
    Animated.loop(
      Animated.sequence([
        Animated.timing(legLAnim, { toValue: 1, duration: STEP, useNativeDriver: true }),
        Animated.timing(legLAnim, { toValue: 0, duration: STEP, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(legRAnim, { toValue: 0, duration: STEP, useNativeDriver: true }),
        Animated.timing(legRAnim, { toValue: 1, duration: STEP, useNativeDriver: true }),
      ])
    ).start();

    // Floating effect particle
    Animated.loop(
      Animated.sequence([
        Animated.timing(effectAnim, { toValue: -6, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(effectAnim, { toValue:  0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Interpolated rotations
  const armLRotate = armLAnim.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '30deg'] });
  const armRRotate = armRAnim.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '30deg'] });
  const legLRotate = legLAnim.interpolate({ inputRange: [0, 1], outputRange: ['-22deg', '22deg'] });
  const legRRotate = legRAnim.interpolate({ inputRange: [0, 1], outputRange: ['-22deg', '22deg'] });

  // Sizes
  const S = {
    head:      Math.round(34 * size),
    neck:      Math.round(6  * size),
    neckW:     Math.round(10 * size),
    torsoW:    Math.round(22 * size),
    torsoH:    Math.round(20 * size),
    armW:      Math.round(7  * size),
    armH:      Math.round(18 * size),
    forearmH:  Math.round(12 * size),
    legW:      Math.round(9  * size),
    legH:      Math.round(20 * size),
    shoeW:     Math.round(12 * size),
    shoeH:     Math.round(6  * size),
    ringPad:   8 * size,
  };

  if (!cfg) return null;

  const skinTone = cfg.skin || '#FDBCB4';
  const shirtColor = cfg.color;
  const pantColor = cfg.pantColor || '#374151';
  const shoeColor = cfg.shoeColor || '#1F2937';
  const hairColor = cfg.hairColor || '#1F2937';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.wrap}>

      {/* Glow ring for equipped */}
      {showRing && (
        <View style={[styles.ring, {
          width:  S.head + S.ringPad * 2 + 8,
          height: S.head + S.ringPad * 2 + 8,
          borderRadius: (S.head + S.ringPad * 2 + 8) / 2,
          borderColor: cfg.color,
        }]} />
      )}

      {/* Floating effect particle */}
      {cfg.effect && (
        <Animated.Text style={[styles.effect, {
          fontSize: 14 * size,
          transform: [{ translateY: effectAnim }],
        }]}>
          {cfg.effect}
        </Animated.Text>
      )}

      {/* Entire body bobs up/down */}
      <Animated.View style={[{ transform: [{ translateY: bobAnim }] }, { alignItems: 'center' }]}>

        {/* ── HEAD ── */}
        <View style={[styles.head, {
          width: S.head,
          height: S.head,
          borderRadius: S.head / 2,
          backgroundColor: skinTone,
        }]}>
          {/* Hair */}
          <View style={[styles.hair, {
            width: S.head,
            height: S.head * 0.45,
            borderTopLeftRadius:  S.head / 2,
            borderTopRightRadius: S.head / 2,
            backgroundColor: hairColor,
          }]} />
          {/* Face emoji */}
          <Text style={{ fontSize: Math.round(16 * size), marginTop: 4 }}>{cfg.face}</Text>
        </View>

        {/* ── NECK ── */}
        <View style={{
          width: S.neckW,
          height: S.neck,
          backgroundColor: skinTone,
          zIndex: 1,
        }} />

        {/* ── TORSO + ARMS row ── */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>

          {/* Left arm */}
          <View style={{ alignItems: 'center', marginTop: 2 }}>
            <Animated.View style={[styles.limb, {
              width: S.armW,
              height: S.armH,
              backgroundColor: shirtColor,
              borderRadius: S.armW / 2,
              transform: [{ rotate: armLRotate }],
              transformOrigin: 'top',
            }]} />
            {/* Hand */}
            <View style={[styles.hand, {
              width: S.armW + 1,
              height: S.armW + 1,
              borderRadius: (S.armW + 1) / 2,
              backgroundColor: skinTone,
              marginTop: -4 * size,
            }]} />
          </View>

          {/* Torso */}
          <View style={[styles.torso, {
            width: S.torsoW,
            height: S.torsoH,
            backgroundColor: shirtColor,
            borderRadius: 5 * size,
            marginHorizontal: 3 * size,
          }]}>
            {cfg.shirtIcon && (
              <Text style={{ fontSize: 9 * size }}>{cfg.shirtIcon}</Text>
            )}
          </View>

          {/* Right arm */}
          <View style={{ alignItems: 'center', marginTop: 2 }}>
            <Animated.View style={[styles.limb, {
              width: S.armW,
              height: S.armH,
              backgroundColor: shirtColor,
              borderRadius: S.armW / 2,
              transform: [{ rotate: armRRotate }],
              transformOrigin: 'top',
            }]} />
            {/* Hand */}
            <View style={[styles.hand, {
              width: S.armW + 1,
              height: S.armW + 1,
              borderRadius: (S.armW + 1) / 2,
              backgroundColor: skinTone,
              marginTop: -4 * size,
            }]} />
          </View>
        </View>

        {/* ── LEGS ── */}
        <View style={{ flexDirection: 'row', gap: 3 * size, marginTop: 1 }}>

          {/* Left leg */}
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={[styles.limb, {
              width: S.legW,
              height: S.legH,
              backgroundColor: pantColor,
              borderRadius: S.legW / 2,
              transform: [{ rotate: legLRotate }],
              transformOrigin: 'top',
            }]} />
            {/* Shoe */}
            <View style={[styles.shoe, {
              width: S.shoeW,
              height: S.shoeH,
              backgroundColor: shoeColor,
              borderRadius: 3 * size,
              marginTop: -3 * size,
            }]} />
          </View>

          {/* Right leg */}
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={[styles.limb, {
              width: S.legW,
              height: S.legH,
              backgroundColor: pantColor,
              borderRadius: S.legW / 2,
              transform: [{ rotate: legRRotate }],
              transformOrigin: 'top',
            }]} />
            {/* Shoe */}
            <View style={[styles.shoe, {
              width: S.shoeW,
              height: S.shoeH,
              backgroundColor: shoeColor,
              borderRadius: 3 * size,
              marginTop: -3 * size,
            }]} />
          </View>
        </View>

        {/* ── GROUND SHADOW ── */}
        <View style={[styles.shadow, { width: 28 * size }]} />

      </Animated.View>

      {/* Name label */}
      {showName && (
        <Text style={[styles.name, { fontSize: 10 * size, color: cfg.color }]}>
          {cfg.name}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    top: 12,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    zIndex: 0,
  },
  effect: {
    position: 'absolute',
    top: -4,
    zIndex: 10,
  },
  head: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    zIndex: 2,
  },
  hair: {
    position: 'absolute',
    top: 0,
  },
  torso: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  limb: {
    transformOrigin: 'top',
  },
  hand: {},
  shoe: {},
  shadow: {
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 999,
    marginTop: 4,
  },
  name: {
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});