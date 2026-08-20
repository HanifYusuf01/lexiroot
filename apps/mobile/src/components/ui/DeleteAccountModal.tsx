import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { TextField } from './TextField';

interface DeleteAccountModalProps {
  visible: boolean;
  loading: boolean;
  /** The account's email — must be typed exactly (case-insensitive) to enable Delete. */
  confirmEmail: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAccountModal({
  visible,
  loading,
  confirmEmail,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [typed, setTyped] = useState('');

  // Clear the field every time the modal opens/closes, so a previous
  // confirmation can't linger and accidentally re-enable Delete next time.
  useEffect(() => {
    if (!visible) setTyped('');
  }, [visible]);

  const matches =
    typed.trim().length > 0 && typed.trim().toLowerCase() === confirmEmail.trim().toLowerCase();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning-outline" size={28} color={colors.errorStrong} />
          </View>
          <Text style={styles.title}>Delete your account?</Text>
          <Text style={styles.message}>
            This permanently deletes your LexiRoot account, learning progress, streaks, and
            achievements. This action cannot be undone and there is no way to recover your data
            afterwards.
          </Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Type <Text style={styles.fieldLabelEmail}>{confirmEmail}</Text> to confirm
            </Text>
            <TextField
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Enter your email"
              editable={!loading}
            />
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={loading}
              style={({ pressed }) => [styles.btn, styles.cancel, pressed && styles.pressed]}
            >
              <Text style={[styles.btnLabel, styles.cancelLabel]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading || !matches}
              style={({ pressed }) => [
                styles.btn,
                styles.confirm,
                (!matches || loading) && styles.confirmDisabled,
                pressed && matches && styles.pressed,
              ]}
            >
              <Text style={[styles.btnLabel, styles.confirmLabel]}>
                {loading ? 'Deleting…' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.errorSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  field: {
    width: '100%',
    marginTop: spacing.xs,
  },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.neutral,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  fieldLabelEmail: {
    fontFamily: fonts.bold,
    color: colors.errorStrong,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  confirm: {
    backgroundColor: colors.errorStrong,
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  btnLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  cancelLabel: {
    color: colors.neutral,
  },
  confirmLabel: {
    color: colors.white,
  },
});
