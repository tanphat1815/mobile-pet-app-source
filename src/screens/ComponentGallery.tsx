/**
 * Component Gallery Screen
 *
 * Demo screen that exercises every shared component and transition.
 * Serves as visual regression + interactive verification.
 *
 * Includes toggles for:
 * - Dark mode (simulated by overriding the user theme)
 * - Reduced motion (calls useReducedMotion -> all durations -> 1ms)
 *
 * NOTE: This screen is removed in Step M-3 once the API client is wired in.
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useReducedMotion } from '../utils/useReducedMotion';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { Toggle } from '../shared/components/Toggle';
import { TextField } from '../shared/components/TextField';
import { Modal } from '../shared/components/Modal';
import { Panel } from '../shared/components/Panel';
import { Badge } from '../shared/components/Badge';
import { BlurHeader } from '../shared/components/BlurHeader';

export function ComponentGallery() {
  const theme = useTheme();
  const systemScheme = useColorScheme();
  const reducedMotion = useReducedMotion();

  // Local toggles that override the system theme for testing
  const [forceDark, setForceDark] = useState(false);
  const effectiveDark = forceDark ?? theme.isDark;

  // Notification toggle
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);

  // TextField error
  const [textValue, setTextValue] = useState('');
  const [textError, setTextError] = useState<string | undefined>(undefined);

  // Modal + Panel visibility
  const [modalVisible, setModalVisible] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <BlurHeader
        title="Component Gallery"
        subtitle={`${effectiveDark ? 'Dark' : 'Light'} | ${systemScheme ?? 'auto'} | RM: ${
          reducedMotion ? 'on' : 'off'
        }`}
        trailing={
          <Pressable onPress={() => setForceDark(!forceDark)}>
            <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>
              {effectiveDark ? 'Light' : 'Dark'}
            </Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Buttons */}
        <Section title="Buttons">
          <Button title="Primary Action" onPress={() => {}} />
          <Spacer />
          <Button title="Secondary Action" onPress={() => {}} variant="secondary" />
          <Spacer />
          <Button title="Danger Action" onPress={() => {}} variant="danger" />
          <Spacer />
          <Button title="Ghost Action" onPress={() => {}} variant="ghost" />
          <Spacer />
          <Button title="Loading..." onPress={() => {}} loading />
          <Spacer />
          <Button title="Disabled" onPress={() => {}} disabled />
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <Card>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.body }}>
              Default card
            </Text>
          </Card>
          <Spacer />
          <Card variant="elevated">
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.body }}>
              Elevated card
            </Text>
          </Card>
          <Spacer />
          <Card variant="flat" padding="sm">
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.body }}>
              Flat card (compact padding)
            </Text>
          </Card>
        </Section>

        {/* Toggles */}
        <Section title="Toggles">
          <Row label={`Notifications (${notifications ? 'on' : 'off'})`}>
            <Toggle value={notifications} onValueChange={setNotifications} />
          </Row>
          <Spacer />
          <Row label={`Biometric login (${biometric ? 'on' : 'off'})`}>
            <Toggle value={biometric} onValueChange={setBiometric} />
          </Row>
          <Spacer />
          <Row label="Disabled (on)">
            <Toggle value={true} onValueChange={() => {}} disabled />
          </Row>
        </Section>

        {/* TextField */}
        <Section title="TextField">
          <TextField
            label="Email"
            placeholder="you@example.com"
            value={textValue}
            onChangeText={(v) => {
              setTextValue(v);
              setTextError(undefined);
            }}
            error={textError}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Spacer />
          <Button
            title="Trigger error"
            onPress={() => setTextError('Invalid email format')}
            variant="danger"
            size="sm"
          />
        </Section>

        {/* Badge */}
        <Section title="Badges">
          <Row>
            <Badge count={3} />
            <Spacer inline />
            <Badge count={12} variant="primary" />
            <Spacer inline />
            <Badge count={99} variant="success" />
            <Spacer inline />
            <Badge count={150} variant="warning" />
          </Row>
          <Spacer />
          <Row>
            <Badge label="NEW" variant="primary" size="sm" />
            <Spacer inline />
            <Badge label="LIVE" variant="danger" size="sm" />
          </Row>
        </Section>

        {/* Modal */}
        <Section title="Modal">
          <Button title="Show modal" onPress={() => setModalVisible(true)} />
          <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.title3,
                fontWeight: '700',
                marginBottom: theme.spacing.sm,
              }}
            >
              Hello from Modal
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                marginBottom: theme.spacing.lg,
              }}
            >
              Tap outside or press back to dismiss.
            </Text>
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </Modal>
        </Section>

        {/* Panel */}
        <Section title="Panel (Bottom Sheet)">
          <Button title="Show panel" onPress={() => setPanelVisible(true)} />
          <Panel visible={panelVisible} onRequestClose={() => setPanelVisible(false)}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.title3,
                fontWeight: '700',
                marginBottom: theme.spacing.sm,
              }}
            >
              Bottom Panel
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                marginBottom: theme.spacing.lg,
              }}
            >
              Drag the handle or tap above to dismiss.
            </Text>
            <Button title="Close" onPress={() => setPanelVisible(false)} variant="secondary" />
          </Panel>
        </Section>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.size.footnote,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: theme.spacing.md,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Spacer({ inline }: { inline?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: inline ? undefined : theme.spacing.md,
        width: inline ? theme.spacing.md : undefined,
      }}
    />
  );
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { justifyContent: label ? 'space-between' : 'flex-start' }]}>
      {label ? (
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.body }}>
          {label}
        </Text>
      ) : null}
      <View style={styles.rowContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});