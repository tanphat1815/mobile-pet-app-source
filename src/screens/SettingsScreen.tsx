/**
 * SettingsScreen
 *
 * Step 11 — refactor:
 *   - SettingsSearch bar at top (debounced 150ms)
 *   - Sections grouped into 4 categories (GENERAL / PET / SOCIAL / ADVANCED)
 *   - Collapsible groups, persisted to AsyncStorage
 *   - Each SettingRow maps to an existing SettingsRow (rendered as before)
 *     but the grouping/filter happens here so the list can be searched.
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../utils/useTheme';
import { useSettingsStore } from '../stores/SettingsStore';
import { useAuthStore } from '../stores/AuthStore';
import { SettingsSection } from '../shared/components/SettingsSection';
import { SettingsRow } from '../shared/components/SettingsRow';
import { SettingsSearch } from '../shared/components/SettingsSearch';
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
import { hapticLight, hapticSelection } from '../utils/haptics';
import { friendRequestLabel, themeLabel } from '../api/settingsTypes';
import { SETTINGS_GROUPS } from '../api/settingsGroups';
import {
  filterRows,
  totalRowCount,
  matchCount,
  buildSearchIndex,
  SettingSearchableRow,
} from '../api/settingsCategories';
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
  const expandedGroups = useSettingsStore((s) => s.expandedGroups);
  const hydrateExpandedGroups = useSettingsStore((s) => s.hydrateExpandedGroups);
  const toggleGroup = useSettingsStore((s) => s.toggleGroup);

  const setBiometricEnabledPreference = useAuthStore(
    (s) => s.setBiometricEnabledPreference
  );
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [themeModalOpen, setThemeModalOpen] = React.useState(false);
  const [appThemeModalOpen, setAppThemeModalOpen] = React.useState(false);
  const [friendRequestModalOpen, setFriendRequestModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    if (status === 'idle') loadAll();
    hydrateExpandedGroups();
  }, [status, loadAll, hydrateExpandedGroups]);

  const filteredGroups = useMemo(
    () => filterRows(SETTINGS_GROUPS, searchQuery),
    [searchQuery]
  );

  const totalRows = useMemo(() => totalRowCount(SETTINGS_GROUPS), []);
  const matchRows = useMemo(
    () => matchCount(SETTINGS_GROUPS, searchQuery),
    [searchQuery]
  );

  const index = useMemo(() => buildSearchIndex(SETTINGS_GROUPS), []);

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

  /**
   * Renders a single row (from the SETTINGS_GROUPS tree) by mapping its
   * id back to the original inline SettingsRow definition.
   */
  const renderRow = useCallback(
    (row: SettingSearchableRow, isLast: boolean) => {
      switch (row.id) {
        // GENERAL > Account
        case 'account-profile':
          return (
            <SettingsRow
              key={row.id}
              icon="👤"
              label={row.label}
              subtitle={row.description}
              onPress={() => navigation.navigate('Profile')}
              isLast={isLast}
            />
          );
        case 'account-signout':
          return (
            <SettingsRow
              key={row.id}
              icon="🚪"
              label={row.label}
              variant="destructive"
              onPress={handleLogout}
              type="navigation"
              isLast={isLast}
            />
          );
        // GENERAL > Appearance
        case 'appearance-theme':
          return (
            <SettingsRow
              key={row.id}
              icon="🎨"
              label={row.label}
              type="value"
              value={themeLabel(settings.theme)}
              onPress={() => setThemeModalOpen(true)}
              isLast={isLast}
            />
          );
        case 'appearance-app-theme':
          return (
            <SettingsRow
              key={row.id}
              icon="🎭"
              label={row.label}
              subtitle={getThemeMeta(settings.appThemeId).name}
              type="value"
              value={
                settings.appThemeId === 'auto'
                  ? 'Auto'
                  : getThemeMeta(settings.appThemeId).icon
              }
              onPress={() => setAppThemeModalOpen(true)}
              isLast={isLast}
            />
          );
        case 'appearance-reduce-motion':
          return (
            <SettingsRow
              key={row.id}
              icon="♿"
              label={row.label}
              type="toggle"
              toggleValue={settings.reducedMotionOverride === 'on'}
              onToggle={(v) =>
                updateSetting('reducedMotionOverride', v ? 'on' : 'off')
              }
              subtitle={row.description}
              isLast={isLast}
            />
          );
        // GENERAL > Notifications
        case 'notifications-push':
          return (
            <SettingsRow
              key={row.id}
              icon="🔔"
              label={row.label}
              type="toggle"
              toggleValue={settings.notificationsEnabled}
              onToggle={(v) => updateSetting('notificationsEnabled', v)}
              isLast={isLast}
            />
          );
        case 'notifications-quiet-hours':
          return (
            <SettingsRow
              key={row.id}
              icon="🌙"
              label={row.label}
              subtitle={
                settings.quietHoursEnabled && settings.quietHoursStart
                  ? `${settings.quietHoursStart} – ${settings.quietHoursEnd}`
                  : 'Off'
              }
              type="toggle"
              toggleValue={settings.quietHoursEnabled}
              onToggle={(v) => updateSetting('quietHoursEnabled', v)}
              isLast={isLast}
            />
          );
        case 'notifications-marketing':
          return (
            <SettingsRow
              key={row.id}
              icon="📧"
              label={row.label}
              type="toggle"
              toggleValue={settings.marketingEmails}
              onToggle={(v) => updateSetting('marketingEmails', v)}
              isLast={isLast}
            />
          );
        // SOCIAL > Privacy & Security
        case 'privacy-biometric':
          return (
            <SettingsRow
              key={row.id}
              icon="🔒"
              label={row.label}
              subtitle={
                settings.biometricEnabled ? 'Enabled' : 'Use OTP instead'
              }
              type="toggle"
              toggleValue={settings.biometricEnabled}
              onToggle={handleBiometricToggle}
              isLast={isLast}
            />
          );
        case 'privacy-online-status':
          return (
            <SettingsRow
              key={row.id}
              icon="🟢"
              label={row.label}
              type="toggle"
              toggleValue={settings.showOnlineStatus}
              onToggle={(v) => updateSetting('showOnlineStatus', v)}
              isLast={isLast}
            />
          );
        case 'privacy-friend-requests':
          return (
            <SettingsRow
              key={row.id}
              icon="🤝"
              label={row.label}
              type="value"
              value={friendRequestLabel(settings.allowFriendRequests)}
              onPress={() => setFriendRequestModalOpen(true)}
              isLast={isLast}
            />
          );
        case 'privacy-auto-pair':
          return (
            <SettingsRow
              key={row.id}
              icon="🔗"
              label={row.label}
              type="toggle"
              toggleValue={settings.autoPairKnownDevices}
              onToggle={(v) => updateSetting('autoPairKnownDevices', v)}
              isLast={isLast}
            />
          );
        // SOCIAL > Pairing (navigate to Pairing screen)
        case 'social-pairing':
          return (
            <SettingsRow
              key={row.id}
              icon="🔗"
              label={row.label}
              subtitle={row.description}
              onPress={() => navigation.navigate('Pairing')}
              isLast={isLast}
            />
          );
        case 'social-friends':
          return (
            <SettingsRow
              key={row.id}
              icon="👥"
              label={row.label}
              subtitle={row.description}
              onPress={() => navigation.navigate('Friends')}
              isLast={isLast}
            />
          );
        // PET > Pet Settings
        case 'pet-actions-info':
          return (
            <SettingsRow
              key={row.id}
              icon="🩺"
              label={row.label}
              subtitle={row.description}
              type="value"
              value="7"
              isLast={isLast}
            />
          );
        case 'pet-cooldowns':
          return (
            <SettingsRow
              key={row.id}
              icon="⏱"
              label={row.label}
              subtitle={row.description}
              type="value"
              value="8h / 6h"
              isLast={isLast}
            />
          );
        // PET > Care & Items
        case 'care-cleanliness':
          return (
            <SettingsRow
              key={row.id}
              icon="🛁"
              label={row.label}
              subtitle={row.description}
              type="value"
              value="50%"
              isLast={isLast}
            />
          );
        case 'care-health':
          return (
            <SettingsRow
              key={row.id}
              icon="💊"
              label={row.label}
              subtitle={row.description}
              type="value"
              value="80%"
              isLast={isLast}
            />
          );
        // ADVANCED > Accessibility
        case 'accessibility-reduced-motion':
          return (
            <SettingsRow
              key={row.id}
              icon="♿"
              label={row.label}
              type="toggle"
              toggleValue={settings.reducedMotionOverride === 'on'}
              onToggle={(v) =>
                updateSetting('reducedMotionOverride', v ? 'on' : 'off')
              }
              isLast={isLast}
            />
          );
        case 'accessibility-haptics':
          return (
            <SettingsRow
              key={row.id}
              icon="📳"
              label={row.label}
              subtitle={row.description}
              type="value"
              value="Default"
              isLast={isLast}
            />
          );
        // ADVANCED > About
        case 'about-version':
          return (
            <SettingsRow
              key={row.id}
              icon="📦"
              label={row.label}
              type="value"
              value="0.1.0 (build 1)"
              isLast={isLast}
            />
          );
        case 'about-platform':
          return (
            <SettingsRow
              key={row.id}
              icon="📱"
              label={row.label}
              type="value"
              value={Platform.OS}
              isLast={isLast}
            />
          );
        case 'about-licenses':
          return (
            <SettingsRow
              key={row.id}
              icon="🌐"
              label={row.label}
              onPress={() =>
                Alert.alert(
                  'Licenses',
                  'MIT — Mobile Pet (tanphat1815/mobile-pet-app-source)'
                )
              }
              isLast={isLast}
            />
          );
        default:
          return null;
      }
    },
    [
      navigation,
      handleLogout,
      setThemeModalOpen,
      setAppThemeModalOpen,
      setFriendRequestModalOpen,
      settings,
      updateSetting,
      handleBiometricToggle,
    ]
  );

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
        contentContainerStyle={{
          paddingBottom: theme.spacing.xxxl,
          paddingHorizontal: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 11 — search bar */}
        <SettingsSearch onChange={setSearchQuery} />

        {searchQuery ? (
          <Text
            testID="settings-search-count"
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.footnote,
              paddingBottom: theme.spacing.sm,
            }}
          >
            {matchRows} of {totalRows} match{searchQuery ? ` "${searchQuery}"` : ''}
          </Text>
        ) : null}

        {error ? (
          <Text
            style={{
              color: theme.colors.danger,
              fontSize: theme.typography.size.footnote,
              textAlign: 'center',
              paddingVertical: theme.spacing.sm,
            }}
          >
            {error}
          </Text>
        ) : null}

        {filteredGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                marginTop: 8,
                fontWeight: '500',
              }}
              testID="settings-empty-state"
            >
              {`No settings match "${searchQuery}"`}
            </Text>
          </View>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroups[group.id] ?? false;
            return (
              <CollapsibleGroup
                key={group.id}
                groupId={group.id}
                label={group.label}
                expanded={isExpanded}
                onToggle={(next) => toggleGroup(group.id, next)}
                sectionCount={group.sections.length}
              >
                {group.sections.map((section) => (
                  <SettingsSection
                    key={section.id}
                    title={section.title}
                  >
                    {section.rows.map((row, idx) =>
                      renderRow(row, idx === section.rows.length - 1)
                    )}
                  </SettingsSection>
                ))}
              </CollapsibleGroup>
            );
          })
        )}

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

