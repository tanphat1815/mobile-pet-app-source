/**
 * App Entry Point
 *
 * Wraps the app with GestureHandlerRootView (required for Reanimated) and
 * NavigationContainer (required for React Navigation).
 */

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SyncLifecycle } from './src/stores/SyncLifecycle';
import { NotificationLifecycle } from './src/stores/NotificationLifecycle';
import { useTheme } from './src/utils/useTheme';

function ThemedApp() {
  const theme = useTheme();

  // Build a React Navigation theme that matches our design tokens
  const navTheme = theme.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.colors.bg,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          primary: theme.colors.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.bg,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          primary: theme.colors.accent,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <SyncLifecycle>
        <NotificationLifecycle>
          <AppNavigator />
        </NotificationLifecycle>
      </SyncLifecycle>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemedApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
