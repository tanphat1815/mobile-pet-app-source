/**
 * Auth Navigator
 *
 * Stack navigator for the email OTP auth flow.
 * Screens: Login → Verify
 *
 * The parent AppNavigator conditionally renders AuthStack or the main
 * app stack based on AuthStore.status.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../utils/useTheme';
import { LoginScreen } from '../screens/LoginScreen';
import { VerifyScreen } from '../screens/VerifyScreen';

export type AuthStackParamList = {
  Login: undefined;
  Verify: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Verify" component={VerifyScreen} />
    </Stack.Navigator>
  );
}