// ============================================================================
// Collapsible group
// ============================================================================

interface CollapsibleGroupProps {
  groupId: string;
  label: string;
  expanded: boolean;
  onToggle: (next: boolean) => void;
  sectionCount: number;
  children: React.ReactNode;
}

function CollapsibleGroup({
  groupId,
  label,
  expanded,
  onToggle,
  sectionCount,
  children,
}: CollapsibleGroupProps) {
  const theme = useTheme();
  const rotation = useSharedValue(expanded ? 1 : 0);
  const heightFactor = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    heightFactor.value = withTiming(expanded ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [expanded, rotation, heightFactor]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 90}deg` }],
  }));

  return (
    <View style={styles.groupRoot}>
      <Pressable
        testID={`group-header-${groupId}`}
        onPress={() => {
          hapticSelection();
          onToggle(!expanded);
        }}
        style={({ pressed }) => [
          styles.groupHeader,
          {
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.groupArrow,
            { color: theme.colors.textSecondary },
            arrowStyle,
          ]}
        >
          ›
        </Animated.Text>
        <Text
          style={[
            styles.groupLabel,
            {
              color: theme.colors.text,
              fontSize: theme.typography.size.headline,
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.groupCount,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.footnote,
            },
          ]}
        >
          {sectionCount} section{sectionCount === 1 ? '' : 's'}
        </Text>
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  groupRoot: {
    marginTop: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  groupArrow: {
    fontSize: 22,
    marginRight: 8,
    width: 16,
  },
  groupLabel: {
    flex: 1,
    fontWeight: '700',
  },
  groupCount: {
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
});
