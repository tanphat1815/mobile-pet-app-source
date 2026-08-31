/**
 * App Navigator
 *
 * Root-level navigator that shows either the Auth stack or the main app
 * based on the authentication state. The auth state is restored from
 * AsyncStorage on app launch.
 *
 * Flow:
 *   App mounts → AuthStore.restoreSession() → 'restoring'
 *   → 'authenticated' → MainStack (Home, Chat, Friends, ...)
 *   → 'unauthenticated' → AuthStack (Login)
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { AuthNavigator } from './AuthNavigator';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ChatThreadScreen } from '../screens/ChatThreadScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { PairingScreen } from '../screens/PairingScreen';
import type { RootStackParamList, MainStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

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

function MainNavigator() {
  const theme = useTheme();

  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
      initialRouteName="Home"
    >
      <MainStack.Screen name="Home" component={HomeScreen} />
      <MainStack.Screen name="ChatList" component={ChatListScreen} />
      <MainStack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Pairing"
        component={PairingScreen}
        options={{ animation: 'slide_from_right' }}
      />
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