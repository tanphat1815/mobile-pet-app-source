/**
 * ChatThreadScreen
 *
 * Single conversation view. Loads thread on mount, sends messages via
 * ChatStore.send (optimistic). Auto-scrolls to the bottom on new
 * messages.
 *
 * Real-time: the useChatRealtimeSync hook pipes chat:message and
 * chat:read events from the SyncManager into the store. We call it
 * here as a fallback (it's idempotent).
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { useChatStore, useChatRealtimeSync } from '../stores/ChatStore';
import { ChatBubble } from '../shared/components/ChatBubble';
import { ChatInputBar } from '../shared/components/ChatInputBar';
import { byTsAsc, ChatMessage } from '../api/chatTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'ChatThread'>;

// Module-level stable reference for the empty thread fallback.
// Returning a fresh `[]` literal from a Zustand selector creates a new
// reference on every render, which triggers an infinite re-render loop
// because Zustand uses Object.is for selector equality.
const EMPTY_MESSAGES: readonly ChatMessage[] = Object.freeze([]);

export function ChatThreadScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { conversationId } = route.params;
  const currentUserId = useAuthStore((s) => s.user?.id ?? 'dev_user');

  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === conversationId) ?? null
  );
  const messages = useChatStore((s) => s.threads[conversationId] ?? EMPTY_MESSAGES);
  const threadStatus = useChatStore((s) => s.threadStatus[conversationId] ?? 'idle');
  const loadThread = useChatStore((s) => s.loadThread);
  const send = useChatStore((s) => s.send);
  const markThreadRead = useChatStore((s) => s.markThreadRead);

  useChatRealtimeSync();

  // Load messages on mount
  useEffect(() => {
    if (threadStatus === 'idle') {
      loadThread(conversationId);
    }
    markThreadRead(conversationId);
  }, [conversationId, threadStatus, loadThread, markThreadRead]);

  // Set header title to the other participant's name
  useEffect(() => {
    if (conversation) {
      const other = conversation.participants.find((p) => p.userId !== currentUserId);
      navigation.setOptions({
        headerShown: true,
        title: other?.displayName ?? 'Chat',
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTitleStyle: { color: theme.colors.text },
        headerTintColor: theme.colors.accent,
      });
    }
  }, [conversation, currentUserId, navigation, theme]);

  const listRef = useRef<FlatList<typeof messages[number]>>(null);

  const handleSend = useCallback(
    async (text: string) => {
      await send({ conversationId, text });
    },
    [conversationId, send]
  );

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  const sortedMessages = [...messages].sort(byTsAsc);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={sortedMessages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <ChatBubble message={item} isOutgoing={item.fromUserId === currentUserId} />
        )}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          threadStatus === 'loading' ? (
            <View style={styles.empty}>
              <Text style={{ color: theme.colors.textSecondary }}>Loading…</Text>
            </View>
          ) : threadStatus === 'error' ? (
            <View style={styles.empty}>
              <Text style={{ color: theme.colors.danger }}>Failed to load messages</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={{ color: theme.colors.textSecondary }}>Say hi 👋</Text>
            </View>
          )
        }
      />
      <ChatInputBar onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});