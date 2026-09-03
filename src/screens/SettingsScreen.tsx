/**
 * SettingsScreen
 *
 * Settings for the current user. Sections:
 *   - Account (Profile, Sign out)
 *   - Appearance (Theme, Reduced motion)
 *   - Notifications (Enabled, Quiet hours, Marketing emails)
 *   - Privacy & Security (Biometric login, Online status, Friend
 *     requests, Auto-pair)
 *   - About (Version, Build, Open source)
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useSettingsStore } from '../stores/SettingsStore';
import { useAuthStore } from '../stores/AuthStore';
import { SettingsSection } from '../shared/components/SettingsSection';
import { SettingsRow } from '../shared/components/SettingsRow';
import { Modal } from '../shared/components/Modal';
import { Button } from '../shared/components/Button';
import { SegmentedTabs, TabItem } from '../shared/components/SegmentedTabs';
import { ThemePreviewCard } from '../shared/components/ThemePreview';
import {
  APP_THEMES,
  THEMES_BY_GROUP,
  ThemeId,
  getThemeMeta,
  isThemeUnlocked,
} from '../utils/appThemes';
import { hapticLight } from '../utils/haptics';
import { friendRequestLabel, themeLabel } from '../api/settingsTypes';
import { getBiometricCapability, biometryLabel } from '../api/biometric';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const status = useSettingsStore((s) => s.status);
  const settings = useSettingsStore((s) => s.settings);
  const error = useSettingsStore((s) => s.error);
  const saving = useSettingsStore((s) => s.saving);
  const loadAll = useSettingsStore((s) => s.loadAll);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const setAppTheme = useSettingsStore((s) => s.setAppTheme);
  const setBiometricEnabledPreference = useAuthStore(
    (s) => s.setBiometricEnabledPreference
  );
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [themeModalOpen, setThemeModalOpen] = React.useState(false);
  const [appThemeModalOpen, setAppThemeModalOpen] = React.useState(false);
  const [friendRequestModalOpen, setFriendRequestModalOpen] = React.useState(false);

  useEffect(() => {
    if (status === 'idle') loadAll();
  }, [status, loadAll]);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          hapticLight();
          await logout();
        },
      },
    ]);
  }, [logout]);

  const handleBiometricToggle = useCallback(
    async (next: boolean) => {
      if (next) {
        const cap = await getBiometricCapability();
        if (!cap.isAvailable) {
          Alert.alert(
            'Biometric unavailable',
            `${biometryLabel(cap.biometryType)} isn't set up on this device.`
          );
          return;
        }
      }
      await setBiometricEnabledPreference(next);
      await updateSetting('biometricEnabled', next);
    },
    [setBiometricEnabledPreference, updateSetting]
  );

  const themeTabs: TabItem[] = [
    { key: 'system', label: 'Auto' },
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
  ];

  const friendRequestTabs: TabItem[] = [
    { key: 'everyone', label: 'Everyone' },
    { key: 'friends_of_friends', label: 'Friends of friends' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: theme.spacing.xxxl,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.sm,
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.title1,
            fontWeight: '700',
          }}
        >
          Settings
        </Text>
        {user?.email ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.subhead,
              marginTop: 2,
            }}
          >
            Signed in as {user.email}
          </Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Text
            style={{
              color: theme.colors.danger,
              fontSize: theme.typography.size.footnote,
              textAlign: 'center',
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
            }}
          >
            {error}
          </Text>
        ) : null}

        {/* Account */}
        <SettingsSection title="Account">
          <SettingsRow
            icon="👤"
            label="Profile"
            subtitle="Display name, avatar"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingsRow
            icon="🚪"
            label="Sign out"
            variant="destructive"
            onPress={handleLogout}
            type="navigation"
          />
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance">
          <SettingsRow
            icon="🎨"
            label="Theme"
            type="value"
            value={themeLabel(settings.theme)}
            onPress={() => setThemeModalOpen(true)}
          />
          <SettingsRow
            icon="🎭"
            label="App theme"
            subtitle={getThemeMeta(settings.appThemeId).name}
            type="value"
            value={
              settings.appThemeId === 'auto' ? 'Auto' : getThemeMeta(settings.appThemeId).icon
            }
            onPress={() => setAppThemeModalOpen(true)}
          />
          <SettingsRow
            icon="♿"
            label="Reduce motion"
            type="toggle"
            toggleValue={settings.reducedMotionOverride === 'on'}
            onToggle={(v) =>
              updateSetting('reducedMotionOverride', v ? 'on' : 'off')
            }
            subtitle="Limit animations across the app"
            isLast
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsRow
            icon="🔔"
            label="Push notifications"
            type="toggle"
            toggleValue={settings.notificationsEnabled}
            onToggle={(v) => updateSetting('notificationsEnabled', v)}
          />
          <SettingsRow
            icon="🌙"
            label="Quiet hours"
            subtitle={
              settings.quietHoursEnabled && settings.quietHoursStart
                ? `${settings.quietHoursStart} – ${settings.quietHoursEnd}`
                : 'Off'
            }
            type="toggle"
            toggleValue={settings.quietHoursEnabled}
            onToggle={(v) => updateSetting('quietHoursEnabled', v)}
          />
          <SettingsRow
            icon="📧"
            label="Product updates"
            type="toggle"
            toggleValue={settings.marketingEmails}
            onToggle={(v) => updateSetting('marketingEmails', v)}
            isLast
          />
        </SettingsSection>

        {/* Privacy & Security */}
        <SettingsSection title="Privacy & Security">
          <SettingsRow
            icon="🔒"
            label="Biometric login"
            subtitle={settings.biometricEnabled ? 'Enabled' : 'Use OTP instead'}
            type="toggle"
            toggleValue={settings.biometricEnabled}
            onToggle={handleBiometricToggle}
          />
          <SettingsRow
            icon="🟢"
            label="Show online status"
            type="toggle"
            toggleValue={settings.showOnlineStatus}
            onToggle={(v) => updateSetting('showOnlineStatus', v)}
          />
          <SettingsRow
            icon="🤝"
            label="Friend requests from"
            type="value"
            value={friendRequestLabel(settings.allowFriendRequests)}
            onPress={() => setFriendRequestModalOpen(true)}
          />
          <SettingsRow
            icon="🔗"
            label="Auto-pair known devices"
            type="toggle"
            toggleValue={settings.autoPairKnownDevices}
            onToggle={(v) => updateSetting('autoPairKnownDevices', v)}
            isLast
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingsRow
            icon="📦"
            label="Version"
            type="value"
            value="0.1.0 (build 1)"
          />
          <SettingsRow
            icon="📱"
            label="Platform"
            type="value"
            value={Platform.OS}
          />
          <SettingsRow
            icon="🌐"
            label="Open source licenses"
            onPress={() =>
              Alert.alert(
                'Licenses',
                'MIT — Mobile Pet (tanphat1815/mobile-pet-app-source)'
              )
            }
            isLast
          />
        </SettingsSection>

        {saving ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.caption1,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Saving...
          </Text>
        ) : null}
      </ScrollView>

      {/* Theme picker modal */}
      <Modal
        visible={themeModalOpen}
        onRequestClose={() => setThemeModalOpen(false)}
        title="Theme"
      >
        <View style={{ padding: 16 }}>
          <SegmentedTabs
            items={themeTabs}
            activeKey={settings.theme}
            onChange={(k) => {
              updateSetting('theme', k as 'system' | 'light' | 'dark');
              setThemeModalOpen(false);
            }}
          />
        </View>
      </Modal>

      {/* App theme picker — seasonal / premium / core (Step 2) */}
      <Modal
        visible={appThemeModalOpen}
        onRequestClose={() => setAppThemeModalOpen(false)}
        title="App Theme"
        contentStyle={{ maxWidth: 520, width: '100%' }}
      >
        <View style={{ padding: 4, maxHeight: 480 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {THEMES_BY_GROUP.map(({ group, themes }) => (
              <View key={group} style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.caption1,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    paddingHorizontal: 4,
                    paddingBottom: 8,
                  }}
                >
                  {group}
                </Text>
                {themes.map((id: ThemeId) => {
                  const t = APP_THEMES[id];
                  return (
                    <View key={id} style={{ marginBottom: 8 }}>
                      <ThemePreviewCard
                        theme={t}
                        selected={settings.appThemeId === id}
                        locked={!isThemeUnlocked(id, 0)}
                        onPress={async (themeId) => {
                          setAppThemeModalOpen(false);
                          await setAppTheme(themeId, 9999);
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Friend requests picker */}
      <Modal
        visible={friendRequestModalOpen}
        onRequestClose={() => setFriendRequestModalOpen(false)}
        title="Who can send you friend requests?"
      >
        <View style={{ padding: 16 }}>
          <SegmentedTabs
            items={friendRequestTabs}
            activeKey={settings.allowFriendRequests}
            onChange={(k) => {
              updateSetting(
                'allowFriendRequests',
                k as 'everyone' | 'friends_of_friends'
              );
              setFriendRequestModalOpen(false);
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
});