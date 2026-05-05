import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../../src/constants/theme';

export default function LessonsTab() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.body}>
        <Text style={styles.title}>Lessons</Text>
        <Text style={styles.subtitle}>Lesson library coming next slice.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.neutral,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    marginTop: spacing.xs,
  },
});
