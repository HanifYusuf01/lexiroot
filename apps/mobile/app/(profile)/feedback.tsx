import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { StarRating } from '../../src/components/ui/StarRating';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { useCreateFeedbackMutation } from '../../src/services/feedbackApi';

export default function FeedbackScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [createFeedback, { isLoading: submitting }] = useCreateFeedbackMutation();

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Pick a rating', 'Tap a star to rate your experience.');
      return;
    }
    try {
      await createFeedback({
        rating,
        message: message.trim() ? message.trim() : undefined,
      }).unwrap();
      setRating(0);
      setMessage('');
      Alert.alert('Thank you!', 'Your feedback helps us improve.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Could not send', 'Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Feedback" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Rate your experience</Text>
          <Text style={styles.subtitle}>Help us improve your learning experience.</Text>

          <View style={styles.stars}>
            <StarRating value={rating} onChange={setRating} />
          </View>

          <View style={styles.textareaWrap}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us how we can Improve...."
              placeholderTextColor={colors.neutralVariant}
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Submit" onPress={handleSubmit} loading={submitting} />
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
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  stars: {
    marginBottom: spacing.xl,
  },
  textareaWrap: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySofter,
    minHeight: 180,
    padding: spacing.md,
  },
  textarea: {
    flex: 1,
    minHeight: 152,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutral,
    padding: 0,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
