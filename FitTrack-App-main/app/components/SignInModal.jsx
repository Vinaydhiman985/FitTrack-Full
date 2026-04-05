import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
} from 'react-native';
import { useEffect, useRef } from 'react';

/**
 * SignInModal — shown when user tries to access a protected feature without logging in.
 *
 * Props:
 *   visible   {boolean}  — controls modal visibility
 *   onSignIn  {fn}       — called when user taps "Sign In"
 *   onSignUp  {fn}       — called when user taps "Create Account"
 *   onClose   {fn}       — called when user dismisses the modal
 *   message   {string}   — optional custom message
 */
export default function SignInModal({ visible, onSignIn, onSignUp, onClose, message }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Stop event propagation so tapping inside doesn't close */}
          <TouchableOpacity activeOpacity={1}>

            {/* Icon */}
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>🔐</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Sign In Required</Text>

            {/* Message */}
            <Text style={styles.message}>
              {message || 'You need to be signed in to access this feature. Join FitTrack and start conquering your city!'}
            </Text>

            {/* Buttons */}
            <TouchableOpacity style={styles.primaryBtn} onPress={onSignIn}>
              <Text style={styles.primaryBtnText}>Sign In 🚀</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={onSignUp}>
              <Text style={styles.secondaryBtnText}>Create Account 🎉</Text>
            </TouchableOpacity>

            {/* Dismiss */}
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
              <Text style={styles.dismissText}>Maybe Later</Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 16 },
    }),
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3EE',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 36 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#141416',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#F4621F',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#F4621F',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: '#F4621F',
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 14,
  },
  secondaryBtnText: {
    color: '#F4621F',
    fontSize: 15,
    fontWeight: '700',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dismissText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
});
