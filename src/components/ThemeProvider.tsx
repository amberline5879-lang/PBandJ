import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeType, FontSizeType, FontType, UserSettings } from '../types';

interface ThemeContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('serene-structure-settings');
    const defaults: UserSettings = {
      theme: 'pastel',
      fontSize: 'medium',
      fontType: 'standard',
      scheduleInterval: 30,
      showCycleTracking: true
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-pastel', 'theme-vibrant', 'theme-green', 'theme-blue', 'theme-dark');
    root.classList.add(`theme-${settings.theme}`);

    // Remove all font size classes
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${settings.fontSize}`);

    // Remove all font type classes
    root.classList.remove('font-dyslexic');

    localStorage.setItem('serene-structure-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
