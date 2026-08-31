/**
 * ProfileScreen
 *
 * Shows the current user's profile + an inline edit panel for the
 * display name and avatar URL. Stats row at the bottom summarises
 * the user's pet level, friend count, achievements, and streak.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { useSettingsStore } from '../stores/SettingsStore';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { Modal } from '../shared/components/Modal';
import { TextField } from '../shared/components/TextField';
import { hapticLight, hapticSuccess, hapticError } from '../utils/haptics';
import { formatRelativeTime } from '../api/chatTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const setBiometricEnabledPreference = useAuthStore(
    (s) => s.setBiometricEnabledPreference
  );

  const stats = useSettingsStore((s) => s.stats);
  const statsStatus = useSettingsStore((s) => s.statsStatus);
  const loadStats = useSettingsStore((s) => s.loadStats);
  const saveProfile = useSettingsStore((s) => s.saveProfile);
  const profileSaving = useSettingsStore((s) => s.profileSaving);
  const profileError = useSettingsStore((s) => s.profileError);

  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');

  useEffect(() => {
    if (statsStatus === 'idle') loadStats();
  }, [statsStatus, loadStats]);

  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
    setAvatarUrl(user?.avatarUrl ?? '');
  }, [user?.displayName, user?.avatarUrl]);

  const handleSave = useCallback(async () => {
    try {
      await saveProfile({ displayName, avatarUrl });
      hapticSuccess();
      setEditOpen(false);
    } catch {
      hapticError();
    }
  }, [saveProfile, displayName, avatarUrl]);

  const handleOpenEdit = useCallback(() => {
    hapticLight();
    setDisplayName(user?.displayName ?? '');
    setAvatarUrl(user?.avatarUrl ?? '');
    setEditOpen(true);
  }, [user?.displayName, user?.avatarUrl]);

  if (!user) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.body,
            textAlign: 'center',
            marginTop: 80,
          }}
        >
          Not signed in.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: theme.spacing.xxxl,
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.lg,
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
            Profile
          </Text>
        </View>

        {/* Avatar + name */}
        <View style={styles.profileBlock}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.isDark ? '#1C1C1E' : '#F2F2F7',
                borderRadius: 64,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: 124, height: 124, borderRadius: 62 }}
              />
            ) : (
              <Text style={{ fontSize: 64 }}>🐶</Text>
            )}
          </View>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.title2,
              fontWeight: '700',
              marginTop: 16,
            }}
          >
            {user.displayName || 'Pet parent'}
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.subhead,
              marginTop: 4,
            }}
          >
            {user.email}
          </Text>
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontSize: theme.typography.size.caption1,
              marginTop: 2,
            }}
          >
            Member for {formatRelativeTime(user.createdAt)}
          </Text>

          <View style={{ height: 16 }} />
          <Button
            title="Edit profile"
            onPress={handleOpenEdit}
            variant="primary"
          />
        </View>

        {/* Stats */}
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
          }}
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.caption1,
              fontWeight: '600',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: theme.spacing.sm,
            }}
          >
            Your stats
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            <StatCard
              icon="🏆"
              value={stats?.petLevel ?? '—'}
              label="Pet level"
              theme={theme}
            />
            <StatCard
              icon="👥"
              value={stats?.friendsCount ?? '—'}
              label="Friends"
              theme={theme}
            />
            <StatCard
              icon="🎯"
              value={
                stats
                  ? `${stats.achievementsUnlocked}/${stats.achievementsTotal}`
                  : '—'
              }
              label="Achievements"
              theme={theme}
            />
            <StatCard
              icon="🔥"
              value={stats?.streakDays ?? '—'}
              label="Day streak"
              theme={theme}
            />
          </View>
        </View>

        {/* Quick links */}
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
          }}
        >
          <Card>
            <Button
              title="Open settings"
              onPress={() => navigation.navigate('Settings')}
              variant="ghost"
              style={{ alignSelf: 'stretch' }}
            />
          </Card>
        </View>
      </ScrollView>

      {/* Edit profile modal */}
      <Modal
        visible={editOpen}
        onRequestClose={() => setEditOpen(false)}
        title="Edit profile"
      >
        <View style={{ padding: 16 }}>
          <TextField
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Mochi"
            maxLength={40}
            autoCapitalize="words"
          />
          <View style={{ height: 12 }} />
          <TextField
            label="Avatar URL"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {profileError ? (
            <Text
              style={{
                color: theme.colors.danger,
                fontSize: theme.typography.size.footnote,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {profileError}
            </Text>
          ) : null}
          <View style={{ height: 16 }} />
          <Button
            title="Save"
            onPress={handleSave}
            loading={profileSaving}
            disabled={profileSaving}
            style={{ alignSelf: 'stretch' }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Cancel"
            onPress={() => setEditOpen(false)}
            variant="ghost"
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ----------------------------------------------------------------------------
// StatCard
// ----------------------------------------------------------------------------

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  theme: ReturnType<typeof useTheme>;
}

function StatCard({ icon, value, label, theme }: StatCardProps) {
  return (
    <View
      style={{
        width: '48%',
        marginBottom: 12,
        backgroundColor: theme.colors.surface,
        padding: 14,
        borderRadius: theme.radius.md,
        alignItems: 'flex-start',
      }}
    >
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.size.title2,
          fontWeight: '700',
          marginTop: 4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.size.caption1,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  profileBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  avatar: {
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});