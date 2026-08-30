/**
 * App Navigator
 *
 * Stack-based navigation using React Navigation Native Stack.
 * This is a placeholder skeleton - screens will be added in subsequent steps.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../utils/useTheme';
import { HomePlaceholderScreen } from '../screens/HomePlaceholderScreen';
import { AuthPlaceholderScreen } from '../screens/AuthPlaceholderScreen';

export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: theme.typography.weight.semibold,
        },
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomePlaceholderScreen}
        options={{ title: 'Mobile Pet' }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthPlaceholderScreen}
        options={{ title: 'Sign In' }}
      />
    </Stack.Navigator>
  );
}
