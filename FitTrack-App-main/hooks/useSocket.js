
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/api';

let socketInstance = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [nearbyPlayers, setNearbyPlayers] = useState([]);
  const [territoryClaims, setTerritoryClaims] = useState([]);

  useEffect(() => {
    socketInstance = io(SOCKET_URL, {
      transports: ['polling','websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {

      setConnected(true);
    });

    socketInstance.on('disconnect', () => {

      setConnected(false);
    });

    socketInstance.on('players:list', (players) => {
      setNearbyPlayers(players);
    });

    socketInstance.on('player:joined', (player) => {
      setNearbyPlayers(prev => {
        const exists = prev.find(p => p.id === player.id);
        if (exists) return prev;
        return [...prev, player];
      });
    });

    socketInstance.on('player:moved', (data) => {
      setNearbyPlayers(prev => prev.map(p =>
        p.id === data.id
          ? { ...p, latitude: data.latitude, longitude: data.longitude, heading: data.heading }
          : p
      ));
    });

    socketInstance.on('player:left', (data) => {
      setNearbyPlayers(prev => prev.filter(p => p.id !== data.id));
    });

    socketInstance.on('territory:claimed', (data) => {
      setTerritoryClaims(prev => [...prev, data]);
    });

    socketInstance.on('territory:underattack', (data) => {

    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
    };
  }, []);

  const joinGame = (playerData) => {
    if (socketInstance) {
      socketInstance.emit('player:join', playerData);
    }
  };

  const updateLocation = (latitude, longitude, heading = 0, speed = 0) => {
    if (socketInstance && connected) {
      socketInstance.emit('player:location', { latitude, longitude, heading, speed });
    }
  };

  const claimTerritory = (gridKey, color) => {
    if (socketInstance && connected) {
      socketInstance.emit('territory:claim', { gridKey, color });
    }
  };

  const battleTerritory = (defenderId, gridKey) => {
    if (socketInstance && connected) {
      socketInstance.emit('territory:battle', { defenderId, gridKey });
    }
  };

  return {
    connected,
    nearbyPlayers,
    territoryClaims,
    joinGame,
    updateLocation,
    claimTerritory,
    battleTerritory,
    socket: socketInstance,
  };
}
