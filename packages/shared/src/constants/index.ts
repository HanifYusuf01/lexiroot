export const LANGUAGE_CODES = ['yo', 'ig', 'ha'] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  yo: 'Yoruba',
  ig: 'Igbo',
  ha: 'Hausa',
};

export const LEARNING_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type LearningLevel = (typeof LEARNING_LEVELS)[number];

export const LEARNING_LEVEL_LABELS: Record<LearningLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const LEARNING_REASONS = [
  'family',
  'culture',
  'teach-child',
  'growth',
  'curious',
] as const;
export type LearningReason = (typeof LEARNING_REASONS)[number];

/** Active = last_active_at within this many days. */
export const ACTIVE_WINDOW_DAYS = 30;

export const SUBSCRIPTION_TIERS = ['free', 'plus', 'family'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const XP_VALUES = {
  exerciseCorrect: 10,
  lessonComplete: 50,
  streakDay: 5,
} as const;

export const LANGUAGE_LEVEL_PREFS = ['starting', 'a-little', 'basic', 'fluent'] as const;
export type LanguageLevelPref = (typeof LANGUAGE_LEVEL_PREFS)[number];

export const LESSON_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type LessonDifficulty = (typeof LESSON_DIFFICULTIES)[number];

export const VOICE_PLAYBACK_SPEEDS = ['slow', 'medium', 'fast'] as const;
export type VoicePlaybackSpeed = (typeof VOICE_PLAYBACK_SPEEDS)[number];

export const COUNTRY_REGIONS = [
  'west-africa',
  'east-africa',
  'southern-africa',
  'north-africa',
  'europe',
  'north-america',
  'south-america',
  'middle-east',
  'asia',
  'oceania',
] as const;
export type CountryRegion = (typeof COUNTRY_REGIONS)[number];

export const COUNTRY_REGION_LABELS: Record<CountryRegion, string> = {
  'west-africa': 'West Africa',
  'east-africa': 'East Africa',
  'southern-africa': 'Southern Africa',
  'north-africa': 'North Africa',
  europe: 'Europe',
  'north-america': 'North America',
  'south-america': 'South America',
  'middle-east': 'Middle East',
  asia: 'Asia',
  oceania: 'Oceania',
};

export const COUNTRY_CODES = [
  'NG', 'GH', 'SN', 'CI', 'CM', 'BJ', 'TG', 'LR', 'SL', 'BF', 'ML', 'NE',
  'KE', 'TZ', 'UG', 'RW', 'ET', 'SO',
  'ZA', 'ZW', 'ZM', 'BW', 'NA',
  'EG', 'MA', 'TN', 'DZ',
  'GB', 'IE', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'PT',
  'US', 'CA',
  'BR', 'MX',
  'AE', 'SA', 'QA',
  'IN', 'CN', 'JP',
  'AU', 'NZ',
] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export interface CountryInfo {
  name: string;
  flag: string;
  region: CountryRegion;
  dialCode: string;
}

export const COUNTRIES: Record<CountryCode, CountryInfo> = {
  NG: { name: 'Nigeria', flag: '🇳🇬', region: 'west-africa', dialCode: '+234' },
  GH: { name: 'Ghana', flag: '🇬🇭', region: 'west-africa', dialCode: '+233' },
  SN: { name: 'Senegal', flag: '🇸🇳', region: 'west-africa', dialCode: '+221' },
  CI: { name: "Côte d'Ivoire", flag: '🇨🇮', region: 'west-africa', dialCode: '+225' },
  CM: { name: 'Cameroon', flag: '🇨🇲', region: 'west-africa', dialCode: '+237' },
  BJ: { name: 'Benin', flag: '🇧🇯', region: 'west-africa', dialCode: '+229' },
  TG: { name: 'Togo', flag: '🇹🇬', region: 'west-africa', dialCode: '+228' },
  LR: { name: 'Liberia', flag: '🇱🇷', region: 'west-africa', dialCode: '+231' },
  SL: { name: 'Sierra Leone', flag: '🇸🇱', region: 'west-africa', dialCode: '+232' },
  BF: { name: 'Burkina Faso', flag: '🇧🇫', region: 'west-africa', dialCode: '+226' },
  ML: { name: 'Mali', flag: '🇲🇱', region: 'west-africa', dialCode: '+223' },
  NE: { name: 'Niger', flag: '🇳🇪', region: 'west-africa', dialCode: '+227' },
  KE: { name: 'Kenya', flag: '🇰🇪', region: 'east-africa', dialCode: '+254' },
  TZ: { name: 'Tanzania', flag: '🇹🇿', region: 'east-africa', dialCode: '+255' },
  UG: { name: 'Uganda', flag: '🇺🇬', region: 'east-africa', dialCode: '+256' },
  RW: { name: 'Rwanda', flag: '🇷🇼', region: 'east-africa', dialCode: '+250' },
  ET: { name: 'Ethiopia', flag: '🇪🇹', region: 'east-africa', dialCode: '+251' },
  SO: { name: 'Somalia', flag: '🇸🇴', region: 'east-africa', dialCode: '+252' },
  ZA: { name: 'South Africa', flag: '🇿🇦', region: 'southern-africa', dialCode: '+27' },
  ZW: { name: 'Zimbabwe', flag: '🇿🇼', region: 'southern-africa', dialCode: '+263' },
  ZM: { name: 'Zambia', flag: '🇿🇲', region: 'southern-africa', dialCode: '+260' },
  BW: { name: 'Botswana', flag: '🇧🇼', region: 'southern-africa', dialCode: '+267' },
  NA: { name: 'Namibia', flag: '🇳🇦', region: 'southern-africa', dialCode: '+264' },
  EG: { name: 'Egypt', flag: '🇪🇬', region: 'north-africa', dialCode: '+20' },
  MA: { name: 'Morocco', flag: '🇲🇦', region: 'north-africa', dialCode: '+212' },
  TN: { name: 'Tunisia', flag: '🇹🇳', region: 'north-africa', dialCode: '+216' },
  DZ: { name: 'Algeria', flag: '🇩🇿', region: 'north-africa', dialCode: '+213' },
  GB: { name: 'United Kingdom', flag: '🇬🇧', region: 'europe', dialCode: '+44' },
  IE: { name: 'Ireland', flag: '🇮🇪', region: 'europe', dialCode: '+353' },
  DE: { name: 'Germany', flag: '🇩🇪', region: 'europe', dialCode: '+49' },
  FR: { name: 'France', flag: '🇫🇷', region: 'europe', dialCode: '+33' },
  IT: { name: 'Italy', flag: '🇮🇹', region: 'europe', dialCode: '+39' },
  ES: { name: 'Spain', flag: '🇪🇸', region: 'europe', dialCode: '+34' },
  NL: { name: 'Netherlands', flag: '🇳🇱', region: 'europe', dialCode: '+31' },
  BE: { name: 'Belgium', flag: '🇧🇪', region: 'europe', dialCode: '+32' },
  SE: { name: 'Sweden', flag: '🇸🇪', region: 'europe', dialCode: '+46' },
  PT: { name: 'Portugal', flag: '🇵🇹', region: 'europe', dialCode: '+351' },
  US: { name: 'United States', flag: '🇺🇸', region: 'north-america', dialCode: '+1' },
  CA: { name: 'Canada', flag: '🇨🇦', region: 'north-america', dialCode: '+1' },
  BR: { name: 'Brazil', flag: '🇧🇷', region: 'south-america', dialCode: '+55' },
  MX: { name: 'Mexico', flag: '🇲🇽', region: 'south-america', dialCode: '+52' },
  AE: { name: 'United Arab Emirates', flag: '🇦🇪', region: 'middle-east', dialCode: '+971' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦', region: 'middle-east', dialCode: '+966' },
  QA: { name: 'Qatar', flag: '🇶🇦', region: 'middle-east', dialCode: '+974' },
  IN: { name: 'India', flag: '🇮🇳', region: 'asia', dialCode: '+91' },
  CN: { name: 'China', flag: '🇨🇳', region: 'asia', dialCode: '+86' },
  JP: { name: 'Japan', flag: '🇯🇵', region: 'asia', dialCode: '+81' },
  AU: { name: 'Australia', flag: '🇦🇺', region: 'oceania', dialCode: '+61' },
  NZ: { name: 'New Zealand', flag: '🇳🇿', region: 'oceania', dialCode: '+64' },
};
