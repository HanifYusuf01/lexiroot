import { useMemo } from 'react';
import type { LanguageCode, LearningLevel, LessonSlot, LessonType } from '@lexiroot/shared';
import { useLessonSlotsQuery } from '../services/lessonsApi';

export interface LessonSlotsState {
  isLoading: boolean;
  /** Types already used at this tier + level (excluding the lesson being edited). */
  takenTypes: Set<LessonType>;
  /** True when this exact tier + level + type is already taken. */
  isTaken: boolean;
  /** Lowest level at this tier that has no lesson of the given type yet. */
  nextFreeLevel: (tier: LearningLevel, type: LessonType) => number;
}

/**
 * Tracks which (tier, level, type) slots already have a lesson, so the editor
 * can steer authors away from duplicates before the API rejects them.
 */
export function useLessonSlots(
  language: LanguageCode,
  tier: LearningLevel,
  level: number,
  type: LessonType,
  excludeId?: string,
): LessonSlotsState {
  const { data, isLoading } = useLessonSlotsQuery(language);

  return useMemo(() => {
    const slots: LessonSlot[] = (data ?? []).filter((s) => s.id !== excludeId);

    const takenTypes = new Set<LessonType>(
      slots.filter((s) => s.tier === tier && s.level === level).map((s) => s.type),
    );

    const nextFreeLevel = (t: LearningLevel, ty: LessonType) => {
      const used = new Set(slots.filter((s) => s.tier === t && s.type === ty).map((s) => s.level));
      let candidate = 1;
      while (used.has(candidate)) candidate += 1;
      return candidate;
    };

    return { isLoading, takenTypes, isTaken: takenTypes.has(type), nextFreeLevel };
  }, [data, isLoading, excludeId, tier, level, type]);
}
