/**
 * FriendsScreen
 *
 * Three tabs:
 *   - Friends: confirmed friend list with online status
 *   - Requests: incoming + outgoing friend requests
 *   - Suggestions: people you may know + search
 *
 * Real-time: the useFriendRealtimeSync hook pipes friend:status and
 * friend:request events from the SyncManager into the store. We call
 * it here as a fallback (it's idempotent).
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useFriendStore, useFriendRealtimeSync } from '../stores/FriendStore';
import { FriendRow } from '../shared/components/FriendRow';
import { FriendRequestRow } from '../shared/components/FriendRequestRow';
import { SuggestionRow } from '../shared/components/SuggestionRow';
import { FriendSearchBar } from '../shared/components/FriendSearchBar';
import { SegmentedTabs, TabItem } from '../shared/components/SegmentedTabs';
import { Card } from '../shared/components/Card';
import { Modal } from '../shared/components/Modal';
import { FriendTagChips } from '../shared/components/FriendTagChips';
import { ActivityFeed } from '../shared/components/ActivityFeed';
import { SendGiftSheet } from '../shared/components/SendGiftSheet';
import { GiftCard } from '../shared/components/GiftCard';
import { byPresenceThenName, byRequestOrder, Friend } from '../api/friendTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Friends'>;
type TabKey = 'friends' | 'requests' | 'suggestions' | 'activity';

export function FriendsScreen({ navigation }: Props) {
  const theme = useTheme();

  const status = useFriendStore((s) => s.status);
  const friends = useFriendStore((s) => s.friends);
  const requests = useFriendStore((s) => s.requests);
  const suggestions = useFriendStore((s) => s.suggestions);
  const searchResults = useFriendStore((s) => s.searchResults);
  const searchQuery = useFriendStore((s) => s.searchQuery);
  const searching = useFriendStore((s) => s.searching);
  const decidingRequestIds = useFriendStore((s) => s.decidingRequestIds);

  const loadAll = useFriendStore((s) => s.loadAll);
  const decideRequest = useFriendStore((s) => s.decideRequest);
  const cancelRequest = useFriendStore((s) => s.cancelRequest);
  const sendRequest = useFriendStore((s) => s.sendRequest);
  const removeFriendFn = useFriendStore((s) => s.removeFriend);
  const searchFn = useFriendStore((s) => s.search);
  const clearSearch = useFriendStore((s) => s.clearSearch);
  // Step 4 — tags, gifts, activity
  const updateTags = useFriendStore((s) => s.updateTags);
  const sendGift = useFriendStore((s) => s.sendGift);
  const gifts = useFriendStore((s) => s.gifts);
  const loadGifts = useFriendStore((s) => s.loadGifts);
  const ackGift = useFriendStore((s) => s.acknowledgeGiftAction);
  const activity = useFriendStore((s) => s.activity);
  const activityStatus = useFriendStore((s) => s.activityStatus);
  const loadActivity = useFriendStore((s) => s.loadActivity);

  const [tab, setTab] = useState<TabKey>('friends');
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  const [giftSheetFriend, setGiftSheetFriend] = useState<Friend | null>(null);
  const [tagSheetFriend, setTagSheetFriend] = useState<Friend | null>(null);

  useFriendRealtimeSync();

  useEffect(() => {
    if (status === 'idle') {
      loadAll();
    }
    if (activityStatus === 'idle') {
      loadActivity();
    }
  }, [status, activityStatus, loadAll, loadActivity]);

  const incomingCount = requests.filter((r) => r.direction === 'incoming').length;

  const tabs: TabItem[] = [
    { key: 'friends', label: 'Friends', badge: friends.length },
    { key: 'requests', label: 'Requests', badge: incomingCount },
    { key: 'suggestions', label: 'Add', badge: suggestions.length },
    { key: 'activity', label: 'Activity', badge: activity.length },
  ];

  // Debounced search
  useEffect(() => {
    if (tab !== 'suggestions') {
      if (searchQuery) clearSearch();
      return;
    }
    if (!searchQuery) {
      clearSearch();
      return;
    }
    const handle = setTimeout(() => searchFn(searchQuery), 300);
    return () => clearTimeout(handle);
  }, [tab, searchQuery, searchFn, clearSearch]);

  const handleSendRequest = useCallback(
    async (userId: string) => {
      setSendingRequestTo(userId);
      try {
        await sendRequest({ userId });
      } catch (err) {
        Alert.alert(
          'Could not send request',
          err instanceof Error ? err.message : 'Unknown error'
        );
      } finally {
        setSendingRequestTo(null);
      }
    },
    [sendRequest]
  );

  const handleLongPressFriend = useCallback(
    (friend: Friend) => {
      Alert.alert(
        friend.displayName,
        'Choose an action',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Gift',
            onPress: () => setGiftSheetFriend(friend),
          },
          {
            text: 'Edit Tags',
            onPress: () => setTagSheetFriend(friend),
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeFriendFn(friend.userId),
          },
        ]
      );
    },
    [removeFriendFn]
  );

  const handleMessageFriend = useCallback(
    (friend: Friend) => {
      // Find an existing conversation with this friend (if any).
      // For the demo, the existing conversation ids are conv_alice /
      // conv_bob / conv_carol. We map by user id -> conv id.
      const map: Record<string, string> = {
        u_alice: 'conv_alice',
        u_bob: 'conv_bob',
        u_carol: 'conv_carol',
      };
      const convId = map[friend.userId];
      if (convId) {
        navigation.navigate('ChatThread', { conversationId: convId });
      } else {
        // No conversation yet - go to the chat list
        navigation.navigate('ChatList');
      }
    },
    [navigation]
  );

  const sortedFriends = [...friends].sort(byPresenceThenName);
  const sortedRequests = [...requests].sort(byRequestOrder);

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
          Friends
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            marginTop: 2,
          }}
        >
          {sortedFriends.filter((f) => f.presence === 'online').length} online now
        </Text>
      </View>

      <SegmentedTabs items={tabs} activeKey={tab} onChange={(k) => setTab(k as TabKey)} />

      {tab === 'friends' && (
        <FlatList
          data={sortedFriends}
          keyExtractor={(f) => f.userId}
          renderItem={({ item }) => (
            <FriendRow
              friend={item}
              onPress={() => handleMessageFriend(item)}
              onLongPress={() => handleLongPressFriend(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={status === 'loading'}
              onRefresh={loadAll}
              tintColor={theme.colors.accent}
            />
          }
          ListEmptyComponent={
            <EmptyView
              title={status === 'loading' ? 'Loading...' : 'No friends yet'}
              subtitle="Visit the Add tab to send requests"
              theme={theme}
            />
          }
        />
      )}

      {tab === 'requests' && (
        <FlatList
          data={sortedRequests}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <FriendRequestRow
              request={item}
              isDeciding={decidingRequestIds.includes(item.id)}
              onAccept={() =>
                decideRequest({ requestId: item.id, decision: 'accept' })
              }
              onDecline={() =>
                decideRequest({ requestId: item.id, decision: 'decline' })
              }
              onCancel={() => cancelRequest(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={status === 'loading'}
              onRefresh={loadAll}
              tintColor={theme.colors.accent}
            />
          }
          ListEmptyComponent={
            <EmptyView
              title="No pending requests"
              subtitle="Friend requests will appear here"
              theme={theme}
            />
          }
        />
      )}

      {tab === 'suggestions' && (
        <>
          <FriendSearchBar
            value={searchQuery}
            onChange={(q) => {
              // We need to update the store's searchQuery so the effect
              // above picks it up and triggers searchFn.
              useFriendStore.setState({ searchQuery: q });
            }}
          />
          <FlatList
            data={searchQuery ? searchResults : suggestions}
            keyExtractor={(s) => s.userId}
            renderItem={({ item }) => (
              <SuggestionRow
                suggestion={item}
                requested={requests.some(
                  (r) =>
                    r.fromUserId === item.userId && r.direction === 'outgoing'
                )}
                sending={sendingRequestTo === item.userId}
                onAdd={() => handleSendRequest(item.userId)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={searching}
                onRefresh={loadAll}
                tintColor={theme.colors.accent}
              />
            }
            ListEmptyComponent={
              <EmptyView
                title={searchQuery ? 'No matches' : 'No suggestions yet'}
                subtitle={
                  searchQuery
                    ? 'Try a different search'
                    : 'Come back later'
                }
                theme={theme}
              />
            }
          />
        </>
      )}

      {tab === 'activity' && (
        <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
          {/* Gifts + Activity split view */}
          {gifts.length > 0 ? (
            <View style={{ marginBottom: theme.spacing.lg }}>
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
                Recent Gifts
              </Text>
              {gifts.slice(0, 3).map((g) => (
                <GiftCard
                  key={g.id}
                  gift={g}
                  onAcknowledge={(gift) => ackGift(gift.id)}
                />
              ))}
            </View>
          ) : null}
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
            Activity Feed
          </Text>
          <ActivityFeed
            activities={activity}
            loading={activityStatus === 'loading'}
            emptyTitle="Chưa có hoạt động nào. Hãy chơi cùng bạn bè!"
          />
        </View>
      )}

      {/* Send Gift Sheet */}
      {giftSheetFriend ? (
        <SendGiftSheet
          visible={!!giftSheetFriend}
          onClose={() => setGiftSheetFriend(null)}
          toUserId={giftSheetFriend.userId}
          toDisplayName={giftSheetFriend.displayName}
          coinsBalance={9999}
          onSend={async ({ giftType, message }) => {
            await sendGift({
              toUserId: giftSheetFriend.userId,
              giftType,
              message,
            });
            // Refresh activity after sending
            await loadActivity();
          }}
        />
      ) : null}

      {/* Tag editing sheet */}
      {tagSheetFriend ? (
        <TagEditSheet
          visible={!!tagSheetFriend}
          friend={tagSheetFriend}
          onClose={() => setTagSheetFriend(null)}
          onAdd={async (tag) => {
            await updateTags(tagSheetFriend.userId, [
              ...(tagSheetFriend.tags ?? []),
              tag,
            ]);
            // Refresh local reference
            setTagSheetFriend({
              ...tagSheetFriend,
              tags: [...(tagSheetFriend.tags ?? []), tag],
            });
          }}
          onRemove={async (tag) => {
            await updateTags(
              tagSheetFriend.userId,
              (tagSheetFriend.tags ?? []).filter((t) => t !== tag)
            );
            setTagSheetFriend({
              ...tagSheetFriend,
              tags: (tagSheetFriend.tags ?? []).filter((t) => t !== tag),
            });
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * Tag edit sheet (small modal chứa FriendTagChips với editable=true).
 */
function TagEditSheet({
  visible,
  friend,
  onClose,
  onAdd,
  onRemove,
}: {
  visible: boolean;
  friend: Friend;
  onClose: () => void;
  onAdd: (tag: any) => Promise<void>;
  onRemove: (tag: any) => Promise<void>;
}) {
  const theme = useTheme();
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      title={`Tags for ${friend.displayName}`}
      contentStyle={{ maxWidth: 480, width: '100%' }}
    >
      <View style={{ padding: 4 }}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.footnote,
            marginBottom: theme.spacing.md,
            textAlign: 'center',
          }}
        >
          Tap a tag to add/remove. Tap "+ Add" cho danh sách đầy đủ.
        </Text>
        <FriendTagChips
          tags={friend.tags ?? []}
          editable
          onAdd={onAdd}
          onRemove={onRemove}
          size="md"
          maxVisible={6}
        />
        <Pressable
          onPress={onClose}
          style={{
            marginTop: theme.spacing.lg,
            height: 44,
            borderRadius: 10,
            backgroundColor: theme.colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function EmptyView({
  title,
  subtitle,
  theme,
}: {
  title: string;
  subtitle: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.empty}>
      <Card>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.headline,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <View style={{ height: 4 }} />
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  empty: {
    paddingHorizontal: 32,
    paddingTop: 32,
  },
});