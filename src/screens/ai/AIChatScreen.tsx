/**
 * AIChatScreen — Step 12d
 *
 * Main chatbot UI:
 *  - Header: provider badge + provider/model info
 *  - Settings shortcut
 *  - Message list (user / assistant bubbles with emotion + action chips)
 *  - Input bar (TextInput + Send button)
 *  - Thinking indicator
 *
 * The PetChatbot engine is instantiated on mount and reuses the same
 * instance for the lifetime of the screen. The store pushes entries
 * to the persisted history on each response.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/useTheme';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { useAISettingsStore, selectCurrentProvider, selectIsConfigured } from '../../stores/AISettingsStore';
import {
  PetChatbot,
  actionEmoji,
  emotionEmoji,
  type ChatEntry,
} from '../../api/petChatbot';
// Side-effect: install dev exposes (Step 12d)
import '../../api/aiDev';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'AIChat'>;

export function AIChatScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useAISettingsStore();
  const provider = useAISettingsStore(selectCurrentProvider);
  const isConfigured = useAISettingsStore(selectIsConfigured);
  const pushHistory = useAISettingsStore((s) => s.pushHistory);
  const hydrate = useAISettingsStore((s) => s.hydrate);

  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const listRef = useRef<FlatList<ChatEntry>>(null);

  const chatbotRef = useRef<PetChatbot | null>(null);
  if (!chatbotRef.current) {
    chatbotRef.current = new PetChatbot({ settings });
  }

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Sync settings → chatbot instance
  useEffect(() => {
    chatbotRef.current?.updateSettings(settings);
  }, [
    settings.provider,
    settings.model,
    settings.temperature,
    settings.maxTokens,
    JSON.stringify(settings.apiKeys),
    JSON.stringify(settings.customEndpoints),
  ]);

  const history = settings.history;

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || isThinking) return;

    const userEntry: ChatEntry = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    pushHistory(userEntry);
    setDraft('');
    setIsThinking(true);
    hapticLight();

    try {
      const pet = chatbotRef.current!;
      const parsed = await pet.chat(text, {
        petName: 'Bé Pet',
        speciesName: 'Mèo Ảo',
        ownerName: 'Master',
        mood: { label: 'Vui vẻ' },
        level: 5,
        stage: 'Trưởng thành',
        personality: { energy: 70, sociability: 80, curiosity: 75, affection: 85 },
      });

      pushHistory({
        role: 'assistant',
        content: parsed.cleanText,
        raw: parsed.rawText,
        actions: parsed.actions,
        emotion: parsed.emotion,
        timestamp: Date.now(),
        model: settings.model,
        provider: settings.provider,
      });

      if (parsed.actions.length > 0) hapticSuccess();
    } catch (err: any) {
      pushHistory({
        role: 'assistant',
        content: `*Bé nhìn bạn với đôi mắt tròn xoe* (Lỗi: ${err?.message || 'Không có phản hồi'})`,
        timestamp: Date.now(),
        error: err?.message,
      });
    } finally {
      setIsThinking(false);
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Auto-scroll on new message
  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [history.length]);

  const renderItem = ({ item }: { item: ChatEntry }) => (
    <MessageBubble entry={item} />
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>{provider?.icon || '🤖'}</Text>
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {provider?.name || 'AI Chat'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {settings.model}
              </Text>
            </View>
          </View>
          {provider?.badge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: provider.badgeColor + '22',
                  borderColor: provider.badgeColor,
                  alignSelf: 'flex-start',
                  marginTop: 6,
                },
              ]}
            >
              <Text style={{ color: provider.badgeColor, fontSize: 11, fontWeight: '700' }}>
                {provider.badge}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => { hapticLight(); navigation.navigate('AISettings'); }}
          accessibilityRole="button"
          testID="ai-settings-open"
          hitSlop={10}
          style={[
            styles.settingsBtn,
            { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.pill },
          ]}
        >
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </Pressable>
      </View>

      {/* Warning banner if not configured */}
      {!isConfigured && settings.provider !== 'offline' && (
        <Pressable
          onPress={() => navigation.navigate('AISettings')}
          style={[styles.warning, { backgroundColor: '#FF9500' + '22', borderColor: '#FF9500' }]}
          testID="ai-warning-banner"
        >
          <Text style={{ color: '#FF9500', fontSize: 12, fontWeight: '600' }}>
            ⚠️ Chưa cấu hình API Key. Bấm để thiết lập ngay.
          </Text>
        </Pressable>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={history}
        keyExtractor={(item, idx) => `${item.timestamp}-${idx}`}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>{provider?.icon || '🤖'}</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {provider?.name || 'AI Chat'}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
              {provider?.tagline || 'Bắt đầu cuộc trò chuyện với bé pet!'}
            </Text>
          </View>
        }
        testID="ai-chat-list"
      />

      {/* Thinking indicator */}
      {isThinking && (
        <View style={[styles.thinkingBar, { backgroundColor: theme.colors.surfaceAlt }]}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <Text style={{ color: theme.colors.textSecondary, marginLeft: 8, fontSize: 12 }}>
            {provider?.name || 'AI'} đang suy nghĩ...
          </Text>
        </View>
      )}

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Nhắn cho bé pet..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={500}
          editable={!isThinking}
          testID="ai-chat-input"
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceAlt,
              color: theme.colors.text,
              borderRadius: theme.radius.lg,
              borderColor: theme.colors.border,
            },
          ]}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!draft.trim() || isThinking}
          accessibilityRole="button"
          accessibilityState={{ disabled: !draft.trim() || isThinking }}
          testID="ai-chat-send"
          style={[
            styles.sendBtn,
            {
              backgroundColor: draft.trim() && !isThinking ? theme.colors.accent : theme.colors.surfaceAlt,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <Text style={{ color: draft.trim() ? theme.colors.onAccent : theme.colors.textSecondary, fontSize: 18 }}>
            ➤
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────

function MessageBubble({ entry }: { entry: ChatEntry }) {
  const theme = useTheme();
  const isUser = entry.role === 'user';
  const emotion = entry.emotion || 'neutral';
  const actions = entry.actions || [];

  return (
    <View
      testID={`ai-msg-${entry.role}-${entry.timestamp}`}
      style={[
        styles.bubbleRow,
        { justifyContent: isUser ? 'flex-end' : 'flex-start' },
      ]}
    >
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: theme.colors.accent + '33' }]}>
          <Text style={{ fontSize: 18 }}>{emotionEmoji(emotion)}</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.colors.accent : theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Text
          style={{
            color: isUser ? theme.colors.onAccent : theme.colors.text,
            fontSize: 15,
            lineHeight: 21,
          }}
        >
          {entry.content}
        </Text>
        {entry.error && (
          <Text style={[styles.errorTag, { color: '#FF3B30' }]}>
            ⚠️ {entry.error}
          </Text>
        )}
        {!isUser && actions.length > 0 && (
          <View style={styles.actionRow}>
            {actions.map((a, idx) => (
              <View
                key={`${a}-${idx}`}
                style={[
                  styles.actionChip,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <Text style={{ fontSize: 12 }}>
                  {actionEmoji(a)} {a}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 11, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  settingsBtn: { padding: 8, marginLeft: 8 },

  warning: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },

  bubbleRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderWidth: 1,
  },
  errorTag: { fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  actionChip: { paddingHorizontal: 8, paddingVertical: 3 },

  thinkingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyDesc: { fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 24 },
});
