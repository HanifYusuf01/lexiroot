export const TEACHING_LANGUAGE_STATUSES = ['draft', 'in-development', 'connected'] as const;
export type TeachingLanguageStatus = (typeof TEACHING_LANGUAGE_STATUSES)[number];

export const TEACHING_LANGUAGE_STATUS_LABELS: Record<TeachingLanguageStatus, string> = {
  draft: 'Draft',
  'in-development': 'In Development',
  connected: 'Connected',
};

export interface TeachingLanguage {
  id: string;
  code: string;
  name: string;
  /** ISO 3166-1 alpha-2 code of the country this language belongs to (e.g. NG). */
  country: string;
  status: TeachingLanguageStatus;
  /** Number of learners studying this language (computed from users). */
  learners: number;
  /** Number of lessons published for this language (computed from lessons). */
  lessons: number;
  createdAt: string;
  updatedAt: string;
}

/** Lean language entry exposed publicly (e.g. mobile onboarding picker). */
export interface PublicLanguage {
  code: string;
  name: string;
  status: TeachingLanguageStatus;
}

export interface CreateTeachingLanguage {
  code: string;
  name: string;
  country: string;
  status?: TeachingLanguageStatus;
}

export type UpdateTeachingLanguage = Partial<CreateTeachingLanguage>;
