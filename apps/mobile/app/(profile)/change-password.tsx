import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { TextField } from '../../src/components/ui/TextField';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useChangePasswordMutation } from '../../src/services/authApi';

const PASSWORD_HELPER =
  'Password must be at least 8 characters long and include 1 capital letter and one symbol.';

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

function validatePassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/`~;']/.test(password)
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const newPasswordInvalid = newPassword.length > 0 && !validatePassword(newPassword);

  async function handleSubmit() {
    const next: FormErrors = {};
    if (currentPassword.length < 1) next.currentPassword = 'Enter your current password';
    if (!validatePassword(newPassword)) next.newPassword = PASSWORD_HELPER;
    if (confirmPassword !== newPassword) next.confirmPassword = 'Passwords do not match';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      router.replace('/password-success');
    } catch (err) {
      const e = err as { status?: number };
      if (e.status === 401) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        setErrors({ general: 'Could not update password. Please try again.' });
      }
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Change Password" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.fieldLabel}>Enter old password</Text>
          <TextField
            placeholder="Old Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            isPassword
            softBg
            error={errors.currentPassword}
          />

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>New Password</Text>
          <TextField
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
            softBg
            error={errors.newPassword ?? (newPasswordInvalid ? PASSWORD_HELPER : undefined)}
          />

          <View style={styles.confirmSpacer}>
            <TextField
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              softBg
              error={errors.confirmPassword}
            />
          </View>

          {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Update Password" onPress={handleSubmit} loading={isLoading} />
        </View>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  fieldLabelSpaced: {
    marginTop: spacing.lg,
  },
  confirmSpacer: {
    marginTop: spacing.md,
  },
  generalError: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
