export * from './plan-features';

export const LANGUAGE_CODES = ['yo', 'ig', 'ha'] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  yo: 'Yoruba',
  ig: 'Igbo',
  ha: 'Hausa',
};

/**
 * Display label for any language code. Languages are now a runtime catalog
 * (admin Settings), so codes beyond the seed set fall back to the raw code.
 */
export function languageLabel(code: string): string {
  return (LANGUAGE_LABELS as Record<string, string>)[code] ?? code;
}

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
  'central-africa',
  'europe',
  'north-america',
  'central-america',
  'south-america',
  'caribbean',
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
  'central-africa': 'Central Africa',
  europe: 'Europe',
  'north-america': 'North America',
  'central-america': 'Central America',
  'south-america': 'South America',
  caribbean: 'Caribbean',
  'middle-east': 'Middle East',
  asia: 'Asia',
  oceania: 'Oceania',
};

/**
 * Source-of-truth tuple: [ISO 3166-1 alpha-2 code, name, dial code, region].
 * COUNTRY_CODES, CountryCode, and COUNTRIES are derived from this — keep this
 * the only place where countries are added or edited.
 */
const COUNTRY_DATA = [
  // West Africa
  ['BF', 'Burkina Faso', '+226', 'west-africa'],
  ['BJ', 'Benin', '+229', 'west-africa'],
  ['CI', "Côte d'Ivoire", '+225', 'west-africa'],
  ['CV', 'Cape Verde', '+238', 'west-africa'],
  ['GH', 'Ghana', '+233', 'west-africa'],
  ['GM', 'Gambia', '+220', 'west-africa'],
  ['GN', 'Guinea', '+224', 'west-africa'],
  ['GW', 'Guinea-Bissau', '+245', 'west-africa'],
  ['LR', 'Liberia', '+231', 'west-africa'],
  ['ML', 'Mali', '+223', 'west-africa'],
  ['MR', 'Mauritania', '+222', 'west-africa'],
  ['NE', 'Niger', '+227', 'west-africa'],
  ['NG', 'Nigeria', '+234', 'west-africa'],
  ['SH', 'Saint Helena', '+290', 'west-africa'],
  ['SL', 'Sierra Leone', '+232', 'west-africa'],
  ['SN', 'Senegal', '+221', 'west-africa'],
  ['TG', 'Togo', '+228', 'west-africa'],

  // East Africa
  ['BI', 'Burundi', '+257', 'east-africa'],
  ['DJ', 'Djibouti', '+253', 'east-africa'],
  ['ER', 'Eritrea', '+291', 'east-africa'],
  ['ET', 'Ethiopia', '+251', 'east-africa'],
  ['KE', 'Kenya', '+254', 'east-africa'],
  ['KM', 'Comoros', '+269', 'east-africa'],
  ['MG', 'Madagascar', '+261', 'east-africa'],
  ['MU', 'Mauritius', '+230', 'east-africa'],
  ['MW', 'Malawi', '+265', 'east-africa'],
  ['MZ', 'Mozambique', '+258', 'east-africa'],
  ['RE', 'Réunion', '+262', 'east-africa'],
  ['RW', 'Rwanda', '+250', 'east-africa'],
  ['SC', 'Seychelles', '+248', 'east-africa'],
  ['SO', 'Somalia', '+252', 'east-africa'],
  ['SS', 'South Sudan', '+211', 'east-africa'],
  ['TZ', 'Tanzania', '+255', 'east-africa'],
  ['UG', 'Uganda', '+256', 'east-africa'],
  ['YT', 'Mayotte', '+262', 'east-africa'],
  ['ZM', 'Zambia', '+260', 'east-africa'],
  ['ZW', 'Zimbabwe', '+263', 'east-africa'],

  // Southern Africa
  ['BW', 'Botswana', '+267', 'southern-africa'],
  ['LS', 'Lesotho', '+266', 'southern-africa'],
  ['NA', 'Namibia', '+264', 'southern-africa'],
  ['SZ', 'Eswatini', '+268', 'southern-africa'],
  ['ZA', 'South Africa', '+27', 'southern-africa'],

  // North Africa
  ['DZ', 'Algeria', '+213', 'north-africa'],
  ['EG', 'Egypt', '+20', 'north-africa'],
  ['EH', 'Western Sahara', '+212', 'north-africa'],
  ['LY', 'Libya', '+218', 'north-africa'],
  ['MA', 'Morocco', '+212', 'north-africa'],
  ['SD', 'Sudan', '+249', 'north-africa'],
  ['TN', 'Tunisia', '+216', 'north-africa'],

  // Central Africa
  ['AO', 'Angola', '+244', 'central-africa'],
  ['CD', 'DR Congo', '+243', 'central-africa'],
  ['CF', 'Central African Republic', '+236', 'central-africa'],
  ['CG', 'Republic of Congo', '+242', 'central-africa'],
  ['CM', 'Cameroon', '+237', 'central-africa'],
  ['GA', 'Gabon', '+241', 'central-africa'],
  ['GQ', 'Equatorial Guinea', '+240', 'central-africa'],
  ['ST', 'São Tomé and Príncipe', '+239', 'central-africa'],
  ['TD', 'Chad', '+235', 'central-africa'],

  // Europe
  ['AD', 'Andorra', '+376', 'europe'],
  ['AL', 'Albania', '+355', 'europe'],
  ['AT', 'Austria', '+43', 'europe'],
  ['AX', 'Åland Islands', '+358', 'europe'],
  ['BA', 'Bosnia and Herzegovina', '+387', 'europe'],
  ['BE', 'Belgium', '+32', 'europe'],
  ['BG', 'Bulgaria', '+359', 'europe'],
  ['BY', 'Belarus', '+375', 'europe'],
  ['CH', 'Switzerland', '+41', 'europe'],
  ['CY', 'Cyprus', '+357', 'europe'],
  ['CZ', 'Czechia', '+420', 'europe'],
  ['DE', 'Germany', '+49', 'europe'],
  ['DK', 'Denmark', '+45', 'europe'],
  ['EE', 'Estonia', '+372', 'europe'],
  ['ES', 'Spain', '+34', 'europe'],
  ['FI', 'Finland', '+358', 'europe'],
  ['FO', 'Faroe Islands', '+298', 'europe'],
  ['FR', 'France', '+33', 'europe'],
  ['GB', 'United Kingdom', '+44', 'europe'],
  ['GG', 'Guernsey', '+44', 'europe'],
  ['GI', 'Gibraltar', '+350', 'europe'],
  ['GR', 'Greece', '+30', 'europe'],
  ['HR', 'Croatia', '+385', 'europe'],
  ['HU', 'Hungary', '+36', 'europe'],
  ['IE', 'Ireland', '+353', 'europe'],
  ['IM', 'Isle of Man', '+44', 'europe'],
  ['IS', 'Iceland', '+354', 'europe'],
  ['IT', 'Italy', '+39', 'europe'],
  ['JE', 'Jersey', '+44', 'europe'],
  ['LI', 'Liechtenstein', '+423', 'europe'],
  ['LT', 'Lithuania', '+370', 'europe'],
  ['LU', 'Luxembourg', '+352', 'europe'],
  ['LV', 'Latvia', '+371', 'europe'],
  ['MC', 'Monaco', '+377', 'europe'],
  ['MD', 'Moldova', '+373', 'europe'],
  ['ME', 'Montenegro', '+382', 'europe'],
  ['MK', 'North Macedonia', '+389', 'europe'],
  ['MT', 'Malta', '+356', 'europe'],
  ['NL', 'Netherlands', '+31', 'europe'],
  ['NO', 'Norway', '+47', 'europe'],
  ['PL', 'Poland', '+48', 'europe'],
  ['PT', 'Portugal', '+351', 'europe'],
  ['RO', 'Romania', '+40', 'europe'],
  ['RS', 'Serbia', '+381', 'europe'],
  ['RU', 'Russia', '+7', 'europe'],
  ['SE', 'Sweden', '+46', 'europe'],
  ['SI', 'Slovenia', '+386', 'europe'],
  ['SJ', 'Svalbard and Jan Mayen', '+47', 'europe'],
  ['SK', 'Slovakia', '+421', 'europe'],
  ['SM', 'San Marino', '+378', 'europe'],
  ['UA', 'Ukraine', '+380', 'europe'],
  ['VA', 'Vatican City', '+39', 'europe'],
  ['XK', 'Kosovo', '+383', 'europe'],

  // North America
  ['BM', 'Bermuda', '+1', 'north-america'],
  ['CA', 'Canada', '+1', 'north-america'],
  ['GL', 'Greenland', '+299', 'north-america'],
  ['PM', 'Saint Pierre and Miquelon', '+508', 'north-america'],
  ['US', 'United States', '+1', 'north-america'],

  // Central America
  ['BZ', 'Belize', '+501', 'central-america'],
  ['CR', 'Costa Rica', '+506', 'central-america'],
  ['GT', 'Guatemala', '+502', 'central-america'],
  ['HN', 'Honduras', '+504', 'central-america'],
  ['MX', 'Mexico', '+52', 'central-america'],
  ['NI', 'Nicaragua', '+505', 'central-america'],
  ['PA', 'Panama', '+507', 'central-america'],
  ['SV', 'El Salvador', '+503', 'central-america'],

  // South America
  ['AR', 'Argentina', '+54', 'south-america'],
  ['BO', 'Bolivia', '+591', 'south-america'],
  ['BR', 'Brazil', '+55', 'south-america'],
  ['CL', 'Chile', '+56', 'south-america'],
  ['CO', 'Colombia', '+57', 'south-america'],
  ['EC', 'Ecuador', '+593', 'south-america'],
  ['FK', 'Falkland Islands', '+500', 'south-america'],
  ['GF', 'French Guiana', '+594', 'south-america'],
  ['GY', 'Guyana', '+592', 'south-america'],
  ['PE', 'Peru', '+51', 'south-america'],
  ['PY', 'Paraguay', '+595', 'south-america'],
  ['SR', 'Suriname', '+597', 'south-america'],
  ['UY', 'Uruguay', '+598', 'south-america'],
  ['VE', 'Venezuela', '+58', 'south-america'],

  // Caribbean
  ['AG', 'Antigua and Barbuda', '+1', 'caribbean'],
  ['AI', 'Anguilla', '+1', 'caribbean'],
  ['AW', 'Aruba', '+297', 'caribbean'],
  ['BB', 'Barbados', '+1', 'caribbean'],
  ['BL', 'Saint Barthélemy', '+590', 'caribbean'],
  ['BQ', 'Caribbean Netherlands', '+599', 'caribbean'],
  ['BS', 'Bahamas', '+1', 'caribbean'],
  ['CU', 'Cuba', '+53', 'caribbean'],
  ['CW', 'Curaçao', '+599', 'caribbean'],
  ['DM', 'Dominica', '+1', 'caribbean'],
  ['DO', 'Dominican Republic', '+1', 'caribbean'],
  ['GD', 'Grenada', '+1', 'caribbean'],
  ['GP', 'Guadeloupe', '+590', 'caribbean'],
  ['HT', 'Haiti', '+509', 'caribbean'],
  ['JM', 'Jamaica', '+1', 'caribbean'],
  ['KN', 'Saint Kitts and Nevis', '+1', 'caribbean'],
  ['KY', 'Cayman Islands', '+1', 'caribbean'],
  ['LC', 'Saint Lucia', '+1', 'caribbean'],
  ['MF', 'Saint Martin', '+590', 'caribbean'],
  ['MQ', 'Martinique', '+596', 'caribbean'],
  ['MS', 'Montserrat', '+1', 'caribbean'],
  ['PR', 'Puerto Rico', '+1', 'caribbean'],
  ['SX', 'Sint Maarten', '+1', 'caribbean'],
  ['TC', 'Turks and Caicos Islands', '+1', 'caribbean'],
  ['TT', 'Trinidad and Tobago', '+1', 'caribbean'],
  ['VC', 'Saint Vincent and the Grenadines', '+1', 'caribbean'],
  ['VG', 'British Virgin Islands', '+1', 'caribbean'],
  ['VI', 'U.S. Virgin Islands', '+1', 'caribbean'],

  // Middle East
  ['AE', 'United Arab Emirates', '+971', 'middle-east'],
  ['AM', 'Armenia', '+374', 'middle-east'],
  ['AZ', 'Azerbaijan', '+994', 'middle-east'],
  ['BH', 'Bahrain', '+973', 'middle-east'],
  ['GE', 'Georgia', '+995', 'middle-east'],
  ['IL', 'Israel', '+972', 'middle-east'],
  ['IQ', 'Iraq', '+964', 'middle-east'],
  ['IR', 'Iran', '+98', 'middle-east'],
  ['JO', 'Jordan', '+962', 'middle-east'],
  ['KW', 'Kuwait', '+965', 'middle-east'],
  ['LB', 'Lebanon', '+961', 'middle-east'],
  ['OM', 'Oman', '+968', 'middle-east'],
  ['PS', 'Palestine', '+970', 'middle-east'],
  ['QA', 'Qatar', '+974', 'middle-east'],
  ['SA', 'Saudi Arabia', '+966', 'middle-east'],
  ['SY', 'Syria', '+963', 'middle-east'],
  ['TR', 'Turkey', '+90', 'middle-east'],
  ['YE', 'Yemen', '+967', 'middle-east'],

  // Asia
  ['AF', 'Afghanistan', '+93', 'asia'],
  ['BD', 'Bangladesh', '+880', 'asia'],
  ['BN', 'Brunei', '+673', 'asia'],
  ['BT', 'Bhutan', '+975', 'asia'],
  ['CC', 'Cocos (Keeling) Islands', '+61', 'asia'],
  ['CN', 'China', '+86', 'asia'],
  ['HK', 'Hong Kong', '+852', 'asia'],
  ['ID', 'Indonesia', '+62', 'asia'],
  ['IN', 'India', '+91', 'asia'],
  ['IO', 'British Indian Ocean Territory', '+246', 'asia'],
  ['JP', 'Japan', '+81', 'asia'],
  ['KG', 'Kyrgyzstan', '+996', 'asia'],
  ['KH', 'Cambodia', '+855', 'asia'],
  ['KP', 'North Korea', '+850', 'asia'],
  ['KR', 'South Korea', '+82', 'asia'],
  ['KZ', 'Kazakhstan', '+7', 'asia'],
  ['LA', 'Laos', '+856', 'asia'],
  ['LK', 'Sri Lanka', '+94', 'asia'],
  ['MM', 'Myanmar', '+95', 'asia'],
  ['MN', 'Mongolia', '+976', 'asia'],
  ['MO', 'Macao', '+853', 'asia'],
  ['MV', 'Maldives', '+960', 'asia'],
  ['MY', 'Malaysia', '+60', 'asia'],
  ['NP', 'Nepal', '+977', 'asia'],
  ['PH', 'Philippines', '+63', 'asia'],
  ['PK', 'Pakistan', '+92', 'asia'],
  ['SG', 'Singapore', '+65', 'asia'],
  ['TH', 'Thailand', '+66', 'asia'],
  ['TJ', 'Tajikistan', '+992', 'asia'],
  ['TL', 'Timor-Leste', '+670', 'asia'],
  ['TM', 'Turkmenistan', '+993', 'asia'],
  ['TW', 'Taiwan', '+886', 'asia'],
  ['UZ', 'Uzbekistan', '+998', 'asia'],
  ['VN', 'Vietnam', '+84', 'asia'],

  // Oceania
  ['AS', 'American Samoa', '+1', 'oceania'],
  ['AU', 'Australia', '+61', 'oceania'],
  ['CK', 'Cook Islands', '+682', 'oceania'],
  ['CX', 'Christmas Island', '+61', 'oceania'],
  ['FJ', 'Fiji', '+679', 'oceania'],
  ['FM', 'Micronesia', '+691', 'oceania'],
  ['GU', 'Guam', '+1', 'oceania'],
  ['KI', 'Kiribati', '+686', 'oceania'],
  ['MH', 'Marshall Islands', '+692', 'oceania'],
  ['MP', 'Northern Mariana Islands', '+1', 'oceania'],
  ['NC', 'New Caledonia', '+687', 'oceania'],
  ['NF', 'Norfolk Island', '+672', 'oceania'],
  ['NR', 'Nauru', '+674', 'oceania'],
  ['NU', 'Niue', '+683', 'oceania'],
  ['NZ', 'New Zealand', '+64', 'oceania'],
  ['PF', 'French Polynesia', '+689', 'oceania'],
  ['PG', 'Papua New Guinea', '+675', 'oceania'],
  ['PN', 'Pitcairn Islands', '+64', 'oceania'],
  ['PW', 'Palau', '+680', 'oceania'],
  ['SB', 'Solomon Islands', '+677', 'oceania'],
  ['TK', 'Tokelau', '+690', 'oceania'],
  ['TO', 'Tonga', '+676', 'oceania'],
  ['TV', 'Tuvalu', '+688', 'oceania'],
  ['VU', 'Vanuatu', '+678', 'oceania'],
  ['WF', 'Wallis and Futuna', '+681', 'oceania'],
  ['WS', 'Samoa', '+685', 'oceania'],
] as const satisfies ReadonlyArray<readonly [string, string, string, CountryRegion]>;

export type CountryCode = (typeof COUNTRY_DATA)[number][0];
export const COUNTRY_CODES: readonly CountryCode[] = COUNTRY_DATA.map((row) => row[0]);

export interface CountryInfo {
  name: string;
  flag: string;
  region: CountryRegion;
  dialCode: string;
}

/** Convert an ISO 3166-1 alpha-2 code to its flag emoji via regional-indicator pairs. */
function flagOf(code: string): string {
  return Array.from(code.toUpperCase())
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export const COUNTRIES: Record<CountryCode, CountryInfo> = Object.fromEntries(
  COUNTRY_DATA.map(([code, name, dialCode, region]) => [
    code,
    { name, dialCode, region, flag: flagOf(code) },
  ]),
) as Record<CountryCode, CountryInfo>;
