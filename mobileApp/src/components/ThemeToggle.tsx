"use client";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme, colors, shadows } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.themeToggle,
        {
          backgroundColor: isDarkMode ? colors.cardBackground : colors.accent3,
          ...shadows.medium,
        },
      ]}
      onPress={toggleTheme}
      accessibilityLabel={
        isDarkMode ? "Switch to light mode" : "Switch to dark mode"
      }
      accessibilityRole="button"
    >
      <Ionicons
        name={isDarkMode ? "sunny-outline" : "moon-outline"}
        size={20}
        color={isDarkMode ? colors.primary : colors.tertiary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  themeToggle: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
