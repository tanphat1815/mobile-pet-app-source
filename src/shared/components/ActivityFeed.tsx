/**
 * ActivityFeed
 *
 * List các activity event (level_up, achievement, gift, ...). Hiển thị icon, user, kind, timestamp.
 * Step 4 — xem docs/steps/step-04-friends-advanced.md.
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import {
  FriendActivity,
  FriendActivityKind,
  getGiftTypeMeta,
  formatLastSeen,
} from '../../api/friendTypes';
import { defaultEmoji } from '../../api/petTypes';

interface ActivityFeedProps {
  activities: FriendActivity[];
  /** Show loading skeleton */
  loading?: boolean;
  /** Empty state title */
  emptyTitle?: string;
}

function activityIcon(kind: FriendActivityKind): { icon: string; color: string } {
  switch (kind) {
    case 'level_up': return { icon: '🎉', color: '#FFB627' };
    case 'achievement': return { icon: '🏆', color: '#FFD700' };
    case 'new_pet': return { icon: '🥚', color: '#B388FF' };
    case 'quest_complete': return { icon: '✅', color: '#34C759' };
    case 'gift_sent': return { icon: '🎁', color: '#FFB6C1' };
    case 'gift_received': return { icon: '💝', color: '#FF69B4' };
    case 'tag_added': return { icon: '⭐', color: '#FFD700' };
    case 'friend_joined': return { icon: '👋', color: '#5AC8FA' };
    default: return { icon: '✨', color: '#8E8E93' };
  }
}

function describeActivity(a: FriendActivity): string {
  const name = a.userDisplayName ?? a.userId;
  switch (a.kind) {
    case 'level_up': {
      const lvl = (a.payload?.level as number) ?? '?';
      const petName = (a.payload?.petName as string) ?? 'pet';
      return `${name}'s ${petName} reached level ${lvl}!`;
    }
    case 'achievement': {
      const ach = (a.payload?.achievement as string) ?? 'an achievement';
      return `${name} unlocked "${ach}"`;
    }
    case 'new_pet': {
      const species = (a.payload?.species as string) ?? a.userPetSpecies ?? 'a new pet';
      return `${name} adopted a ${species}`;
    }
    case 'quest_complete': {
      const title = (a.payload?.title as string) ?? 'a quest';
      return `${name} completed "${title}"`;
    }
    case 'gift_sent': {
      const giftType = (a.payload?.giftType as string) ?? 'gift';
      const meta = getGiftTypeMeta(giftType as any);
      return `${name} sent ${meta?.icon ?? '🎁'} ${meta?.label ?? giftType}`;
    }
    case 'gift_received': {
      const giftType = (a.payload?.giftType as string) ?? 'gift';
      const meta = getGiftTypeMeta(giftType as any);
      return `${name} received ${meta?.icon ?? '🎁'} ${meta?.label ?? giftType}`;
    }
    case 'tag_added': {
      const tag = (a.payload?.tag as string) ?? 'a tag';
      return `${name} got tagged "${tag}"`;
    }
    case 'friend_joined': {
      return `${name} just joined Mobile Pet!`;
    }
    default:
      return `${name} did something`;
  }
}

export function ActivityFeed({ activities, loading, emptyTitle = 'No activity yet' }: ActivityFeedProps) {
  const theme = useTheme();
  if (loading && activities.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: theme.colors.textSecondary }}>Loading…</Text>
      </View>
    );
  }
  if (activities.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 32 }}>📜</Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            marginTop: 8,
            fontSize: theme.typography.size.subhead,
          }}
        >
          {emptyTitle}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => {
        const cfg = activityIcon(item.kind);
        const emoji = item.userPetSpecies ? defaultEmoji(item.userPetSpecies as any) : '';
        return (
          <View
            testID={`activity-${item.kind}`}
            style={[
              styles.row,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: cfg.color + '20' }]}>
              <Text style={styles.iconText}>{cfg.icon}</Text>
            </View>
            <View style={styles.content}>
              <Text
                style={{
                  color: theme.colors.text,
                  fontWeight: '500',
                  fontSize: theme.typography.size.subhead,
                }}
              >
                {describeActivity(item)}
              </Text>
              <Text
                style={{
                  color: theme.colors.textTertiary,
                  fontSize: theme.typography.size.caption1,
                  marginTop: 2,
                }}
              >
                {formatLastSeen(item.createdAt)}
                {emoji ? ` · ${emoji}` : ''}
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  row: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
