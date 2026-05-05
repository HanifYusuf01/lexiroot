import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LogoutModal } from '../../src/components/ui/LogoutModal';
import { SettingsRow } from '../../src/components/ui/SettingsRow';
import { UserAvatar } from '../../src/components/ui/UserAvatar';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { authStorage } from '../../src/services/secureStorage';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { clearCredentials } from '../../src/store/slices/authSlice';
import { resetOnboarding } from '../../src/store/slices/onboardingSlice';

const PRIVACY_URL = 'https://lexiroot.example/privacy';
const TERMS_URL = 'https://lexiroot.example/terms';

export default function ProfileTab() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [logoutOpen, setLogoutOpen] = useState(false);

  async function handleLogout() {
    setLogoutOpen(false);
    await authStorage.clear();
    dispatch(clearCredentials());
    dispatch(resetOnboarding());
    router.replace('/welcome');
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <View style={styles.userInfo}>
            <UserAvatar name={user?.displayName} avatarUrl={user?.avatarUrl} size={44} />
            <View style={styles.userText}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.displayName ?? 'Guest'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email ?? ''}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/edit')} hitSlop={12} style={styles.editBtn}>
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.group}>
            <SettingsRow
              title="Preferences"
              subtitle="Customize how you learn"
              onPress={() => router.push('/preferences')}
            />
            <SettingsRow
              title="Audio & Speech"
              subtitle="Manage audio playback and speaking features"
              onPress={() => router.push('/audio-speech')}
            />
            <SettingsRow
              title="Notification"
              subtitle="Set your reminders and alerts"
              onPress={() => router.push('/notification')}
              last
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.group}>
            <SettingsRow
              title="Support center"
              subtitle="Need help? Chat with our support team directly."
              onPress={() => router.push('/support')}
            />
            <SettingsRow
              title="Send Feedback"
              subtitle="Share your thoughts to help us improve."
              onPress={() => router.push('/feedback')}
              last
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
        </View>

        <Pressable
          onPress={() => setLogoutOpen(true)}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>Log Out</Text>
          <Ionicons name="log-out-outline" size={18} color={colors.primary} />
        </Pressable>

        <View style={styles.footerLinks}>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <Text style={styles.footerLink}>Privacy policy</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text style={styles.footerLink}>Terms of service</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LogoutModal
        visible={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primarySofter,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  userEmail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  group: {
    gap: 0,
  },
  logout: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySofter,
  },
  pressed: {
    opacity: 0.85,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primary,
  },
  footerLinks: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
});
