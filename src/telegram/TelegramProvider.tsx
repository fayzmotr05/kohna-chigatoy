'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { TelegramUser, TelegramWebApp } from './types';

interface TelegramContextValue {
  isTelegram: boolean;
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  rawInitData: string | null;
  isRegistered: boolean;
  registeredUser: { name: string; phone: string } | null;
  setRegistered: (user: { name: string; phone: string }) => void;
}

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: false,
  webApp: null,
  user: null,
  rawInitData: null,
  isRegistered: false,
  registeredUser: null,
  setRegistered: () => {},
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [rawInitData, setRawInitData] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{ name: string; phone: string } | null>(null);

  const isTelegram = !!webApp;

  // Initialize on mount
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) return;

    // Signal to Telegram that app is ready
    tg.ready();
    tg.expand();

    // Set restaurant branding colors
    try {
      tg.setHeaderColor('#3D261A');
      tg.setBackgroundColor('#FAF6F0');
    } catch {
      // Older clients may not support this
    }

    setWebApp(tg);
    setRawInitData(tg.initData);

    const tgUser = tg.initDataUnsafe?.user;
    if (tgUser) {
      setUser(tgUser);
    }

    // Check registration status
    checkRegistration(tg.initData);
  }, []);

  async function checkRegistration(initData: string) {
    try {
      const res = await fetch('/api/telegram/check-registration', {
        headers: { 'x-telegram-init-data': initData },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.registered) {
          setIsRegistered(true);
          setRegisteredUser(data.user);
        }
      }
    } catch {
      // Silently fail — user just isn't registered yet
    }
  }

  const setRegistered = useCallback((user: { name: string; phone: string }) => {
    setIsRegistered(true);
    setRegisteredUser(user);
  }, []);

  return (
    <TelegramContext.Provider
      value={{ isTelegram, webApp, user, rawInitData, isRegistered, registeredUser, setRegistered }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
