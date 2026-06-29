export interface ExperienceSlide {
  /** Heading + blurb shown under the carousel. */
  title: string;
  description: string;
  /** App screen image rendered inside the phone mockup (in /public). */
  screen: string;
}

export const EXPERIENCE_SLIDES: ExperienceSlide[] = [
  {
    title: 'Stay Motivated Everyday',
    description:
      'Build streaks, earn rewards, and make steady progress toward fluency with every lesson.',
    screen: '/experience/streak.png',
  },
  {
    title: 'Practice What You Learn',
    description: 'Reinforce lessons through quick exercises, quizzes, and listening challenges.',
    screen: '/experience/practice.png',
  },
  {
    title: 'Discover African Culture',
    description:
      'Immerse yourself in the richness of African culture through stories and proverbs passed down through generations.',
    screen: '/experience/culture.png',
  },
  {
    title: 'Compete and Connect',
    description: 'Climb leaderboards and compete with friends and family as you learn.',
    screen: '/experience/leaderboard.png',
  },
  {
    title: 'Keep Learning On The Go',
    description:
      'Access downloaded lessons and continue learning even when your connection is unstable.',
    screen: '/experience/downloads.png',
  },
];
