import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CorrectMeaningExercise } from '../../../../src/screens/practice/CorrectMeaningExercise';
import { ListenSelectExercise } from '../../../../src/screens/practice/ListenSelectExercise';
import { NameFromImageExercise } from '../../../../src/screens/practice/NameFromImageExercise';
import { RecognitionExercise } from '../../../../src/screens/practice/RecognitionExercise';
import { WordArrangeExercise } from '../../../../src/screens/practice/WordArrangeExercise';
import {
  colors,
  fonts,
  skillThemes,
  spacing,
  type SkillKey,
} from '../../../../src/constants/theme';

type ExerciseType =
  | 'listen-select'
  | 'word-arrange'
  | 'correct-meaning'
  | 'recognition'
  | 'name-from-image';

const DEMO_PROGRESS = 0.4;
const DEMO_XP = 6;

export default function ExerciseScreen() {
  const { skill, type } = useLocalSearchParams<{ skill: SkillKey; type: ExerciseType }>();
  const theme = skill ? skillThemes[skill] : undefined;

  if (!theme) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Text style={styles.fallbackText}>Unknown skill</Text>
      </SafeAreaView>
    );
  }

  let content: React.ReactNode = null;

  const demoSkillTitle = theme.title;
  const demoLevel = 1;

  if (type === 'word-arrange') {
    content = (
      <WordArrangeExercise
        theme={theme}
        skillTitle={demoSkillTitle}
        level={demoLevel}
        prompt="My name is Akande"
        pool={['Oruko', 'mi', 'won', 'ni', 're', 'Akande']}
        correctOrder={['Oruko', 'mi', 'ni', 'Akande']}
        progress={DEMO_PROGRESS}
        xpReward={DEMO_XP}
      />
    );
  } else if (type === 'correct-meaning') {
    content = (
      <CorrectMeaningExercise
        theme={theme}
        skillTitle={demoSkillTitle}
        level={demoLevel}
        word="Ba wo ni?"
        promptTitle="What does this sentence mean?"
        options={[
          { id: 'a', label: 'How old are you?' },
          { id: 'b', label: 'Did you sleep well?' },
          { id: 'c', label: 'When are you coming?' },
          { id: 'd', label: 'How are you?' },
        ]}
        correctId="d"
        progress={DEMO_PROGRESS}
        xpReward={DEMO_XP}
      />
    );
  } else if (type === 'recognition') {
    content = (
      <RecognitionExercise
        theme={theme}
        skillTitle={demoSkillTitle}
        level={demoLevel}
        word="Abébe"
        options={[
          { id: 'a', imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
          { id: 'b', imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
          { id: 'c', imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
          { id: 'd', imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
        ]}
        correctId="b"
        progress={DEMO_PROGRESS}
        xpReward={DEMO_XP}
      />
    );
  } else if (type === 'name-from-image') {
    content = (
      <NameFromImageExercise
        theme={theme}
        skillTitle={demoSkillTitle}
        level={demoLevel}
        imageUrl="https://res.cloudinary.com/demo/image/upload/sample.jpg"
        options={[
          { id: 'a', label: 'Abebe' },
          { id: 'b', label: 'Igbale' },
          { id: 'c', label: 'Igbako' },
          { id: 'd', label: 'Bibeli' },
        ]}
        correctId="a"
        progress={DEMO_PROGRESS}
        xpReward={DEMO_XP}
      />
    );
  } else {
    content = (
      <ListenSelectExercise
        theme={theme}
        skillTitle={demoSkillTitle}
        level={demoLevel}
        options={[
          { id: 'a', label: 'á' },
          { id: 'b', label: 'b' },
          { id: 'd', label: 'd' },
          { id: 'e', label: 'è' },
        ]}
        correctId="a"
        progress={DEMO_PROGRESS}
        xpReward={DEMO_XP}
      />
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fallback: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  fallbackText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.neutral,
  },
});
