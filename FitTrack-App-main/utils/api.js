import Constants from 'expo-constants';
import { Platform } from 'react-native';

const FALLBACK_PORT = '5000';
const REQUEST_TIMEOUT_MS = 10000;

function getExpoHostUrl() {
  let url = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!url) {
    const appConfigUrl = Constants.expoConfig?.extra?.apiUrl?.trim?.();
    if (appConfigUrl) url = appConfigUrl;
  }

  if (!url) {
    const hostCandidates = [
      Constants.expoConfig?.hostUri,
      Constants.expoGoConfig?.debuggerHost,
      Constants.manifest2?.extra?.expoGo?.debuggerHost,
    ].filter(Boolean);

    if (hostCandidates.length > 0) {
      const [host] = String(hostCandidates[0]).split(':');
      if (host) url = `http://${host}:${FALLBACK_PORT}`;
    }
  }

  if (!url) {
    url = `http://localhost:${FALLBACK_PORT}`;
  }

  // FORCE FIX: On Android emulators, 'localhost' or '127.0.0.1' never works for the host machine.
  if (Platform.OS === 'android' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return `http://10.0.2.2:${FALLBACK_PORT}`;
  }

  return url;
}

export const API_BASE_URL = getExpoHostUrl().replace(/\/+$/, '');
export const SOCKET_URL = API_BASE_URL;

async function request(path, { method = 'GET', token, body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || payload.message || 'Request failed');
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    if (error.message === 'Network request failed') {
      throw new Error(`Cannot reach the server at ${API_BASE_URL}. Please check if the backend is running and your API URL is correct.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  getProfile: (token) => request('/api/profile', { token }),
  updateProfile: (token, body) => request('/api/profile', { method: 'PUT', token, body }),
  getLeaderboard: (token) => request('/api/leaderboard', { token }),
  getAvatars: (token) => request('/api/shop/avatars', { token }),
  buyAvatar: (token, avatarId) => request('/api/shop/buy', { method: 'POST', token, body: { avatarId } }),
  equipAvatar: (token, avatarId) => request('/api/shop/equip', { method: 'POST', token, body: { avatarId } }),
  getTodaySteps: (token) => request('/api/steps/today', { token }),
  getStepsHistory: (token) => request('/api/steps/history', { token }),
  logSteps: (token, steps) => request('/api/steps/log', { method: 'POST', token, body: { steps } }),
  listTerritories: (token) => request('/api/territory', { token }),
  claimTerritory: (token, body) => request('/api/territory/claim', { method: 'POST', token, body }),
  battleTerritory: (token, body) => request('/api/territory/battle', { method: 'POST', token, body }),
};