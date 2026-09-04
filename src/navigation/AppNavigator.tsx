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

import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
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
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { QuestsScreen } from '../screens/QuestsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { BiometricLoginScreen } from '../screens/BiometricLoginScreen';
import { NotificationBannerHost } from '../shared/components/NotificationBanner';
import { NotificationLifecycle } from '../stores/NotificationLifecycle';
import { WellnessHomeScreen } from '../screens/wellness/WellnessHomeScreen';
import { MeditationScreen } from '../screens/wellness/MeditationScreen';
import { BreathingScreen } from '../screens/wellness/BreathingScreen';
import { PomodoroScreen } from '../screens/wellness/PomodoroScreen';
import { AmbientScreen } from '../screens/wellness/AmbientScreen';
import { GratitudeScreen } from '../screens/wellness/GratitudeScreen';
import { MoodScreen } from '../screens/wellness/MoodScreen';
import { MusicHomeScreen } from '../screens/music/MusicHomeScreen';
import { AdventureHomeScreen } from '../screens/adventure/AdventureHomeScreen';
import { AIChatScreen } from '../screens/ai/AIChatScreen';
import { AISettingsScreen } from '../screens/ai/AISettingsScreen';
import { TricksScreen } from '../screens/tricks/TricksScreen';
import { initHapticsAccessibility, hapticSuccess } from '../utils/haptics';
import { getBiometricCapability, biometryLabel } from '../api/biometric';
import type { RootStackParamList, MainStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

/**
 * Boot phase after restoreSession() resolves.
 *   - `onboarding`      user has not finished onboarding yet
 *   - `biometric`       stored token + biometricEnabled -> prompt bio
 *   - `main`            authenticated -> MainStack
 *   - `auth`            no token -> AuthStack
 */
type BootPhase = 'onboarding' | 'biometric' | 'main' | 'auth';

function AuthRestorer({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  useEffect(() => {
    restoreSession();
    const unsub = initHapticsAccessibility();
    return () => unsub();
  }, [restoreSession]);
  return <>{children}</>;
}

function PhasePicker() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete);
  const setBiometricEnabledPreference = useAuthStore(
    (s) => s.setBiometricEnabledPreference
  );
  const theme = useTheme();

  // Hold an in-screen phase so the user can fall back from biometric
  // to the password flow without bouncing the navigator tree.
  const [phaseOverride, setPhaseOverride] = useState<BootPhase | null>(null);

  // Detect the very first transition into 'authenticated' from the
  // OTP flow so we can offer to enable biometric login.
  const wasAuthedRef = useRef(status === 'authenticated');
  useEffect(() => {
    const nowAuthed = status === 'authenticated';
    if (nowAuthed && !wasAuthedRef.current && !biometricEnabled) {
      (async () => {
        const cap = await getBiometricCapability();
        if (!cap.isAvailable) {
          wasAuthedRef.current = nowAuthed;
          return;
        }
        Alert.alert(
          `Use ${biometryLabel(cap.biometryType)} next time?`,
          'Enable biometric login so you can skip the verification code on this device.',
          [
            {
              text: 'Not now',
              style: 'cancel',
              onPress: () => {
                wasAuthedRef.current = nowAuthed;
              },
            },
            {
              text: 'Enable',
              onPress: async () => {
                await setBiometricEnabledPreference(true);
                hapticSuccess();
                wasAuthedRef.current = nowAuthed;
              },
            },
          ]
        );
      })();
    } else {
      wasAuthedRef.current = nowAuthed;
    }
  }, [status, biometricEnabled, setBiometricEnabledPreference]);

  if (status === 'restoring') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  let phase: BootPhase;
  if (!onboardingComplete) phase = 'onboarding';
  else if (status === 'authenticated' && biometricEnabled && !phaseOverride)
    phase = 'biometric';
  else if (status === 'authenticated') phase = 'main';
  else phase = 'auth';

  switch (phase) {
    case 'onboarding':
      return (
        <OnboardingScreen
          onDone={() => useAuthStore.getState().completeOnboarding()}
        />
      );
    case 'biometric':
      return (
        <BiometricLoginScreen
          onAuthenticated={() => {
            // Status is already 'authenticated' since we have a token.
            // Setting the override to 'main' drops us in.
            setPhaseOverride('main');
          }}
          onUsePassword={() => setPhaseOverride('auth')}
        />
      );
    case 'main':
      return <MainNavigator />;
    case 'auth':
    default:
      return <AuthNavigator />;
  }
}

function RootNavigator() {
  const theme = useTheme();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <RootStack.Screen name="Phase" component={PhasePicker} />
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
      <MainStack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Quests"
        component={QuestsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      {/* Step 12a — Wellness stack */}
      <MainStack.Screen
        name="WellnessHome"
        component={WellnessHomeScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Meditation"
        component={MeditationScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Breathing"
        component={BreathingScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Pomodoro"
        component={PomodoroScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Ambient"
        component={AmbientScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Gratitude"
        component={GratitudeScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Mood"
        component={MoodScreen}
        options={{ animation: 'slide_from_right' }}
      />
      {/* Step 12b — Music */}
      <MainStack.Screen
        name="MusicHome"
        component={MusicHomeScreen}
        options={{ animation: 'slide_from_right' }}
      />
      {/* Step 12c — Adventure */}
      <MainStack.Screen
        name="AdventureHome"
        component={AdventureHomeScreen}
        options={{ animation: 'slide_from_right' }}
      />
      {/* Step 12d — AI Chatbot BYOK */}
      <MainStack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="AISettings"
        component={AISettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      {/* Step 12e — Pet Tricks */}
      <MainStack.Screen
        name="TricksHome"
        component={TricksScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </MainStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <AuthRestorer>
      <NotificationLifecycle>
        <RootNavigator />
      </NotificationLifecycle>
      {/* Step 9 — notification banner toast overlay */}
      <NotificationBannerHost />
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