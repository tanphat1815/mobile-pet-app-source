/**
 * ProfileScreen — Step 7 Rich Profile
 *
 * Port từ desktop profile-view.html / profile-editor.html:
 *  - Banner (gradient fallback hoặc URL)
 *  - Avatar với frame border + glow
 *  - Title badge dưới tên
 *  - Bio text block
 *  - Friend code pill (copy-to-clipboard)
 *  - Social chips (tap → open external URL)
 *  - Edit modal: change bio/title/frame/banner/social handles
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
  Pressable,
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
import { AvatarFrame } from '../shared/components/AvatarFrame';
import { BannerBackground } from '../shared/components/BannerBackground';
import { FriendCodePill } from '../shared/components/FriendCodePill';
import { TitleBadge } from '../shared/components/TitleBadge';
import { SocialChips } from '../shared/components/SocialChips';
import { FramePicker } from '../shared/components/FramePicker';
import { getAvatarFrame } from '../api/avatarFrames';
import { SOCIAL_PLATFORMS, makeFriendCode } from '../api/profileTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);

  const stats = useSettingsStore((s) => s.stats);
  const statsStatus = useSettingsStore((s) => s.statsStatus);
  const loadStats = useSettingsStore((s) => s.loadStats);
  const saveProfile = useSettingsStore((s) => s.saveProfile);
  const profileSaving = useSettingsStore((s) => s.profileSaving);
  const profileError = useSettingsStore((s) => s.profileError);

  const [editOpen, setEditOpen] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [title, setTitle] = useState(user?.title ?? '');
  const [frameId, setFrameId] = useState(user?.frameId ?? 'none');
  const [bannerUrl, setBannerUrl] = useState<string | null>(user?.bannerUrl ?? null);
  const [socialDiscord, setSocialDiscord] = useState(user?.socials?.discord ?? '');
  const [socialTwitter, setSocialTwitter] = useState(user?.socials?.twitter ?? '');
  const [socialInstagram, setSocialInstagram] = useState(user?.socials?.instagram ?? '');
  const [socialTiktok, setSocialTiktok] = useState(user?.socials?.tiktok ?? '');
  const [socialTwitch, setSocialTwitch] = useState(user?.socials?.twitch ?? '');

  useEffect(() => {
    if (statsStatus === 'idle') loadStats();
  }, [statsStatus, loadStats]);

  useEffect(() => {
    setBio(user?.bio ?? '');
    setTitle(user?.title ?? '');
    setFrameId(user?.frameId ?? 'none');
    setBannerUrl(user?.bannerUrl ?? null);
    setSocialDiscord(user?.socials?.discord ?? '');
    setSocialTwitter(user?.socials?.twitter ?? '');
    setSocialInstagram(user?.socials?.instagram ?? '');
    setSocialTiktok(user?.socials?.tiktok ?? '');
    setSocialTwitch(user?.socials?.twitch ?? '');
  }, [
    user?.bio,
    user?.title,
    user?.frameId,
    user?.bannerUrl,
    user?.socials?.discord,
    user?.socials?.twitter,
    user?.socials?.instagram,
    user?.socials?.tiktok,
    user?.socials?.twitch,
  ]);

  const friendCode = useMemo(
    () => user?.friendCode ?? makeFriendCode(),
    [user?.friendCode]
  );

  const handleSave = useCallback(async () => {
    try {
      await saveProfile({
        bio,
        title,
        frameId,
        bannerUrl,
        socials: {
          discord: socialDiscord || undefined,
          twitter: socialTwitter || undefined,
          instagram: socialInstagram || undefined,
          tiktok: socialTiktok || undefined,
          twitch: socialTwitch || undefined,
        },
      });
      hapticSuccess();
      setEditOpen(false);
    } catch {
      hapticError();
    }
  }, [
    saveProfile,
    bio,
    title,
    frameId,
    bannerUrl,
    socialDiscord,
    socialTwitter,
    socialInstagram,
    socialTiktok,
    socialTwitch,
  ]);

  const handleOpenEdit = useCallback(() => {
    hapticLight();
    setEditOpen(true);
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Add me on Pet App! My friend code is ${friendCode}`,
        title: 'Pet App friend code',
      });
    } catch {
      /* user cancelled */
    }
  }, [friendCode]);

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

  const frame = getAvatarFrame(user.frameId);

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
        {/* Banner */}
        <BannerBackground
          bannerUrl={user.bannerUrl ?? null}
          seed={user.id}
          height={180}
        />

        {/* Action row over banner */}
        <View
          style={[
            styles.actionRow,
            {
              top: 60,
              right: 16,
            },
          ]}
        >
          <Pressable
            testID="share-profile-btn"
            onPress={handleShare}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: pressed
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.85)',
              },
            ]}
          >
            <Text style={styles.actionIcon}>📤</Text>
          </Pressable>
        </View>

        {/* Avatar block */}
        <View style={styles.profileBlock}>
          <View style={{ marginTop: -50 }}>
            <AvatarFrame
              frame={frame}
              size={110}
              source={user.avatarUrl ? { uri: user.avatarUrl } : undefined}
              testID="profile-avatar-frame"
            />
          </View>
          <Text
            testID="profile-display-name"
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.title2,
              fontWeight: '700',
              marginTop: 12,
            }}
          >
            {user.displayName || 'Pet parent'}
          </Text>
          {!!user.title && (
            <View style={{ marginTop: 6 }}>
              <TitleBadge title={user.title} />
            </View>
          )}
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.subhead,
              marginTop: 6,
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

          <View style={{ height: 12 }} />
          <Button
            title="Edit profile"
            onPress={handleOpenEdit}
            variant="primary"
          />
        </View>

        {/* Bio */}
        {!!user.bio && (
          <View style={styles.section}>
            <Card>
              <Text
                testID="profile-bio"
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.body,
                  lineHeight: 22,
                }}
              >
                {user.bio}
              </Text>
            </Card>
          </View>
        )}

        {/* Friend code */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Friend code
          </Text>
          <FriendCodePill code={friendCode} />
        </View>

        {/* Socials */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Connect
          </Text>
          <SocialChips socials={user.socials} />
        </View>

        {/* Stats */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.textSecondary },
            ]}
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
        <View style={styles.section}>
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
        <ScrollView
          style={{ padding: 16 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Legendary Pet Parent"
            maxLength={40}
          />
          <View style={{ height: 12 }} />
          <TextField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell friends about yourself…"
            multiline
            numberOfLines={4}
            maxLength={280}
          />
          <View style={{ height: 12 }} />
          <TextField
            label="Banner image URL (optional)"
            value={bannerUrl ?? ''}
            onChangeText={(v) => setBannerUrl(v || null)}
            placeholder="https://…"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View style={{ height: 16 }} />
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.caption1,
              fontWeight: '600',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Avatar frame
          </Text>
          <FramePicker selected={frameId} onSelect={setFrameId} />

          <View style={{ height: 16 }} />
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.caption1,
              fontWeight: '600',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Social handles
          </Text>
          <TextField
            label="Discord"
            value={socialDiscord}
            onChangeText={setSocialDiscord}
            placeholder="username"
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <TextField
            label="Twitter / X"
            value={socialTwitter}
            onChangeText={setSocialTwitter}
            placeholder="@handle"
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <TextField
            label="Instagram"
            value={socialInstagram}
            onChangeText={setSocialInstagram}
            placeholder="@handle"
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <TextField
            label="TikTok"
            value={socialTiktok}
            onChangeText={setSocialTiktok}
            placeholder="@handle"
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <TextField
            label="Twitch"
            value={socialTwitch}
            onChangeText={setSocialTwitch}
            placeholder="@handle"
            autoCapitalize="none"
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
          <View testID="save-profile-btn">
            <Button
              title="Save"
              onPress={handleSave}
              loading={profileSaving}
              disabled={profileSaving}
              style={{ alignSelf: 'stretch' }}
            />
          </View>
          <View style={{ height: 8 }} />
          <Button
            title="Cancel"
            onPress={() => setEditOpen(false)}
            variant="ghost"
            style={{ alignSelf: 'stretch' }}
          />
        </ScrollView>
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
  profileBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  actionRow: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
