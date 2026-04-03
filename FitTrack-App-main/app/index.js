import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (m) => {
    if (loading) return;
    setMode(m);
    setErr('');
    setShowPassword(false);
  };

  const submit = async () => {
    setErr('');

    if (mode === 'signup' && (!form.name || !form.email || !form.password)) {
      setErr('Please fill in all fields');
      return;
    }

    if (mode === 'login' && (!form.email || !form.password)) {
      setErr('Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      await onLogin({ mode, ...form });
    } catch (error) {
      setErr(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <Text style={styles.headerEmoji}>🏃</Text>
          <Text style={styles.headerTitle}>FitTrack</Text>
          <Text style={styles.headerSub}>Conquer your city, one step at a time</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {['login', 'signup'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.tabItem, mode === m && styles.tabItemActive]}
                onPress={() => switchMode(m)}
                disabled={loading}
              >
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name field */}
          {mode === 'signup' && (
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Alex Chen"
                placeholderTextColor="#9CA3AF"
                value={form.name}
                onChangeText={(v) => setForm(f => ({ ...f, name: v }))}
                editable={!loading}
              />
            </View>
          )}

          {/* Email field */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="demo@fittrack.app"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(v) => setForm(f => ({ ...f, email: v }))}
              editable={!loading}
            />
          </View>

          {/* Password field with show/hide toggle */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(v) => setForm(f => ({ ...f, password: v }))}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {err ? <Text style={styles.error}>{err}</Text> : null}

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.loadingText}>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </Text>
              </View>
            ) : (
              <Text style={styles.btnText}>
                {mode === 'login' ? 'Sign In 🚀' : 'Create Account 🎉'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch mode */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'New to FitTrack? ' : 'Already have an account? '}
            </Text>
            <TouchableOpacity
              onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              disabled={loading}
            >
              <Text style={[styles.switchLink, loading && { opacity: 0.4 }]}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    backgroundColor: '#F4621F',
    height: 260,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    top: -40, left: -40,
    width: 180, height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circle2: {
    position: 'absolute',
    top: 20, right: -30,
    width: 130, height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerEmoji: { fontSize: 52, marginBottom: 8 },
  headerTitle: {
    fontSize: 28, fontWeight: '800',
    color: '#fff', textAlign: 'center',
  },
  headerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)',
    marginTop: 4, textAlign: 'center',
  },

  // Form
  form: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 28,
    marginTop: -24,
    zIndex: 1,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    padding: 3,
    marginBottom: 24,
  },
  tabItem: {
    flex: 1, paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabItemActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#141416' },

  // Fields
  field: { marginBottom: 14 },
  label: {
    fontSize: 13, fontWeight: '600',
    color: '#141416', marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: 13,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    fontSize: 15,
    color: '#141416',
    backgroundColor: '#fff',
  },

  // Password row
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    padding: 13,
    fontSize: 15,
    color: '#141416',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: { fontSize: 18 },

  // Error
  error: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },

  // Button
  btn: {
    backgroundColor: '#F4621F',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    elevation: 6,
    shadowColor: '#F4621F',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  btnDisabled: {
    opacity: 0.75,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: 'white' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },

  // Switch mode
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchText: { fontSize: 13, color: '#6B7280' },
  switchLink: { fontSize: 13, color: '#F4621F', fontWeight: '700' },
});
