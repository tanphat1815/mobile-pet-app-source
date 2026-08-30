/**
 * App Navigator
 *
 * Stack-based navigation using React Navigation Native Stack.
 * Currently routes HomePlaceholder -> AuthPlaceholder for Step M-1.
 * The ComponentGallery is wired in for Step M-2 demo.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../utils/useTheme';
import { HomePlaceholderScreen } from '../screens/HomePlaceholderScreen';
import { AuthPlaceholderScreen } from '../screens/AuthPlaceholderScreen';
import { ComponentGallery } from '../screens/ComponentGallery';

export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  Gallery: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Gallery"
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
      <Stack.Screen
        name="Gallery"
        component={ComponentGallery}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}