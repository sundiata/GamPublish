"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import { LIGHT_COLORS, DARK_COLORS, SHADOWS } from "../constants/theme";

// Create the theme context
const ThemeContext = createContext({
  isDarkMode: false,
  colors: LIGHT_COLORS,
  shadows: {},
  toggleTheme: () => {},
  setTheme: (isDark) => {},
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === "dark");

  // Update theme if device theme changes
  useEffect(() => {
    setIsDarkMode(deviceColorScheme === "dark");
  }, [deviceColorScheme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Set specific theme
  const setTheme = (isDark) => {
    setIsDarkMode(isDark);
  };

  // Get current theme colors
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  // Get appropriate shadows based on theme
  const shadows = {
    light: isDarkMode ? SHADOWS.lightDark : SHADOWS.light,
    medium: isDarkMode ? SHADOWS.mediumDark : SHADOWS.medium,
    dark: isDarkMode ? SHADOWS.darkDark : SHADOWS.dark,
  };

  // Context value
  const themeContext = {
    isDarkMode,
    colors,
    shadows,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={themeContext}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);
