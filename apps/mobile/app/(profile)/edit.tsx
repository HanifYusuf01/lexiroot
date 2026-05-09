import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { TextField } from '../../src/components/ui/TextField';
import { UserAvatar } from '../../src/components/ui/UserAvatar';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { useSignAvatarUploadMutation, useUpdateMeMutation } from '../../src/services/authApi';
import { authStorage } from '../../src/services/secureStorage';
import { uploadAvatarToCloudinary } from '../../src/utils/cloudinary';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setUser } from '../../src/store/slices/authSlice';
import { formatNumber } from '../../src/utils/format';

interface FieldErrors {
  name?: string;
  email?: string;
  general?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ACHIEVEMENT_SLOTS = 5;

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [signAvatarUpload] = useSignAvatarUploadMutation();

  const [name, setName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.displayName);
    setEmail(user.email);
  }, [user]);

  const dirty = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    return (
      trimmedName !== (user?.displayName ?? '') ||
      trimmedEmail !== (user?.email ?? '').toLowerCase()
    );
  }, [name, email, user]);

  function persistUser(next: typeof user) {
    if (!next || !token) return;
    const stored = {
      ...next,
      emailVerifiedAt: next.emailVerifiedAt ?? null,
      country: next.country ?? null,
      avatarUrl: next.avatarUrl ?? null,
    };
    authStorage.set({ token, user: stored });
    dispatch(setUser(stored));
  }

  async function handleSave() {
    const next: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedName.length < 2) next.name = 'Please enter your full name';
    else if (/\d/.test(trimmedName)) next.name = 'Full name cannot contain numbers';
    if (!EMAIL_PATTERN.test(trimmedEmail)) next.email = 'Please enter a valid email address';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});

    try {
      const result = await updateMe({
        displayName: trimmedName,
        email: trimmedEmail,
      }).unwrap();
      persistUser(result);
      router.back();
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string | string[] } };
      if (e.status === 409) {
        setErrors({ email: 'Email already in use' });
        return;
      }
      const msg = e.data?.message;
      if (Array.isArray(msg)) {
        const fieldErrors: FieldErrors = {};
        msg.forEach((m) => {
          const lower = m.toLowerCase();
          if (lower.includes('email')) fieldErrors.email = m;
          else if (lower.includes('displayname') || lower.includes('full name')) fieldErrors.name = m;
        });
        setErrors(fieldErrors);
      } else {
        Alert.alert('Could not save', 'Please try again.');
      }
    }
  }

  async function handleChangePicture() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo library access in Settings to change your picture.',
      );
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];

    setUploadingAvatar(true);
    try {
      const signature = await signAvatarUpload().unwrap();
      const url = await uploadAvatarToCloudinary({
        uri: asset.uri,
        mimeType: asset.mimeType,
        signature,
      });
      const result = await updateMe({ avatarUrl: url }).unwrap();
      persistUser(result);
    } catch {
      Alert.alert('Could not update picture', 'Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  const lessons = user?.lessonsCompleted ?? 0;
  const streak = user?.currentStreakDays ?? 0;
  const xp = user?.xp ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Profile"
        right={
          <Pressable onPress={handleSave} hitSlop={8} disabled={!dirty || saving}>
            <Text
              style={[styles.saveLabel, (!dirty || saving) && styles.saveLabelDisabled]}
            >
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarBlock}>
            <View>
              <UserAvatar name={user?.displayName} avatarUrl={user?.avatarUrl} size={110} />
              {uploadingAvatar ? (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color={colors.white} />
                </View>
              ) : null}
            </View>
            <Pressable onPress={handleChangePicture} hitSlop={8} disabled={uploadingAvatar}>
              <Text style={[styles.changePicture, uploadingAvatar && styles.changePictureDisabled]}>
                {uploadingAvatar ? 'Uploading…' : 'Change Picture'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <StatCard value={formatNumber(lessons)} label="Lessons" />
            <StatCard value={formatNumber(streak)} label="Streak" trailing="🔥" />
            <StatCard value={formatNumber(xp)} label="Total XP" />
          </View>

          <View style={styles.achievementsCard}>
            <Text style={styles.achievementsTitle}>Achievements</Text>
            <View style={styles.achievementsRow}>
              {Array.from({ length: ACHIEVEMENT_SLOTS }).map((_, i) => (
                <View key={i} style={styles.achievementBadge}>
                  <Ionicons name="ribbon" size={20} color={colors.primary} />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.fields}>
            <TextField
              label="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              softBg
              error={errors.name}
            />

            <View>
              <TextField
                label="Password"
                value="********"
                onChangeText={() => {}}
                isPassword
                editable={false}
                softBg
              />
              <Pressable
                onPress={() => router.push('/change-password')}
                hitSlop={8}
                style={styles.changePasswordPress}
              >
                <Text style={styles.changePasswordText}>Change Password</Text>
              </Pressable>
            </View>

            <TextField
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              softBg
              error={errors.email}
            />
          </View>

          <View style={styles.promoCard}>
            <View style={styles.promoCorner} />
            <View style={styles.promoIcon}>
              <Ionicons name="bookmark" size={24} color={colors.white} />
            </View>
            <View style={styles.promoText}>
              <Text style={styles.promoTitle}>Unlock full Yoruba{'\n'}Journey</Text>
              <Text style={styles.promoSubtitle}>All lessons, stories & audio</Text>
            </View>
            <Pressable
              onPress={() => router.push('/preferences')}
              style={({ pressed }) => [styles.promoBtn, pressed && styles.promoBtnPressed]}
            >
              <Text style={styles.promoBtnLabel}>Upgrade</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  trailing?: string;
}

function StatCard({ value, label, trailing }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {trailing ? <Text style={styles.statTrailing}>{trailing}</Text> : null}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 9999,
  },
  changePicture: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  changePictureDisabled: {
    color: colors.neutralVariant,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.neutral,
  },
  statTrailing: {
    fontSize: 14,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.neutralVariant,
    marginTop: 2,
  },
  achievementsCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  achievementsTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.neutral,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  achievementBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySofter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: {
    gap: spacing.md,
  },
  changePasswordPress: {
    alignSelf: 'flex-end',
    paddingTop: spacing.xs,
  },
  changePasswordText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  promoCorner: {
    position: 'absolute',
    top: -28,
    right: -28,
    width: 90,
    height: 90,
    borderRadius: radius.full,
    backgroundColor: colors.chatBubbleUser,
    opacity: 0.85,
  },
  promoIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoText: {
    flex: 1,
  },
  promoTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.white,
  },
  promoSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    marginTop: spacing.xs,
  },
  promoBtn: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.primarySofter,
  },
  promoBtnPressed: {
    opacity: 0.85,
  },
  promoBtnLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primary,
  },
  saveLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primary,
  },
  saveLabelDisabled: {
    color: colors.neutralVariant,
  },
});
