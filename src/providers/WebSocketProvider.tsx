'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ethers } from 'ethers';

interface WebSocketContextType {
  provider: ethers.WebSocketProvider | null;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType>({
  provider: null,
  isConnected: false,
  error: null,
  reconnect: async () => {},
});

export const useWebSocketProvider = () => useContext(WebSocketContext);

export function WebSocketProviderComponent({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ethers.WebSocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    try {
      const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      const wsUrl = alchemyKey 
        ? `wss://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
        : process.env.NEXT_PUBLIC_SEPOLIA_WS_URL;

      if (!wsUrl) {
        console.warn('⚠️ WebSocket URL not configured, falling back to HTTP');
        return;
      }

      console.log('🔌 Connecting to WebSocket...');
      
      const wsProvider = new ethers.WebSocketProvider(wsUrl);
      
      wsProvider.on('error', (err) => {
        console.error('WebSocket error:', err);
        setError(err as Error);
      });

      wsProvider.on('close', () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      });

      await wsProvider.ready;
      console.log('✅ WebSocket connected');
      setProvider(wsProvider);
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    } catch (err) {
      console.error('❌ WebSocket connection failed:', err);
      setError(err as Error);
      setIsConnected(false);
      
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      }
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  useEffect(() => {
    return () => {
      if (provider) {
        provider.destroy();
      }
    };
  }, [provider]);

  const value: WebSocketContextType = {
    provider,
    isConnected,
    error,
    reconnect: connect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
