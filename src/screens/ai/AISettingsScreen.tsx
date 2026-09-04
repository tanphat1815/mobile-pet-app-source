/**
 * AISettingsScreen — Step 12d
 *
 * Configure BYOK AI provider:
 *  - Provider list (7 cards)
 *  - Model picker for the selected provider
 *  - API Key input (masked)
 *  - Custom endpoint (for Ollama)
 *  - Temperature slider (0..2)
 *  - Max tokens slider (50..400)
 *  - Toggles: enableActions / enableVoiceReaction
 *  - Test Connection button
 *  - Danger zone: Clear history / Reset
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/useTheme';
import { hapticLight, hapticSuccess, hapticError } from '../../utils/haptics';
import { useAISettingsStore } from '../../stores/AISettingsStore';
import {
  AI_PROVIDERS,
  getAllProviders,
  type ProviderId,
  isProviderConfigured,
} from '../../api/aiConfig';
import { LLMClient } from '../../api/llmClient';
import { CustomSlider } from '../../shared/components/CustomSlider';
import { Button } from '../../shared/components/Button';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'AISettings'>;

export function AISettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useAISettingsStore();
  const setProvider = useAISettingsStore((s) => s.setProvider);
  const setModel = useAISettingsStore((s) => s.setModel);
  const setApiKey = useAISettingsStore((s) => s.setApiKey);
  const removeApiKey = useAISettingsStore((s) => s.removeApiKey);
  const setCustomEndpoint = useAISettingsStore((s) => s.setCustomEndpoint);
  const setTemperature = useAISettingsStore((s) => s.setTemperature);
  const setMaxTokens = useAISettingsStore((s) => s.setMaxTokens);
  const toggleEnableActions = useAISettingsStore((s) => s.toggleEnableActions);
  const toggleEnableVoiceReaction = useAISettingsStore((s) => s.toggleEnableVoiceReaction);
  const clearHistory = useAISettingsStore((s) => s.clearHistory);
  const reset = useAISettingsStore((s) => s.reset);

  const provider = AI_PROVIDERS[settings.provider];
  const [testing, setTesting] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [endpointDraft, setEndpointDraft] = useState('');

  const handleProviderChange = (id: ProviderId) => {
    hapticLight();
    setProvider(id);
  };

  const handleTest = async () => {
    if (!isProviderConfigured(settings, settings.provider)) {
      hapticError();
      Alert.alert(
        'Chưa cấu hình',
        `Vui lòng nhập API Key cho ${provider.name} trước khi kiểm tra kết nối.`
      );
      return;
    }
    setTesting(true);
    try {
      const result = await LLMClient.testConnection(
        settings.provider,
        settings.apiKeys[settings.provider] || '',
        settings.customEndpoints[settings.provider] || '',
        settings.model
      );
      if (result.success) {
        hapticSuccess();
        Alert.alert('✅ Kết nối thành công', result.message);
      } else {
        hapticError();
        Alert.alert('❌ Kết nối thất bại', result.message);
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            testID="ai-settings-back"
          >
            <Text style={[styles.backBtn, { color: theme.colors.accent }]}>‹ Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text, marginLeft: 12 }]}>
            🤖 AI Settings
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Bring Your Own Key — chọn nhà cung cấp AI
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Provider list */}
        <Section title="Nhà cung cấp">
          {getAllProviders().map((p) => {
            const active = p.id === settings.provider;
            const configured = isProviderConfigured(settings, p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => handleProviderChange(p.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`ai-provider-${p.id}`}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: active ? p.badgeColor + '22' : theme.colors.surface,
                    borderColor: active ? p.badgeColor : theme.colors.border,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <Text style={{ fontSize: 28 }}>{p.icon}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.providerName, { color: theme.colors.text }]}>
                      {p.name}
                    </Text>
                    {configured && (
                      <Text style={{ marginLeft: 6, fontSize: 12 }}>✅</Text>
                    )}
                  </View>
                  <Text style={[styles.providerTagline, { color: theme.colors.textSecondary }]}>
                    {p.tagline}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: p.badgeColor + '22',
                        borderColor: p.badgeColor,
                        alignSelf: 'flex-start',
                        marginTop: 4,
                      },
                    ]}
                  >
                    <Text style={{ color: p.badgeColor, fontSize: 10, fontWeight: '700' }}>
                      {p.badge}
                    </Text>
                  </View>
                </View>
                {active && (
                  <Text style={{ color: p.badgeColor, fontSize: 18 }}>✓</Text>
                )}
              </Pressable>
            );
          })}
        </Section>

        {/* Model picker */}
        <Section title="Model">
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg }]}>
            {provider.models.map((m) => {
              const active = m.id === settings.model;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => { hapticLight(); setModel(m.id); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  testID={`ai-model-${m.id}`}
                  style={[
                    styles.modelRow,
                    {
                      backgroundColor: active ? theme.colors.accent + '22' : 'transparent',
                      borderRadius: theme.radius.md,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modelName, { color: theme.colors.text }]}>
                      {m.name}
                    </Text>
                    <Text style={[styles.modelId, { color: theme.colors.textSecondary }]}>
                      {m.id}
                    </Text>
                  </View>
                  {m.isDefault && (
                    <View
                      style={[
                        styles.defaultChip,
                        {
                          backgroundColor: theme.colors.accent + '22',
                          borderColor: theme.colors.accent,
                          borderRadius: theme.radius.pill,
                        },
                      ]}
                    >
                      <Text style={{ color: theme.colors.accent, fontSize: 10, fontWeight: '700' }}>
                        Mặc định
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* API Key (if required) */}
        {provider.requiresApiKey && (
          <Section
            title={`API Key (${provider.name})`}
            helper={provider.apiKeyHelpUrl ? (
              <Pressable
                onPress={() => Linking.openURL(provider.apiKeyHelpUrl!)}
                accessibilityRole="link"
              >
                <Text style={[styles.helperLink, { color: theme.colors.accent }]}>
                  Lấy API Key miễn phí tại đây ↗
                </Text>
              </Pressable>
            ) : undefined}
          >
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg }]}>
              <TextInput
                value={keyDraft || settings.apiKeys[settings.provider] || ''}
                onChangeText={setKeyDraft}
                placeholder={provider.apiKeyPlaceholder || 'API Key'}
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                testID="ai-api-key-input"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    color: theme.colors.text,
                    borderRadius: theme.radius.md,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Button
                  title="Lưu"
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    if (keyDraft.trim()) {
                      setApiKey(settings.provider, keyDraft.trim());
                      setKeyDraft('');
                      hapticSuccess();
                    }
                  }}
                  testID="ai-api-key-save"
                />
                {settings.apiKeys[settings.provider] && (
                  <Button
                    title="Xóa"
                    variant="ghost"
                    size="sm"
                    onPress={() => { removeApiKey(settings.provider); setKeyDraft(''); hapticLight(); }}
                    testID="ai-api-key-clear"
                  />
                )}
              </View>
            </View>
          </Section>
        )}

        {/* Endpoint (for ollama) */}
        {provider.requiresEndpoint && (
          <Section title="Custom Endpoint">
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg }]}>
              <TextInput
                value={endpointDraft || settings.customEndpoints[settings.provider] || ''}
                onChangeText={setEndpointDraft}
                placeholder={provider.defaultEndpoint}
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                testID="ai-endpoint-input"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    color: theme.colors.text,
                    borderRadius: theme.radius.md,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
              <Button
                title="Lưu Endpoint"
                variant="primary"
                size="sm"
                onPress={() => {
                  if (endpointDraft.trim()) {
                    setCustomEndpoint(settings.provider, endpointDraft.trim());
                    setEndpointDraft('');
                    hapticSuccess();
                  }
                }}
                testID="ai-endpoint-save"
              />
            </View>
          </Section>
        )}

        {/* Tunables */}
        <Section title="Tham số">
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg }]}>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Temperature: {settings.temperature.toFixed(2)}
              </Text>
              <View style={{ flex: 1 }}>
                <CustomSlider
                  value={settings.temperature / 2}
                  onChange={(v) => setTemperature(v * 2)}
                  fillColor={theme.colors.accent}
                  trackColor={theme.colors.border}
                  testID="ai-temperature-slider"
                />
              </View>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Max tokens: {settings.maxTokens}
              </Text>
              <View style={{ flex: 1 }}>
                <CustomSlider
                  value={(settings.maxTokens - 50) / 350}
                  onChange={(v) => setMaxTokens(50 + v * 350)}
                  fillColor={theme.colors.accent}
                  trackColor={theme.colors.border}
                  testID="ai-maxtokens-slider"
                />
              </View>
            </View>
            <ToggleRow
              label="Kích hoạt Action triggers"
              value={settings.enableActions}
              onToggle={toggleEnableActions}
              testID="ai-toggle-actions"
            />
            <ToggleRow
              label="Phản ứng giọng nói"
              value={settings.enableVoiceReaction}
              onToggle={toggleEnableVoiceReaction}
              testID="ai-toggle-voice"
            />
          </View>
        </Section>

        {/* Test Connection */}
        <Section title="Kiểm tra kết nối">
          <Button
            title={testing ? 'Đang kiểm tra...' : '🧪 Test Connection'}
            variant="primary"
            size="md"
            onPress={handleTest}
            disabled={testing}
            testID="ai-test-connection"
          />
        </Section>

        {/* Danger zone */}
        <Section title="Vùng nguy hiểm">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="🗑 Xóa lịch sử"
                variant="ghost"
                size="sm"
                onPress={() => {
                  Alert.alert('Xóa lịch sử?', 'Toàn bộ cuộc trò chuyện sẽ bị xóa.', [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Xóa', style: 'destructive', onPress: () => { clearHistory(); hapticLight(); } },
                  ]);
                }}
                testID="ai-clear-history"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="↺ Reset"
                variant="ghost"
                size="sm"
                onPress={() => {
                  Alert.alert('Reset?', 'Toàn bộ cài đặt AI sẽ trở về mặc định.', [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Reset', style: 'destructive', onPress: reset },
                  ]);
                }}
                testID="ai-reset"
              />
            </View>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function Section({ title, helper, children }: { title: string; helper?: React.ReactNode; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {helper}
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onToggle, testID }: { label: string; value: boolean; onToggle: () => void; testID?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      testID={testID}
      style={styles.toggleRow}
    >
      <Text style={[styles.rowLabel, { color: theme.colors.text }]}>{label}</Text>
      <View
        style={[
          styles.switchTrack,
          {
            backgroundColor: value ? theme.colors.accent : theme.colors.border,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <View
          style={[
            styles.switchThumb,
            {
              backgroundColor: value ? theme.colors.onAccent : '#FFF',
              transform: [{ translateX: value ? 14 : 0 }],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { fontSize: 16 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  body: { padding: 16 },

  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  helperLink: { fontSize: 12, marginBottom: 8 },

  card: { borderWidth: 1, padding: 12 },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },

  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  providerName: { fontSize: 15, fontWeight: '700' },
  providerTagline: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderRadius: 999 },

  modelRow: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 4 },
  modelName: { fontSize: 14, fontWeight: '600' },
  modelId: { fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  defaultChip: { paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  rowLabel: { fontSize: 13, fontWeight: '600', width: 130 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchTrack: {
    width: 36,
    height: 22,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 999,
  },
});
