import type { Ionicons } from '@expo/vector-icons';

/**
 * Email surfaced when a learner's question isn't covered by the in-app
 * assistant. The support chat is fully client-side (predefined Q&A) and is NOT
 * wired to the admin — "contact a human" simply opens the user's mail client.
 *
 * TODO(lexiroot): replace with the real, monitored support inbox before launch.
 */
export const SUPPORT_EMAIL = 'support@lexiroot.app';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface FaqTopic {
  id: string;
  label: string;
  icon: IoniconName;
  questions: FaqEntry[];
}

/**
 * Predefined help content for the support assistant, grouped by topic. The chat
 * screen lets a learner drill topic → question → answer; `support.tsx` flattens
 * the same data into an FAQ accordion. Keep answers short, plain, and accurate
 * to shipped behaviour — they are the single source of truth for both screens.
 */
export const SUPPORT_TOPICS: FaqTopic[] = [
  {
    id: 'getting-started',
    label: 'Getting started',
    icon: 'rocket-outline',
    questions: [
      {
        id: 'what-is-lexiroot',
        question: 'What is LexiRoot?',
        answer:
          'LexiRoot is a gamified, audio-first app for learning African languages and the cultures behind them. We start with Yoruba and build for diaspora communities and home learners alike.',
      },
      {
        id: 'need-prior-knowledge',
        question: 'Do I need to know Yoruba before I start?',
        answer:
          'Not at all. Lessons begin from absolute beginner, so no prior knowledge is needed. During setup we ask about your current level so we can start you in the right place.',
      },
      {
        id: 'which-languages',
        question: 'Which languages can I learn?',
        answer:
          'We are starting with Yoruba and will be adding more Nigerian and African languages over time. New languages will appear in your language picker as they launch.',
      },
      {
        id: 'change-language',
        question: 'How do I change my learning language?',
        answer:
          'Open Profile, go to Preferences, and switch your learning language there. Your progress is saved per language, so you can come back to where you left off.',
      },
    ],
  },
  {
    id: 'lessons-levels',
    label: 'Lessons & levels',
    icon: 'book-outline',
    questions: [
      {
        id: 'how-lessons-work',
        question: 'How are lessons organised?',
        answer:
          'Content is grouped into levels. Each level is made up of several short sub-lessons that build on each other, and you work through them in order to complete the level.',
      },
      {
        id: 'lesson-types',
        question: 'What are the different lesson types?',
        answer:
          'A level can include several types: Vocabulary (new words), Letters & Numbers, Sentence building, Recognition, and Exercises that test what you have learned. Together they cover listening, reading, and speaking.',
      },
      {
        id: 'lesson-length',
        question: 'How long does a lesson take?',
        answer:
          'Most lessons take about five to ten minutes — designed to fit into short, daily practice sessions.',
      },
      {
        id: 'level-locked',
        question: 'Why is the next level locked?',
        answer:
          'Levels unlock as you earn enough XP from the levels before them. Finish the questions in your current level to build up XP and open the next one.',
      },
      {
        id: 'redo-lesson',
        question: 'Can I redo a lesson I already finished?',
        answer:
          'Yes. You can revisit any completed level to practise again. Replaying focuses on the practice and questions rather than re-showing the teaching content.',
      },
    ],
  },
  {
    id: 'xp-streaks',
    label: 'XP, streaks & rewards',
    icon: 'flame-outline',
    questions: [
      {
        id: 'what-is-xp',
        question: 'What is XP and how do I earn it?',
        answer:
          'XP (experience points) measure your progress. You earn XP only by completing questions inside a level. The more you practise, the more XP you collect and the more you unlock.',
      },
      {
        id: 'xp-from-achievements',
        question: 'Do achievements or streaks give me XP?',
        answer:
          'No. XP comes only from completing level questions. Achievements and streaks celebrate your consistency, but they do not add XP on their own.',
      },
      {
        id: 'what-is-streak',
        question: 'What is a streak and how do I keep it?',
        answer:
          'Your streak counts the days in a row you practise. Complete at least one activity each day to keep it growing. Miss a day and the streak resets.',
      },
      {
        id: 'lost-streak',
        question: 'I lost my streak — can I get it back?',
        answer:
          'Streaks reset automatically when a day is missed and generally cannot be restored. Just start a new one — the best streak is the one you build next.',
      },
      {
        id: 'leaderboard',
        question: 'What is the leaderboard?',
        answer:
          'The leaderboard ranks learners by XP so you can see how you compare and stay motivated. Keep completing lessons to climb it.',
      },
    ],
  },
  {
    id: 'speech-audio',
    label: 'Speech & audio',
    icon: 'mic-outline',
    questions: [
      {
        id: 'mic-not-working',
        question: "My microphone isn't working",
        answer:
          'First, make sure you have allowed microphone access for LexiRoot in your device settings. You can also test your mic from Profile → Audio & Speech. If it still fails, try restarting the app.',
      },
      {
        id: 'why-speak',
        question: 'Why does LexiRoot ask me to speak?',
        answer:
          'LexiRoot is audio-first, so some exercises ask you to say words aloud. Speaking helps you practise pronunciation and tones, which are an important part of Yoruba.',
      },
      {
        id: 'turn-off-speech',
        question: 'Can I turn off speaking exercises?',
        answer:
          'You can adjust speech and audio behaviour in Profile → Audio & Speech. This lets you control how often the app uses your microphone.',
      },
      {
        id: 'audio-not-playing',
        question: "The audio won't play",
        answer:
          'Check that your device is not on silent, your volume is up, and you have a connection (or have downloaded the lesson for offline use). Reopening the lesson usually clears temporary audio glitches.',
      },
    ],
  },
  {
    id: 'offline-downloads',
    label: 'Offline & downloads',
    icon: 'cloud-download-outline',
    questions: [
      {
        id: 'learn-offline',
        question: 'Can I learn offline?',
        answer:
          'Yes. Download a level while you are online and you can practise it later without a connection. Offline downloads are a Premium feature.',
      },
      {
        id: 'how-to-download',
        question: 'How do I download a level?',
        answer:
          'On the levels screen, tap the download (cloud) icon on a level. This saves the whole level — every lesson type in it plus its audio — for offline use. The icon turns green when it is ready.',
      },
      {
        id: 'offline-progress',
        question: 'Will my offline progress be saved?',
        answer:
          'Yes. Anything you complete offline is stored on your device and syncs automatically the next time you are back online, so you never lose progress or XP.',
      },
      {
        id: 'download-failed',
        question: 'A download is stuck or failed',
        answer:
          'Make sure you are online with enough storage, then tap the download icon again — finished files are skipped, so it safely resumes. If it keeps failing, restart the app and retry.',
      },
    ],
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions & billing',
    icon: 'card-outline',
    questions: [
      {
        id: 'is-free',
        question: 'Is LexiRoot free?',
        answer:
          'There is a free tier with daily lessons so you can start learning right away. Premium unlocks unlimited lessons, advanced cultural content, and offline downloads.',
      },
      {
        id: 'premium-includes',
        question: 'What does Premium include?',
        answer:
          'Premium removes daily limits and adds unlimited lessons, deeper cultural content, and the ability to download levels for offline learning.',
      },
      {
        id: 'how-to-upgrade',
        question: 'How do I upgrade to Premium?',
        answer:
          'Tap any upgrade prompt in the app, or open the upgrade screen, to see the available plans and subscribe securely through your app store.',
      },
      {
        id: 'manage-subscription',
        question: 'How do I cancel or manage my subscription?',
        answer:
          'Subscriptions are billed through the App Store or Google Play, so you manage or cancel them in your store account settings under Subscriptions. Your Premium access stays active until the current period ends.',
      },
      {
        id: 'charged-no-premium',
        question: "I was charged but didn't get Premium",
        answer:
          'Try reopening the app to let your purchase sync, and use “Restore purchases” on the upgrade screen if available. If Premium still does not appear, contact us and we will sort it out.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account & settings',
    icon: 'person-outline',
    questions: [
      {
        id: 'change-email-password',
        question: 'How do I change my email or password?',
        answer:
          'Open Profile → Edit to update your email, or use Change Password to set a new one. You may be asked to confirm your identity for security.',
      },
      {
        id: 'profile-photo',
        question: 'How do I update my profile photo?',
        answer:
          'Go to Profile → Edit and tap your photo to pick a new one. The new photo uploads and saves right away.',
      },
      {
        id: 'notifications',
        question: 'How do I manage notifications?',
        answer:
          'Open Profile → Notifications to choose which reminders and updates you receive, including practice and streak reminders.',
      },
      {
        id: 'delete-account',
        question: 'How do I delete my account?',
        answer:
          'We can delete your account and data on request. Reach out to support and we will help you with the process.',
      },
    ],
  },
  {
    id: 'culture',
    label: 'Culture & Root Nuggets',
    icon: 'sparkles-outline',
    questions: [
      {
        id: 'root-nuggets',
        question: 'What are Root Nuggets?',
        answer:
          'Root Nuggets are short cultural snippets — proverbs, customs, and stories — that you unlock alongside your lessons to connect the language to its culture.',
      },
      {
        id: 'find-culture',
        question: 'Where do I find cultural content?',
        answer:
          'Open the Culture tab to browse cultural stories and Root Nuggets. Some deeper cultural content is part of Premium.',
      },
    ],
  },
];

/** Flattened list of every Q&A, useful for the FAQ accordion view. */
export const ALL_FAQS: FaqEntry[] = SUPPORT_TOPICS.flatMap((t) => t.questions);
