/**
 * App Navigator
 *
 * Root-level navigator that shows either the Auth stack or the main app
 * based on the authentication state. The auth state is restored from
 * AsyncStorage on app launch.
 *
 * Flow:
 *   App mounts → AuthStore.restoreSession() → 'restoring'
 *   → 'authenticated' → MainStack (Home)
 *   → 'unauthenticated' → AuthStack (Login)
 *
 * When the user logs out, the navigator switches back to the Auth stack.
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { AuthNavigator } from './AuthNavigator';
import { HomeScreen } from '../screens/HomeScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthRestorer({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return <>{children}</>;
}

function RootNavigator() {
  const theme = useTheme();
  const status = useAuthStore((s) => s.status);

  const isRestoring = status === 'restoring';

  if (isRestoring) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      {status === 'authenticated' ? (
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

type MainStackParamList = {
  Home: undefined;
};

const MainStack = createNativeStackNavigator<MainStackParamList>();

function MainNavigator() {
  const theme = useTheme();

  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <MainStack.Screen name="Home" component={HomeScreen} />
    </MainStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <AuthRestorer>
      <RootNavigator />
    </AuthRestorer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});