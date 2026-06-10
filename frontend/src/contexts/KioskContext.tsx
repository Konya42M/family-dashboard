import { createContext, useContext, useState, ReactNode } from 'react';

const KIOSK_KEY = 'clx_kiosk_mode';

interface KioskContextType {
  isKiosk: boolean;
  setKioskMode: () => void;
  clearKioskMode: () => void;
}

const KioskContext = createContext<KioskContextType>({
  isKiosk: false,
  setKioskMode: () => {},
  clearKioskMode: () => {},
});

export function KioskProvider({ children }: { children: ReactNode }) {
  const [isKiosk, setIsKiosk] = useState(() => localStorage.getItem(KIOSK_KEY) === 'true');

  const setKioskMode = () => {
    localStorage.setItem(KIOSK_KEY, 'true');
    setIsKiosk(true);
  };

  const clearKioskMode = () => {
    localStorage.removeItem(KIOSK_KEY);
    setIsKiosk(false);
  };

  return (
    <KioskContext.Provider value={{ isKiosk, setKioskMode, clearKioskMode }}>
      {children}
    </KioskContext.Provider>
  );
}

export const useKiosk = () => useContext(KioskContext);

// Wird von KioskAutoLogin aufgerufen – danach folgt zwingend window.location.replace
export function setKioskModeInStorage() {
  localStorage.setItem(KIOSK_KEY, 'true');
}
