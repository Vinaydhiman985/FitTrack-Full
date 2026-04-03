import AsyncStorage from '@react-native-async-storage/async-storage';

export const LS = {
  get: async (key, fallback = null) => {
    try {
      const v = await AsyncStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const STORAGE_KEYS = {
  USER:       'ft_user',
  TOKEN:      'ft_token',
  DARK:       'ft_dark',
  TERRITORY:  'ft_territory',
  CHALLENGES: 'ft_challenges',
};
