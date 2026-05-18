import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface LetterCardProps {
  variant: 'letter';
  glyph: string;
}

interface NumberCardProps {
  variant: 'number';
  word: string;
  numeral: string;
}

interface VocabularyCardProps {
  variant: 'vocabulary';
  word: string;
  meaning: string;
  example?: string;
}

interface SentenceCardProps {
  variant: 'sentence';
  sentence: string;
  meaning: string;
}

interface RecognitionCardProps {
  variant: 'recognition';
  word: string;
  imageUrl?: string;
}

type LessonContentCardProps =
  | LetterCardProps
  | NumberCardProps
  | VocabularyCardProps
  | SentenceCardProps
  | RecognitionCardProps;

export function LessonContentCard(props: LessonContentCardProps) {
  if (props.variant === 'letter') {
    return (
      <View style={[styles.card, styles.cardCompact]}>
        <Text style={styles.letter}>{props.glyph}</Text>
      </View>
    );
  }
  if (props.variant === 'number') {
    return (
      <View style={styles.card}>
        <Text style={styles.numberWord}>{props.word}</Text>
        <Text style={styles.numberDigits}>{props.numeral}</Text>
      </View>
    );
  }
  if (props.variant === 'vocabulary') {
    return (
      <View style={styles.cardWide}>
        <Text style={styles.vocabWord}>{props.word}</Text>
        <Text style={styles.vocabMeaning}>
          <Text style={styles.vocabMeaningLabel}>Meaning: </Text>
          {props.meaning}
        </Text>
        {props.example ? (
          <Text style={styles.vocabExample}>
            <Text style={styles.vocabExampleLabel}>Example: </Text>
            {props.example}
          </Text>
        ) : null}
      </View>
    );
  }
  if (props.variant === 'sentence') {
    return (
      <View style={styles.cardWide}>
        <Text style={styles.sentenceText}>{props.sentence}</Text>
        <Text style={styles.vocabMeaning}>
          <Text style={styles.vocabMeaningLabel}>Meaning: </Text>
          {props.meaning}
        </Text>
      </View>
    );
  }
  // recognition
  return (
    <View style={styles.cardWide}>
      {props.imageUrl ? (
        <Image source={{ uri: props.imageUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <Text style={styles.recognitionWord}>{props.word}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    minWidth: 220,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySofter,
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardCompact: {
    minWidth: 160,
    paddingVertical: spacing.lg,
  },
  cardWide: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySofter,
    alignItems: 'center',
    gap: spacing.xs,
  },
  letter: {
    fontFamily: fonts.extrabold,
    fontSize: 56,
    color: colors.primary,
  },
  numberWord: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.primary,
  },
  numberDigits: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.neutralVariant,
  },
  vocabWord: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.primary,
    textAlign: 'center',
  },
  vocabMeaning: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutral,
    textAlign: 'center',
  },
  vocabMeaningLabel: {
    fontFamily: fonts.bold,
    color: colors.neutral,
  },
  vocabExample: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  vocabExampleLabel: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  sentenceText: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.primary,
    textAlign: 'center',
  },
  image: {
    width: 200,
    height: 160,
    borderRadius: radius.md,
  },
  imagePlaceholder: {
    backgroundColor: colors.neutralSoft,
  },
  recognitionWord: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.primary,
  },
});
