import { StyleSheet, Text, View } from 'react-native';
import { MascotHeadIcon } from '../icons/MascotHeadIcon';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface QuestionBubbleProps {
  question: string;
}

export function QuestionBubble({ question }: QuestionBubbleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <MascotHeadIcon size={64} />
      </View>
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Text style={styles.question}>{question}</Text>
      </View>
    </View>
  );
}

const TAIL_SIZE = 14;
const BORDER_WIDTH = 1.5;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: BORDER_WIDTH,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  tail: {
    position: 'absolute',
    left: -(TAIL_SIZE / 2 + BORDER_WIDTH / 2),
    top: '50%',
    marginTop: -TAIL_SIZE / 2,
    width: TAIL_SIZE,
    height: TAIL_SIZE,
    backgroundColor: colors.white,
    borderLeftWidth: BORDER_WIDTH,
    borderBottomWidth: BORDER_WIDTH,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
  question: {
    color: colors.primary,
    fontFamily: fonts.extrabold,
    fontSize: 26,
    lineHeight: 32,
  },
});
