export const colors = {
  primary: '#E35336',
  primaryDark: '#B83E25',
  primarySoft: '#FCEBE6',
  primarySofter: '#FDF7F7',
  primaryBorder: '#F3B2A5',
  chatBubbleUser: '#EC8C79',
  secondary: '#814231',
  border: '#E5E5E5',
  tertiary: '#BF9828',
  neutral: '#3C3C3C',
  neutralVariant: '#7A7878',
  neutralSoft: '#EFEFEF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#1A1A1A',
  error: '#FF3333',
  warning: '#F9D506',
  success: '#16A34A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  semiboldItalic: 'Nunito_600SemiBold_Italic',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;

export type SkillKey = 'listen-select' | 'vocabulary' | 'sentence' | 'recognition';

export interface SkillTheme {
  key: SkillKey;
  title: string;
  level: number;
  main: string;
  border: string;
  soft: string;
  softer: string;
  on: string;
}

export const skillThemes: Record<SkillKey, SkillTheme> = {
  'listen-select': {
    key: 'listen-select',
    title: 'Listen & Select',
    level: 1,
    main: '#E35336',
    border: '#F3B2A5',
    soft: '#FCEBE6',
    softer: '#FDF7F7',
    on: '#FFFFFF',
  },
  vocabulary: {
    key: 'vocabulary',
    title: 'Vocabulary',
    level: 4,
    main: '#79D9EC',
    border: '#79D9EC',
    soft: '#E9F9FC',
    softer: '#F4FCFE',
    on: '#FFFFFF',
  },
  sentence: {
    key: 'sentence',
    title: 'Sentence',
    level: 6,
    main: '#C7AA05',
    border: '#E3CE5C',
    soft: '#FBF5D2',
    softer: '#FDFAE6',
    on: '#FFFFFF',
  },
  recognition: {
    key: 'recognition',
    title: 'Recognition',
    level: 8,
    main: '#18B452',
    border: '#A5F3C2',
    soft: '#E6F8EC',
    softer: '#F1FBF4',
    on: '#FFFFFF',
  },
} as const;
