import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function SkipConfirmModal({ visible, onClose, onConfirm, loading }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.cardWrap}>
          <Pressable onPress={() => {}} style={styles.card}>
            <Text style={styles.title}>Skip for now? You can personalize later.</Text>
            <Button label="Skip" onPress={onConfirm} loading={loading} />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cardWrap: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.primary,
    textAlign: 'center',
  },
});
