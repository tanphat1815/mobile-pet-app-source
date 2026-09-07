/**
 * PairingScreen
 *
 * Cross-device pairing. Three tabs:
 *   - Show code: generate / regenerate a 6-digit code with countdown
 *   - Enter code: submit another device's code (with platform + name)
 *   - Devices: list of paired devices with unpair
 *
 * Real-time: usePairingRealtimeSync pipes pairing:code and
 * pairing:confirmed events from the SyncManager.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Platform as RNPlatform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { usePairingStore, usePairingRealtimeSync } from '../stores/PairingStore';
import {
  formatPairingCode,
  normalizePairingCode,
  PairedDevice,
} from '../api/pairingTypes';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { SegmentedTabs, TabItem } from '../shared/components/SegmentedTabs';
import { PairingCodeDisplay } from '../shared/components/PairingCodeDisplay';
import { PairedDeviceRow } from '../shared/components/PairedDeviceRow';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Pairing'>;
type TabKey = 'show' | 'enter' | 'devices';

export function PairingScreen({ navigation }: Props) {
  const theme = useTheme();

  const currentCode = usePairingStore((s) => s.currentCode);
  const codeBusy = usePairingStore((s) => s.codeBusy);
  const devices = usePairingStore((s) => s.devices);
  const devicesStatus = usePairingStore((s) => s.devicesStatus);
  const devicesError = usePairingStore((s) => s.devicesError);
  const submitting = usePairingStore((s) => s.submitting);
  const submitError = usePairingStore((s) => s.submitError);
  const lastPairedDevice = usePairingStore((s) => s.lastPairedDevice);

  const generateCode = usePairingStore((s) => s.generateCode);
  const cancelCode = usePairingStore((s) => s.cancelCode);
  const submitCode = usePairingStore((s) => s.submitCode);
  const unpair = usePairingStore((s) => s.unpair);
  const loadDevices = usePairingStore((s) => s.loadDevices);
  const clearSubmitError = usePairingStore((s) => s.clearSubmitError);

  const [tab, setTab] = useState<TabKey>('show');
  const [now, setNow] = useState<number>(Date.now());
  const [enterCode, setEnterCode] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');

  usePairingRealtimeSync();

  // 1Hz ticker for the countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-generate a code when entering the Show tab
  useEffect(() => {
    if (tab === 'show' && !currentCode && !codeBusy) {
      generateCode('My device');
    }
  }, [tab, currentCode, codeBusy, generateCode]);

  // When a pair succeeds, jump to the devices tab to celebrate
  const lastSeenPairedRef = useRef<PairedDevice | null>(null);
  useEffect(() => {
    if (
      lastPairedDevice &&
      lastSeenPairedRef.current?.id !== lastPairedDevice.id
    ) {
      lastSeenPairedRef.current = lastPairedDevice;
      setTab('devices');
      setEnterCode('');
      clearSubmitError();
    }
  }, [lastPairedDevice, clearSubmitError]);

  const tabs: TabItem[] = [
    { key: 'show', label: 'Show code' },
    { key: 'enter', label: 'Enter code' },
    { key: 'devices', label: 'Devices', badge: devices.length },
  ];

  const remainingSecs = currentCode
    ? Math.floor((currentCode.expiresAt - now) / 1000)
    : 0;

  const handleSubmit = useCallback(async () => {
    const normalized = normalizePairingCode(enterCode);
    if (normalized.length !== 6) {
      Alert.alert('Invalid code', 'Please enter all 6 digits.');
      return;
    }
    const platform: PairedDevice['platform'] =
      RNPlatform.OS === 'ios'
        ? 'ios'
        : RNPlatform.OS === 'android'
        ? 'android'
        : 'web';
    const name = deviceName.trim() || `${RNPlatform.OS} device`;
    try {
      await submitCode(normalized, name, platform);
    } catch (err) {
      // submitError is set in the store
    }
  }, [enterCode, deviceName, submitCode]);

  return (
    <KeyboardAvoidingView
      behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
      keyboardVerticalOffset={90}
    >
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
          Pairing
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            marginTop: 2,
          }}
        >
          Sync your pet across devices
        </Text>
      </View>

      <SegmentedTabs items={tabs} activeKey={tab} onChange={(k) => setTab(k as TabKey)} />

      {tab === 'show' && (
        <View style={styles.tabContent}>
          {currentCode && remainingSecs > 0 ? (
            <>
              <PairingCodeDisplay
                code={currentCode.code}
                expiresAt={currentCode.expiresAt}
                now={now}
              />
              <View style={{ height: 16 }} />
              <Card>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.size.subhead,
                  }}
                >
                  On your other device, go to <Text style={{ fontWeight: '700' }}>Pairing</Text>{' '}
                  and tap <Text style={{ fontWeight: '700' }}>Enter code</Text>.
                </Text>
                <View style={{ height: 8 }} />
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.footnote,
                  }}
                >
                  The code will expire in 5 minutes. You can regenerate at any time.
                </Text>
              </Card>
              <View style={{ height: 24 }} />
              <Button
                title="Cancel code"
                onPress={cancelCode}
                variant="ghost"
                disabled={codeBusy}
                style={{ alignSelf: 'stretch' }}
              />
            </>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              <Card>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.size.subhead,
                    textAlign: 'center',
                  }}
                >
                  {currentCode && remainingSecs <= 0
                    ? 'This code has expired.'
                    : 'No active pairing code.'}
                </Text>
                <View style={{ height: 12 }} />
                <Button
                  title="Generate code"
                  onPress={() => generateCode('My device')}
                  loading={codeBusy}
                  disabled={codeBusy}
                  style={{ alignSelf: 'stretch' }}
                />
              </Card>
            </View>
          )}
        </View>
      )}

      {tab === 'enter' && (
        <View style={styles.tabContent}>
          <View style={{ paddingHorizontal: 16 }}>
            <Card>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.size.caption1,
                  fontWeight: '600',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                ENTER CODE
              </Text>
              <TextInput
                value={formatPairingCode(enterCode)}
                onChangeText={(t) => setEnterCode(normalizePairingCode(t))}
                placeholder="000-000"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="number-pad"
                maxLength={7 /* allows the dash */}
                style={{
                  color: theme.colors.text,
                  fontSize: 36,
                  fontWeight: '700',
                  letterSpacing: 6,
                  textAlign: 'center',
                  paddingVertical: 12,
                  fontVariant: ['tabular-nums'],
                }}
                editable={!submitting}
              />
              <View style={{ height: 16 }} />
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.size.caption1,
                  fontWeight: '600',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                DEVICE NAME (OPTIONAL)
              </Text>
              <TextInput
                value={deviceName}
                onChangeText={setDeviceName}
                placeholder="e.g. Mochi's iPad"
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={40}
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.body,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface2,
                }}
                editable={!submitting}
              />
              {submitError && (
                <Text
                  style={{
                    color: theme.colors.danger,
                    fontSize: theme.typography.size.footnote,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  {submitError}
                </Text>
              )}
              <View style={{ height: 16 }} />
              <Button
                title={submitting ? 'Pairing...' : 'Pair devices'}
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting || enterCode.length !== 6}
                style={{ alignSelf: 'stretch' }}
              />
            </Card>
          </View>
        </View>
      )}

      {tab === 'devices' && (
        <FlatList
          data={devices}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => (
            <PairedDeviceRow device={item} onUnpair={() => unpair(item.id)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={devicesStatus === 'loading'}
              onRefresh={loadDevices}
              tintColor={theme.colors.accent}
            />
          }
          contentContainerStyle={
            devices.length === 0 ? styles.emptyContainer : undefined
          }
          ListEmptyComponent={
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
                  No paired devices
                </Text>
                <View style={{ height: 4 }} />
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.subhead,
                    textAlign: 'center',
                  }}
                >
                  Use the Show code / Enter code tabs to pair a device.
                </Text>
              </Card>
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  tabContent: {
    flex: 1,
    paddingTop: 16,
  },
  empty: {
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});