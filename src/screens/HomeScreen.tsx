/**
 * Home Screen
 *
 * Post-auth landing. Shows the pet avatar + stats, sync status, account
 * info, and a logout button.
 *
 * Realtime updates: the `usePetRealtimeSync` hook subscribes to
 * pet:update / pet:mood events and updates the PetStore automatically.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useReducedMotion } from '../utils/useReducedMotion';
import { useAuthStore } from '../stores/AuthStore';
import { useSyncStore } from '../stores/SyncStore';
import { usePetStore, usePetRealtimeSync } from '../stores/PetStore';
import { useChatStore } from '../stores/ChatStore';
import { useFriendStore } from '../stores/FriendStore';
import { usePairingStore } from '../stores/PairingStore';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { Badge } from '../shared/components/Badge';
import { StatBar } from '../shared/components/StatBar';
import { LevelBar } from '../shared/components/LevelBar';
import { PetAvatar } from '../shared/components/PetAvatar';
import { PetActionButton } from '../shared/components/PetActionButton';
import { SyncStatusBadge } from '../shared/components/SyncStatusBadge';
import { NotificationCard } from '../shared/components/NotificationCard';
import type { PetAction } from '../api/petTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

const PET_ACTIONS: { action: PetAction; label: string; emoji: string }[] = [
  { action: 'feed', label: 'Feed', emoji: '🍱' },
  { action: 'play', label: 'Play', emoji: '🎾' },
  { action: 'sleep', label: 'Sleep', emoji: '💤' },
  { action: 'pet', label: 'Pet', emoji: '💕' },
];

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  const { user, status, logout } = useAuthStore();
  const syncStatus = useSyncStore((s) => s.status);
  const lastEventTs = useSyncStore((s) => s.lastEventTs);
  const eventsReceived = useSyncStore((s) => s.eventsReceived);

  const pet = usePetStore((s) => s.pet);
  const petStatus = usePetStore((s) => s.status);
  const pendingActions = usePetStore((s) => s.pendingActions);
  const loadPet = usePetStore((s) => s.load);
  const performAction = usePetStore((s) => s.performAction);

  const conversations = useChatStore((s) => s.conversations);
  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  const friends = useFriendStore((s) => s.friends);
  const friendRequests = useFriendStore((s) => s.requests);
  const onlineFriends = friends.filter((f) => f.presence === 'online').length;
  const incomingFriendRequests = friendRequests.filter((r) => r.direction === 'incoming').length;

  const pairedDevices = usePairingStore((s) => s.devices);

  // Subscribe to pet realtime updates
  usePetRealtimeSync();

  // Load the pet on mount
  useEffect(() => {
    loadPet();
  }, [loadPet]);

  const isLoggingOut = status === 'logging_out';
  const lastEventText = lastEventTs ? new Date(lastEventTs).toLocaleTimeString() : '-';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={petStatus === 'loading'}
          onRefresh={loadPet}
          tintColor={theme.colors.accent}
        />
      }
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: theme.spacing.xxxl,
            paddingBottom: theme.spacing.lg,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text
              style={[
                styles.greeting,
                { color: theme.colors.textSecondary, fontSize: theme.typography.size.subhead },
              ]}
            >
              Welcome back,
            </Text>
            <Text
              style={[
                styles.displayName,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.size.title2,
                  fontWeight: '700',
                },
              ]}
            >
              {user?.displayName ?? user?.email ?? 'User'}
            </Text>
          </View>
          <SyncStatusBadge />
        </View>
      </View>

      {/* Pet card */}
      <Card style={styles.section}>
        {pet ? (
          <>
            <View style={styles.petHeader}>
              <PetAvatar pet={pet} size={120} reducedMotion={reducedMotion} />
              <View style={styles.petInfo}>
                <Text
                  style={[
                    styles.petName,
                    {
                      color: theme.colors.text,
                      fontSize: theme.typography.size.title1,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {pet.name}
                </Text>
                <Text
                  style={[
                    styles.petSpecies,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.size.subhead,
                      textTransform: 'capitalize',
                    },
                  ]}
                >
                  {pet.species} • {pet.mood}
                </Text>
              </View>
            </View>

            <LevelBar
              level={pet.stats.level}
              xp={pet.stats.xp}
              reducedMotion={reducedMotion}
            />

            <View style={{ height: theme.spacing.lg }} />

            <StatBar
              label="Hunger"
              value={pet.stats.hunger}
              inverse
              reducedMotion={reducedMotion}
            />
            <StatBar
              label="Happiness"
              value={pet.stats.happiness}
              reducedMotion={reducedMotion}
            />
            <StatBar
              label="Energy"
              value={pet.stats.energy}
              reducedMotion={reducedMotion}
            />

            <View style={{ height: theme.spacing.md }} />

            {/* Action grid */}
            <View style={styles.actionGrid}>
              {PET_ACTIONS.map(({ action, label, emoji }) => (
                <PetActionButton
                  key={action}
                  action={action}
                  label={label}
                  emoji={emoji}
                  onPress={() => performAction(action)}
                  pending={pendingActions.has(action)}
                />
              ))}
            </View>
          </>
        ) : petStatus === 'loading' ? (
          <View style={styles.loadingContainer}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
              }}
            >
              Loading pet…
            </Text>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text
              style={{
                color: theme.colors.danger,
                fontSize: theme.typography.size.subhead,
              }}
            >
              Failed to load pet.
            </Text>
            <View style={{ height: 12 }} />
            <Button title="Retry" onPress={loadPet} variant="secondary" size="sm" />
          </View>
        )}
      </Card>

      {/* Account + sync (compact) */}
      <Card style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              fontSize: theme.typography.size.headline,
              fontWeight: '600',
            },
          ]}
        >
          Session
        </Text>
        <View style={{ height: theme.spacing.sm }} />
        <InfoRow label="Email" value={user?.email ?? '-'} theme={theme} />
        <InfoRow label="Sync" value={syncStatus} theme={theme} />
        <InfoRow label="Events" value={String(eventsReceived)} theme={theme} />
        <InfoRow label="Last event" value={lastEventText} theme={theme} mono />
      </Card>

      <NotificationCard />

      {/* Chat quick-link */}
      <Card style={styles.section}>
        <View style={styles.chatLinkRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.headline,
                fontWeight: '600',
              }}
            >
              Chat
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                marginTop: 2,
              }}
            >
              {unreadTotal > 0
                ? `${unreadTotal} unread message${unreadTotal > 1 ? 's' : ''}`
                : 'No unread messages'}
            </Text>
          </View>
          <Button
            title="Open"
            onPress={() => navigation.navigate('ChatList')}
            variant="primary"
            size="sm"
          />
        </View>
      </Card>

      {/* Friends quick-link */}
      <Card style={styles.section}>
        <View style={styles.chatLinkRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.headline,
                fontWeight: '600',
              }}
            >
              Friends
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                marginTop: 2,
              }}
            >
              {onlineFriends} online • {incomingFriendRequests} pending request{incomingFriendRequests === 1 ? '' : 's'}
            </Text>
          </View>
          <Button
            title="Open"
            onPress={() => navigation.navigate('Friends')}
            variant="primary"
            size="sm"
          />
        </View>
      </Card>

      {/* Pairing quick-link */}
      <Card style={styles.section}>
        <View style={styles.chatLinkRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.headline,
                fontWeight: '600',
              }}
            >
              Pairing
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                marginTop: 2,
              }}
            >
              {pairedDevices.length > 0
                ? `${pairedDevices.length} device${pairedDevices.length === 1 ? '' : 's'} paired`
                : 'No devices paired yet'}
            </Text>
          </View>
          <Button
            title="Open"
            onPress={() => navigation.navigate('Pairing')}
            variant="primary"
            size="sm"
          />
        </View>
      </Card>

      <View style={{ height: theme.spacing.xl }} />

      <Button
        title={isLoggingOut ? 'Signing out...' : 'Sign out'}
        onPress={logout}
        loading={isLoggingOut}
        variant="danger"
        disabled={isLoggingOut}
      />

      <View style={{ height: theme.spacing.xxxl }} />
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  theme,
  mono,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
  mono?: boolean;
}) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
      <Text
        style={[
          styles.infoLabel,
          { color: theme.colors.textSecondary, fontSize: theme.typography.size.subhead },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          {
            color: theme.colors.text,
            fontSize: theme.typography.size.subhead,
            fontFamily: mono ? 'monospace' : undefined,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingBottom: 40,
  },
  header: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {},
  displayName: {},
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  chatLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  petInfo: {
    marginLeft: 16,
    flex: 1,
  },
  petName: {},
  petSpecies: {},
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  sectionTitle: { marginBottom: 4 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {},
  infoValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
});