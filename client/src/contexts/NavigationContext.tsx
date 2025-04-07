import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface NavigationContextType {
  activeView: string;
  setActiveView: (view: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [activeView, setActiveView] = useState(() => {
    // Initialize based on current route
    const path = location.split('/')[1];
    if (path === '') return 'dashboard';
    return path;
  });

  return (
    <NavigationContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}