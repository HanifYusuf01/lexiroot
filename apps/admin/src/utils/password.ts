export interface PasswordRule {
  key: 'length' | 'number' | 'mixedCase' | 'special';
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'number', label: 'Contains a number', test: (v) => /\d/.test(v) },
  {
    key: 'mixedCase',
    label: 'Contains uppercase and lowercase letters',
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  {
    key: 'special',
    label: 'Contains a special character',
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

export interface PasswordEvaluation {
  passed: PasswordRule['key'][];
  score: 0 | 1 | 2 | 3 | 4 | 5;
  strength: PasswordStrength;
  label: string;
}

export function evaluatePassword(value: string): PasswordEvaluation {
  const passed = PASSWORD_RULES.filter((r) => r.test(value)).map((r) => r.key);
  const baseScore = passed.length;
  // Length tiers reward longer passwords with the 5th bar.
  const score = (value.length >= 12 && baseScore === 4 ? 5 : baseScore) as PasswordEvaluation['score'];
  const map: Record<PasswordEvaluation['score'], { strength: PasswordStrength; label: string }> = {
    0: { strength: 'weak', label: 'Too weak' },
    1: { strength: 'weak', label: 'Weak' },
    2: { strength: 'fair', label: 'Fair' },
    3: { strength: 'good', label: 'Good' },
    4: { strength: 'strong', label: 'Strong' },
    5: { strength: 'very-strong', label: 'Very strong' },
  };
  return { passed, score, ...map[score] };
}
