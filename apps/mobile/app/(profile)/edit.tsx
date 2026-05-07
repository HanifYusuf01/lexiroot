import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { TextField } from '../../src/components/ui/TextField';
import { UserAvatar } from '../../src/components/ui/UserAvatar';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useSignAvatarUploadMutation, useUpdateMeMutation } from '../../src/services/authApi';
import { authStorage } from '../../src/services/secureStorage';
import { uploadAvatarToCloudinary } from '../../src/utils/cloudinary';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setUser } from '../../src/store/slices/authSlice';

interface FieldErrors {
  name?: string;
  email?: string;
  general?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [signAvatarUpload] = useSignAvatarUploadMutation();

  const [name, setName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Re-seed when the cached user changes (e.g. after a refetch).
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
      trimmedEmail !== (user?.email ?? '').toLowerCase() ||
      password.length > 0
    );
  }, [name, email, password, user]);

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

          <View style={styles.fields}>
            <TextField
              label="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              softBg
              error={errors.name}
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              placeholder="********"
              softBg
              helper="Use Change Password from settings to update."
            />
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
  fields: {
    gap: spacing.md,
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
