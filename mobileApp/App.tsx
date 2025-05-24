import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { COLORS } from "./src/constants/theme";
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/context/ThemeContext";
import { registerRootComponent } from 'expo';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          <AppNavigator />
          <StatusBar style="light" backgroundColor={COLORS.primary} />
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Register the app
registerRootComponent(App);
