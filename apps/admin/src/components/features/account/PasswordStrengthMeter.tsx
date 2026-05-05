import { Check } from 'lucide-react';
import { evaluatePassword, PASSWORD_RULES } from '../../../utils/password';

interface Props {
  value: string;
}

const STRENGTH_COLOR: Record<ReturnType<typeof evaluatePassword>['strength'], string> = {
  weak: '#FF3333',
  fair: '#F9D506',
  good: '#F9D506',
  strong: '#16A34A',
  'very-strong': '#16A34A',
};

export function PasswordStrengthMeter({ value }: Props) {
  const evaluation = evaluatePassword(value);
  const color = STRENGTH_COLOR[evaluation.strength];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="text-xs font-semibold text-neutral">
          Password Strength:{' '}
          <span style={{ color }} className="font-bold">
            {evaluation.label}
          </span>
        </span>
        <div className="flex w-full items-center gap-1 sm:w-auto sm:max-w-xs sm:flex-1">
          {[1, 2, 3, 4, 5].map((bar) => (
            <span
              key={bar}
              className="h-1.5 flex-1 rounded-full"
              style={{ backgroundColor: bar <= evaluation.score ? color : '#E5E5E5' }}
            />
          ))}
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = evaluation.passed.includes(rule.key);
          return (
            <li key={rule.key} className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  ok ? 'bg-success text-white' : 'bg-neutral-soft text-neutral-variant'
                }`}
              >
                <Check size={11} strokeWidth={3} />
              </span>
              <span className={ok ? 'text-neutral' : 'text-neutral-variant'}>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
