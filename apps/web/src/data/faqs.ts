export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: 'What is LexiRoot?',
    answer:
      'LexiRoot is a gamified, audio-first app for learning African languages and cultures — starting with Nigerian languages. It is built for diaspora communities and home learners of every generation.',
  },
  {
    question: 'Do I need to know yoruba before starting?',
    answer:
      'Not at all. LexiRoot starts from the very beginning and guides you through pronunciation, tones, and everyday phrases at your own pace — no prior knowledge required.',
  },
  {
    question: 'What are “Root Nuggets”?',
    answer:
      'Root Nuggets are bite-sized cultural lessons woven between language exercises — proverbs, traditions, and stories that connect the words you learn to the culture behind them.',
  },
  {
    question: 'What is XP?',
    answer:
      'XP (experience points) is earned by completing questions inside a level. It tracks your progress, fuels streaks and leaderboards, and keeps your learning motivating day to day.',
  },
  {
    question: 'How long does it take to complete a lesson?',
    answer:
      'Most lessons take about five minutes, so you can practice in short bursts. Build a daily streak and the small sessions add up to real fluency over time.',
  },
];
