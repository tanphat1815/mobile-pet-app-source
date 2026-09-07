/**
 * App Entry Point
 *
 * Wraps the app with GestureHandlerRootView (required for Reanimated) and
 * NavigationContainer (required for React Navigation).
 *
 * Step 2 — thêm `DecorationsHost` để render overlay particles + corners theo
 * theme hiện tại (snowflakes/ghost/confetti/fireworks/matrix/hearts).
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SyncLifecycle } from './src/stores/SyncLifecycle';
import { NotificationLifecycle } from './src/stores/NotificationLifecycle';
import { useTheme } from './src/utils/useTheme';
import { logRuntimeConfig } from './src/utils/runtimeConfig';
import { useSettingsStore } from './src/stores/SettingsStore';
import { ThemeDecorations } from './src/shared/components/ThemeDecorations';
import { APP_THEMES, resolveThemeId } from './src/utils/appThemes';

function DecorationsHost() {
  const theme = useTheme();
  const appThemeId = useSettingsStore((s) => s.settings.appThemeId);
  // Resolve id tương tự useTheme — không cần re-read colorScheme ở đây vì
  // decorations là tĩnh theo appThemeId.
  const id =
    appThemeId === 'auto'
      ? theme.isDark
        ? 'dark'
        : 'light'
      : appThemeId;
  const appTheme = APP_THEMES[id];
  if (!appTheme || appTheme.decorations.particles === 'none') return null;
  return (
    <ThemeDecorations
      decorations={appTheme.decorations}
      textColor={appTheme.tokens.text}
    />
  );
}

function ThemedApp() {
  const theme = useTheme();

  useEffect(() => {
    logRuntimeConfig();
  }, []);

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
        <DecorationsHost />
      </SyncLifecycle>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: '#FAF7F2' /* Cozy Cream default — see useTheme() for dark */ }}
    >
      <SafeAreaProvider>
        <ThemedApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
