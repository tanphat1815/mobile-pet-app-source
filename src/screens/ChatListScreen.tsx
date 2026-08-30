/**
 * ChatListScreen
 *
 * List of all conversations. Tapping a row navigates to ChatThreadScreen.
 * Loads conversations on mount. Subscribes to chat:message realtime
 * events to keep the list up to date.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { useChatStore, useChatRealtimeSync } from '../stores/ChatStore';
import { ConversationRow } from '../shared/components/ConversationRow';
import { byUpdatedDesc } from '../api/chatTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'ChatList'>;

export function ChatListScreen({ navigation }: Props) {
  const theme = useTheme();
  const currentUserId = useAuthStore((s) => s.user?.id ?? 'dev_user');

  const conversations = useChatStore((s) => s.conversations);
  const status = useChatStore((s) => s.listStatus);
  const error = useChatStore((s) => s.listError);
  const loadConversations = useChatStore((s) => s.loadConversations);

  // Subscribe to realtime chat events
  useChatRealtimeSync();

  useEffect(() => {
    if (status === 'idle') {
      loadConversations();
    }
  }, [status, loadConversations]);

  const sorted = [...conversations].sort(byUpdatedDesc);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: theme.spacing.xxxl,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
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
          Chat
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            marginTop: 2,
          }}
        >
          {sorted.length} conversation{sorted.length === 1 ? '' : 's'}
        </Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            currentUserId={currentUserId}
            onPress={() =>
              navigation.navigate('ChatThread', { conversationId: item.id })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={loadConversations}
            tintColor={theme.colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {status === 'error' ? (
              <>
                <Text
                  style={{
                    color: theme.colors.danger,
                    fontSize: theme.typography.size.subhead,
                  }}
                >
                  {error ?? 'Failed to load conversations'}
                </Text>
                <View style={{ height: 12 }} />
                <Pressable onPress={loadConversations}>
                  <Text
                    style={{
                      color: theme.colors.accent,
                      fontSize: theme.typography.size.subhead,
                      fontWeight: '600',
                    }}
                  >
                    Tap to retry
                  </Text>
                </Pressable>
              </>
            ) : status === 'loading' ? (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.size.subhead,
                }}
              >
                Loading...
              </Text>
            ) : (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.size.subhead,
                }}
              >
                No conversations yet
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
});