import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_CHALLENGES, DEFAULT_USER, STORAGE_KEYS, XP_PER_LEVEL } from '../constants';
import { api } from '../utils/api';

export const AppCtx = createContext();
export const useApp = () => useContext(AppCtx);

const BADGE_IDS = {
  FIRST_STEPS: 'first_steps',
  COINS_500: 'coins_500',
  LEVEL_5: 'level_5',
  LEGEND_BUY: 'legend_buy',
};

const dateKey = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};

const calculateStreak = (history = []) => {
  if (!history.length) return 0;
  const stepsByDate = new Map();
  history.forEach((item) => stepsByDate.set(item.date, item.steps || item.totalSteps || 0));

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = dateKey(cursor);
    const steps = stepsByDate.get(key);
    if (steps && steps > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const buildChallenges = (history = [], user = DEFAULT_USER) => {
  const today = dateKey();
  const stepsByDate = new Map(history.map((item) => [item.date, item.steps || 0]));
  const todaySteps = stepsByDate.get(today) || 0;
  const weeklySteps = history.reduce((sum, item) => sum + (item.steps || 0), 0);
  const streak = calculateStreak(history);

  return DEFAULT_CHALLENGES.map((challenge) => {
    switch (challenge.id) {
      case 'steps_daily':
        return { ...challenge, current: todaySteps, done: todaySteps >= challenge.target };
      case 'weekly_steps':
        return { ...challenge, current: weeklySteps, done: weeklySteps >= challenge.target };
      case 'streak_7':
        return { ...challenge, current: streak, done: streak >= challenge.target };
      default:
        return challenge;
    }
  });
};

const normalizeUsername = (user = {}, fallback = DEFAULT_USER) => {
  if (user.username) return user.username;
  if (user.email?.includes('@')) return user.email.split('@')[0];
  if (user.name) return user.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return fallback.username;
};

const deriveBadges = (nextUser, previousBadges = []) => {
  const badges = new Set(previousBadges);
  if ((nextUser.totalSteps || 0) >= 1000) badges.add(BADGE_IDS.FIRST_STEPS);
  if ((nextUser.coins || 0) >= 500) badges.add(BADGE_IDS.COINS_500);
  if ((nextUser.level || 0) >= 5) badges.add(BADGE_IDS.LEVEL_5);
  if ((nextUser.ownedAvatars || []).includes('legend')) badges.add(BADGE_IDS.LEGEND_BUY);
  return Array.from(badges);
};

const normalizeUser = (incoming = {}, previous = DEFAULT_USER) => {
  const totalSteps = incoming.totalSteps ?? previous.totalSteps ?? 0;
  const selectedAvatar = incoming.selectedAvatar ?? incoming.avatar ?? previous.selectedAvatar ?? 'blaze';
  const ownedAvatars = Array.from(new Set(incoming.ownedAvatars ?? previous.ownedAvatars ?? ['blaze']));

  const nextUser = {
    ...DEFAULT_USER,
    ...previous,
    ...incoming,
    id: incoming.id ?? incoming._id ?? previous.id ?? null,
    name: incoming.name ?? previous.name,
    email: incoming.email ?? previous.email ?? '',
    username: normalizeUsername(incoming, previous),
    selectedAvatar,
    avatar: selectedAvatar,
    ownedAvatars,
    totalSteps,
    distance: incoming.distance ?? Number((totalSteps * 0.000762).toFixed(1)),
    stepsHistory: incoming.stepsHistory ?? previous.stepsHistory ?? [],
    rank: incoming.rank ?? previous.rank ?? null,
    settings: incoming.settings ?? previous.settings ?? DEFAULT_USER.settings,
    profilePic: incoming.profilePic ?? previous.profilePic ?? null,
  };

  nextUser.badges = incoming.badges ?? deriveBadges(nextUser, previous.badges);
  return nextUser;
};

const normalizeLeaderboard = (entries = [], currentUserId) =>
  entries.map((entry) => ({
    ...entry,
    avatar: entry.avatar || 'blaze',
    steps: entry.steps ?? entry.totalSteps ?? 0,
    totalSteps: entry.totalSteps ?? entry.steps ?? 0,
    level: entry.level ?? 1,
    zones: entry.zones || 0,
    pct: entry.pct || 0,
    isUser: Boolean(currentUserId) && (entry.id ?? entry._id)?.toString() === currentUserId?.toString(),
  }));

export function AppProvider({ children }) {
  const [dark, setDark] = useState(false);
  const [user, setUserRaw] = useState(DEFAULT_USER);
  const [authToken, setAuthTokenRaw] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [shopAvatars, setShopAvatars] = useState([]);
  const [territory, setTerritoryRaw] = useState([]);
  const [challenges, setChallengesRaw] = useState(buildChallenges([], DEFAULT_USER));
  const [toast, setToast] = useState(null);
  const [achievement, setAchievement] = useState(null);
  const [xpFloats, setXpFloats] = useState([]);
  const toastRef = useRef();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [darkVal, userVal, challVal, tokenVal, picVal] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DARK),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.CHALLENGES),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem('ft_profile_pic'),
        ]);

        if (darkVal) setDark(JSON.parse(darkVal));
        const parsedUser = userVal ? JSON.parse(userVal) : {};
        // Merge the profile pic into user so every screen sees it
        const mergedUser = { ...parsedUser, profilePic: picVal || parsedUser.profilePic || null };
        setUserRaw(normalizeUser(mergedUser, DEFAULT_USER));
        if (challVal) {
          try {
            setChallengesRaw(JSON.parse(challVal));
          } catch {
            setChallengesRaw(buildChallenges([], DEFAULT_USER));
          }
        } else {
          setChallengesRaw(buildChallenges([], DEFAULT_USER));
        }
        if (tokenVal) setAuthTokenRaw(tokenVal);
      } catch (e) {
      } finally {
        setAuthReady(true);
      }
    };
    loadData();
  }, []);

  const setUser = useCallback((u) => {
    setUserRaw((currentUser) => {
      const resolved = typeof u === 'function' ? u(currentUser) : u;
      if (!resolved) return currentUser;
      const nextUser = normalizeUser(resolved, currentUser);
      try {
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser));
      } catch (e) {}
      return nextUser;
    });
  }, []);

  const setAuthToken = useCallback(async (token) => {
    setAuthTokenRaw(token || null);
    try {
      if (token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      }
    } catch (e) {}
  }, []);

  const setTerritory = useCallback((t) => {
    if (!t || !Array.isArray(t)) return;
    setTerritoryRaw(t);
  }, []);

  const setChallenges = useCallback((c) => {
    if (!c) return;
    setChallengesRaw(c);
    try {
      AsyncStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(c));
    } catch (e) {}
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const addXpFloat = useCallback((x, y, val) => {
    const id = Date.now();
    setXpFloats((f) => [...f, { id, x, y, val }]);
    setTimeout(() => setXpFloats((f) => f.filter((i) => i.id !== id)), 1600);
  }, []);

  const addCoins = useCallback((amt) => {
    if (!amt) return;
    setUser((u) => ({ ...u, coins: (u.coins || 0) + amt }));
  }, [setUser]);

  const addXp = useCallback((amt) => {
    if (!amt) return;
    setUser((u) => {
      let nx = (u.xp || 0) + amt;
      let nl = u.level || 1;
      let leveled = false;

      while (nx >= XP_PER_LEVEL) {
        nx -= XP_PER_LEVEL;
        nl += 1;
        leveled = true;
      }

      if (leveled) {
        setAchievement({
          icon: '⚡',
          title: `Level Up! You're Level ${nl}!`,
          sub: 'Keep conquering territory!',
          xp: 0,
        });
      }

      return { ...u, xp: nx, level: nl };
    });
  }, [setUser]);

  const toggleDark = () => {
    const newDark = !dark;
    setDark(newDark);
    try {
      AsyncStorage.setItem(STORAGE_KEYS.DARK, JSON.stringify(newDark));
    } catch (e) {}
  };

  const refreshProfile = useCallback(async (tokenOverride) => {
    const token = tokenOverride || authToken;
    if (!token) return null;

    const [profileResponse, historyResponse] = await Promise.all([
      api.getProfile(token),
      api.getStepsHistory(token).catch(() => ({ data: [] })),
    ]);

    const history = historyResponse.data || profileResponse.data?.stepsHistory || [];
    const nextUser = normalizeUser(
      {
        ...profileResponse.data,
        stepsHistory: history,
      },
      user
    );

    const withStreak = { ...nextUser, streak: calculateStreak(history) };

    setUser(withStreak);
    setChallenges(buildChallenges(history, withStreak));
    return withStreak;
  }, [authToken, setChallenges, setUser, user]);

  const refreshLeaderboard = useCallback(async (tokenOverride, currentUserId) => {
    const token = tokenOverride || authToken;
    if (!token) return [];

    const response = await api.getLeaderboard(token);
    const nextLeaderboard = normalizeLeaderboard(response.data || [], currentUserId || user.id || user._id);
    setLeaderboard(nextLeaderboard);
    return nextLeaderboard;
  }, [authToken, user.id, user._id]);

  const refreshShop = useCallback(async (tokenOverride) => {
    const token = tokenOverride || authToken;
    if (!token) return [];

    const response = await api.getAvatars(token);
    setShopAvatars(response.data || []);
    if (typeof response.coins === 'number') {
      setUser((current) => ({ ...current, coins: response.coins }));
    }
    return response.data || [];
  }, [authToken, setUser]);

  const logoutSession = useCallback(async () => {
    await setAuthToken(null);
    setUserRaw({ ...DEFAULT_USER });
    setLeaderboard([]);
    setShopAvatars([]);
    setChallengesRaw(buildChallenges([], DEFAULT_USER));
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.CHALLENGES, 'ft_profile_pic']);
    } catch (e) {}
  }, [setAuthToken]);

  return (
    <AppCtx.Provider value={{
      authReady,
      authToken,
      setAuthToken,
      dark,
      toggleDark,
      user,
      setUser,
      leaderboard,
      setLeaderboard,
      refreshLeaderboard,
      shopAvatars,
      setShopAvatars,
      refreshShop,
      refreshProfile,
      logoutSession,
      territory,
      setTerritory,
      challenges,
      setChallenges,
      toast,
      showToast,
      achievement,
      setAchievement,
      xpFloats,
      addXpFloat,
      addCoins,
      addXp,
    }}>
      {children}
    </AppCtx.Provider>
  );
}
