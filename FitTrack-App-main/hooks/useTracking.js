import { useState, useEffect, useRef, useCallback } from "react";
import { Pedometer } from 'expo-sensors';
import { useApp } from './useAppContext';
import { api } from '../utils/api';

export function useTracking(initialSteps = 0, initialTime = 0) {
  const { authToken, refreshLeaderboard, refreshProfile, setUser } = useApp();
  const [steps, setSteps] = useState(initialSteps);
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(initialTime);
  const [xpEarned, setXpEarned] = useState(0);
  const intervalRef = useRef();
  const syncTimeoutRef = useRef();
  const lastSyncedStepsRef = useRef(0);

  useEffect(() => {
    if (!authToken) return;

    const loadToday = async () => {
      try {
        const response = await api.getTodaySteps(authToken);
        const today = response.data || {};
        setSteps(today.steps || 0);
        setXpEarned(today.xp || 0);
        lastSyncedStepsRef.current = today.steps || 0;

        setUser((current) => ({
          ...current,
          distance: Number(Number(today.distance ?? current.distance ?? 0).toFixed(1)),
        }));
      } catch (error) {
        console.error('Failed to load today stats:', error);
      }
    };

    loadToday();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const syncSteps = useCallback(async (nextSteps) => {
    const delta = nextSteps - lastSyncedStepsRef.current;
    if (!authToken || delta <= 0) return;

    try {
      const response = await api.logSteps(authToken, delta);
      const data = response.data || {};
      
      // Only update lastSyncedStepsRef if the API call succeeded
      lastSyncedStepsRef.current = nextSteps;
      setXpEarned(data.xp || 0);

      await refreshProfile(authToken);
      await refreshLeaderboard(authToken).catch(() => []);
    } catch (e) {
      console.error('Failed to sync steps:', e);
    }
  }, [authToken, refreshLeaderboard, refreshProfile]);

  const stepsRef = useRef(steps);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const pedometerSubRef = useRef(null);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      if (pedometerSubRef.current) {
        pedometerSubRef.current.remove();
        pedometerSubRef.current = null;
      }
      return;
    }

    // 1) Accurately count time
    intervalRef.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    // 2) Track real hardware steps
    const startPedometer = async () => {
      try {
        const { status } = await Pedometer.requestPermissionsAsync();
        if (status === 'granted') {
          let lastStepCount = 0;
          pedometerSubRef.current = Pedometer.watchStepCount(result => {
            const delta = result.steps - lastStepCount;
            lastStepCount = result.steps;
            if (delta > 0) {
              setSteps(s => s + delta);
            }
          });
        } else {
          console.warn('Pedometer permission denied by user.');
        }
      } catch (err) {
        console.error('Pedometer init error:', err);
      }
    };

    startPedometer();

    return () => {
      clearInterval(intervalRef.current);
      if (pedometerSubRef.current) {
        pedometerSubRef.current.remove();
        pedometerSubRef.current = null;
      }
    };
  }, [running]);

  useEffect(() => {
    if (!authToken) return undefined;

    // Sync to backend every 3 seconds reliably. No resetting on every step.
    const syncInterval = setInterval(() => {
      if (running) {
        syncSteps(stepsRef.current).catch(console.error);
      }
    }, 3000);

    return () => {
      clearInterval(syncInterval);
      // Final sync on unmount or logout
      syncSteps(stepsRef.current).catch(console.error);
    };
  }, [authToken, running, syncSteps]);

  const pause = () => setRunning(false);
  const resume = () => setRunning(true);
  const toggle = () => setRunning(r => !r);

  const distance = (steps * 0.0008).toFixed(2);
  const pace = time > 0 && parseFloat(distance) > 0
    ? (time / 60 / parseFloat(distance)).toFixed(1)
    : '0.0';

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return { steps, running, time, xpEarned, distance, pace, formatTime, pause, resume, toggle };
}
