import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Accordion } from '../../src/components/ui/Accordion';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { colors, fonts, spacing } from '../../src/constants/theme';

interface Faq {
  question: string;
  answer: string;
}

const FAQS: Faq[] = [
  {
    question: 'What is LexiRoot?',
    answer:
      'LexiRoot is a gamified, audio-first platform for learning African languages and cultures, built for diaspora communities and home learners.',
  },
  {
    question: 'Do I need to know yoruba before starting?',
    answer:
      'Not at all. Lessons start from absolute beginner — no prior knowledge of Yoruba is required.',
  },
  {
    question: 'What are "Root Nuggets"?',
    answer:
      'Root Nuggets are short cultural snippets — proverbs, customs, and stories — that you unlock alongside your lessons.',
  },
  {
    question: 'What is XP?',
    answer:
      'XP (experience points) measure your progress. You earn XP by completing exercises, finishing lessons, and keeping your streak alive.',
  },
  {
    question: 'Is LexiRoot free?',
    answer:
      'There is a free tier with daily lessons. Premium plans unlock unlimited lessons, advanced cultural content, and offline downloads.',
  },
  {
    question: 'How long does it take to complete a lesson?',
    answer: 'Most lessons take five to ten minutes — perfect for short daily practice.',
  },
  {
    question: "What if my microphone isn't working?",
    answer:
      'Check that you have granted microphone access in your device settings. You can also test the microphone in Audio & Speech settings.',
  },
];

export default function SupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Frequently Asked Questions" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          We&apos;ve answered the most common things to help you keep learning.
        </Text>

        <View style={styles.list}>
          {FAQS.map((faq) => (
            <Accordion key={faq.question} title={faq.question}>
              <Text style={styles.answer}>{faq.answer}</Text>
            </Accordion>
          ))}
        </View>

        <Text style={styles.footer}>
          Didn&apos;t find what you were looking for? Chat with our{' '}
          <Text style={styles.footerLink} onPress={() => router.push('/chat')}>
            support team
          </Text>{' '}
          instead!
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  intro: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  list: {
    gap: spacing.sm,
  },
  answer: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.neutral,
    lineHeight: 19,
  },
  footer: {
    marginTop: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
    lineHeight: 19,
  },
  footerLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
});
