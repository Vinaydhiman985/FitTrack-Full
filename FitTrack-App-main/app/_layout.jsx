import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AchievementPopup from './components/AchievementPopup';
import BottomNav from './components/BottomNav';
import { AppProvider, useApp } from '../hooks';
import { STORAGE_KEYS } from '../constants';
import { api } from '../utils/api';

import AuthScreen from './index';
import SignInModal from './components/SignInModal';
import HomeScreen from './(tabs)/index';
import TerritoryScreen from './(tabs)/territory';
import TrackingScreen from './(tabs)/track';
import ShopScreen from './(tabs)/shop';
import ProfileScreen from './(tabs)/profile';

function AppShell() {
  const {
    authReady,
    authToken,
    setAuthToken,
    dark,
    toast,
    achievement,
    refreshProfile,
    refreshLeaderboard,
    refreshShop,
    logoutSession,
    signInModalVisible,
    signInModalMessage,
    hideSignInModal,
  } = useApp();
  const [loggedIn, setLoggedIn] = useState(false);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState('home');
  const [key, setKey] = useState(0);
  // Tracks which mode (login/signup) was requested from the modal
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    if (!authReady) return;

    const restoreSession = async () => {
      if (!authToken) {
        setLoggedIn(false);
        setBooting(false);
        return;
      }

      try {
        const nextUser = await refreshProfile(authToken);
        await Promise.all([
          refreshLeaderboard(authToken, nextUser?.id),
          refreshShop(authToken).catch(() => []),
        ]);
        setLoggedIn(true);
      } catch (_error) {
        await logoutSession();
        setLoggedIn(false);
      } finally {
        setBooting(false);
      }
    };

    restoreSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]); // Run ONCE when auth context is ready — not on every token change

  const nav = (s) => { setScreen(s); setKey(k => k + 1); };

  const login = async ({ mode, name, email, password }) => {
    const response = mode === 'signup'
      ? await api.register({ name, email, password })
      : await api.login({ email, password });

    await setAuthToken(response.token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    const nextUser = await refreshProfile(response.token);
    await Promise.all([
      refreshLeaderboard(response.token, nextUser?.id),
      refreshShop(response.token).catch(() => []),
    ]);
    setLoggedIn(true);
    setScreen('home');
    setAuthMode('login'); // reset mode after successful login
  };

  const logout = async () => {
    await logoutSession();
    setLoggedIn(false);
    setScreen('home');
  };

  const hideBottomNav = ['track'];
  const showNav = loggedIn && !hideBottomNav.includes(screen);

  if (booting) {
    return (
      <View style={[styles.loaderWrap, { backgroundColor: dark ? '#0F0F13' : '#F7F7FA' }]}>
        <ActivityIndicator size="large" color="#F4621F" />
        <Text style={styles.loaderText}>Loading FitTrack...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: dark ? '#0F0F13' : '#F7F7FA' }]}
      edges={['top', 'left', 'right']}
    >
      {!loggedIn ? (
        <AuthScreen onLogin={login} initialMode={authMode} />
      ) : (
        <View style={styles.inner}>
          <View style={styles.screenWrap}>
            {screen === 'home'      && <HomeScreen      key={key} onNav={nav} />}
            {screen === 'territory' && <TerritoryScreen key={key} onNav={nav} />}
            {screen === 'track'     && <TrackingScreen  key={key} onNav={nav} />}
            {screen === 'shop'      && <ShopScreen      key={key} onNav={nav} />}
            {screen === 'profile'   && <ProfileScreen   key={key} onNav={nav} onLogout={logout} />}
          </View>

          {toast && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          )}

          {achievement && <AchievementPopup />}
          {showNav && <BottomNav active={screen} onNav={nav} />}
        </View>
      )}

      {/* Global Sign-In Modal — shown when a protected action is attempted */}
      <SignInModal
        visible={signInModalVisible}
        message={signInModalMessage}
        onClose={hideSignInModal}
        onSignIn={() => {
          hideSignInModal();
          setAuthMode('login');
          setLoggedIn(false);
        }}
        onSignUp={() => {
          hideSignInModal();
          setAuthMode('signup');
          setLoggedIn(false);
        }}
      />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, flexDirection: 'column' },
  screenWrap: { flex: 1, overflow: 'hidden' },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  toast: {
    position: 'absolute',
    top: 60, alignSelf: 'center',
    backgroundColor: '#141416',
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 999, zIndex: 1000, elevation: 10,
  },
  toastText: { color: 'white', fontSize: 13, fontWeight: '600' },
});
