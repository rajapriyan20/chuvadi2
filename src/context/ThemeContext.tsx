import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'amber' | 'emerald' | 'sapphire';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  accentColor: string;
  accentGradient: string;
  bgTone: string;
  badgeLabel?: string;
  previewBg: string;
  previewCard: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'amber',
    name: 'Classic Amber',
    subtitle: 'Golden palm manuscript & warm bronze',
    accentColor: '#f59e0b',
    accentGradient: 'from-amber-500 to-amber-600',
    bgTone: '#0a0d12',
    badgeLabel: 'Default',
    previewBg: '#0a0d12',
    previewCard: '#151c24'
  },
  {
    id: 'emerald',
    name: 'Emerald Ledger',
    subtitle: 'Jade green & radiant prosperity mint',
    accentColor: '#10b981',
    accentGradient: 'from-emerald-500 to-teal-600',
    bgTone: '#06110e',
    previewBg: '#06110e',
    previewCard: '#0d1a16'
  },
  {
    id: 'sapphire',
    name: 'Royal Sapphire',
    subtitle: 'Deep cosmic ocean & cobalt executive',
    accentColor: '#3b82f6',
    accentGradient: 'from-blue-500 to-indigo-600',
    bgTone: '#080d19',
    previewBg: '#080d19',
    previewCard: '#0e172a'
  }
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeConfig[];
  currentThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'amber',
  setTheme: () => {},
  themes: AVAILABLE_THEMES,
  currentThemeConfig: AVAILABLE_THEMES[0]
});

const THEME_STORAGE_KEY = 'chuvadi_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId;
      if (saved && AVAILABLE_THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch (e) {
      // Fallback to default
    }
    return 'amber';
  });

  useEffect(() => {
    // Apply theme attribute to html element
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      // Ignore storage errors
    }

    // Update theme-color meta tag in head
    const currentConfig = AVAILABLE_THEMES.find(t => t.id === theme) || AVAILABLE_THEMES[0];
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', currentConfig.bgTone);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeId) => {
    setCurrentTheme(newTheme);
  };

  const currentThemeConfig = AVAILABLE_THEMES.find(t => t.id === theme) || AVAILABLE_THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: AVAILABLE_THEMES, currentThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
