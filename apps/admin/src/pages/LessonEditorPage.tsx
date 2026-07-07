import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Eye } from 'lucide-react';
import {
  DURATION_BUCKETS,
  LANGUAGE_LABELS,
  LEARNING_LEVELS,
  LEARNING_LEVEL_LABELS,
  LESSON_STATUSES,
  LESSON_STATUS_LABELS,
  LESSON_TYPES,
  LESSON_TYPE_LABELS,
  type DurationBucket,
  type ExerciseCategory,
  type ExerciseInput,
  type LanguageCode,
  type LessonEntryInput,
  type LearningLevel,
  type LessonMeta,
  type LessonStatus,
  type LessonType,
  type RecognitionPromptMeta,
} from '@lexiroot/shared';
import {
  useCreateLessonMutation,
  useGetLessonQuery,
  useUpdateLessonMutation,
} from '../services/lessonsApi';
import { useListExercisesQuery, useReplaceExercisesMutation } from '../services/exercisesApi';
import { useListEntriesQuery, useReplaceEntriesMutation } from '../services/lessonEntriesApi';
import { LessonSummaryCard } from '../components/features/lessons/LessonSummaryCard';
import { YorubaShortcutsHelp } from '../components/features/lessons/YorubaShortcutsHelp';
import { ExerciseContentEditor } from '../components/features/lessons/exerciseEditor/ExerciseContentEditor';
import { VocabularyEditor } from '../components/features/lessons/contentEditors/VocabularyEditor';
import { SentenceEditor } from '../components/features/lessons/contentEditors/SentenceEditor';
import { LettersNumbersEditor } from '../components/features/lessons/contentEditors/LettersNumbersEditor';
import { RecognitionItemsEditor } from '../components/features/lessons/contentEditors/RecognitionItemsEditor';
import { useToast } from '../components/ui/Toast';

const EMPTY_RECOGNITION_PROMPT: RecognitionPromptMeta = { audioUrl: '', instruction: '' };

const DESCRIPTION_MAX = 200;

function lessonTypeToExerciseCategory(type: LessonType): ExerciseCategory | undefined {
  if (type === 'letters-numbers') return 'letters-numbers';
  if (type === 'vocabulary') return 'vocabulary';
  if (type === 'recognition') return 'recognition';
  if (type === 'sentence') return 'sentence';
  return undefined;
}

interface FormState {
  language: LanguageCode;
  tier: LearningLevel;
  level: number;
  title: string;
  shortDescription: string;
  estimatedDuration: DurationBucket | '';
  xpReward: number;
  type: LessonType;
  speechRequired: boolean;
  offlineAvailable: boolean;
  status: LessonStatus;
}

interface FieldErrors {
  title?: string;
  shortDescription?: string;
  level?: string;
  general?: string;
}

const DEFAULT_FORM: FormState = {
  language: 'yo',
  tier: 'beginner',
  level: 1,
  title: '',
  shortDescription: '',
  estimatedDuration: '3-5 minutes',
  xpReward: 20,
  type: 'vocabulary',
  speechRequired: false,
  offlineAvailable: true,
  status: 'draft',
};

export function LessonEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const presetType = useMemo<LessonType | null>(() => {
    const raw = searchParams.get('type');
    return raw && (LESSON_TYPES as readonly string[]).includes(raw) ? (raw as LessonType) : null;
  }, [searchParams]);
  const { data: existing, isLoading: loadingLesson } = useGetLessonQuery(id!, { skip: !id });
  const { data: existingExercises } = useListExercisesQuery(id!, { skip: !id });
  const { data: existingEntries } = useListEntriesQuery(id!, { skip: !id });
  const [createLesson, { isLoading: creating }] = useCreateLessonMutation();
  const [updateLesson, { isLoading: updating }] = useUpdateLessonMutation();
  const [replaceExercises, { isLoading: savingExercises }] = useReplaceExercisesMutation();
  const [replaceEntries, { isLoading: savingEntries }] = useReplaceEntriesMutation();

  const [form, setForm] = useState<FormState>(() => ({
    ...DEFAULT_FORM,
    type: presetType ?? DEFAULT_FORM.type,
  }));
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  const [vocabulary, setVocabulary] = useState<LessonEntryInput<'vocabulary'>[]>([]);
  const [sentences, setSentences] = useState<LessonEntryInput<'sentence'>[]>([]);
  const [letters, setLetters] = useState<LessonEntryInput<'letter'>[]>([]);
  const [numbers, setNumbers] = useState<LessonEntryInput<'number'>[]>([]);
  const [recognitionItems, setRecognitionItems] = useState<LessonEntryInput<'recognition-item'>[]>(
    [],
  );
  const [recognitionPrompt, setRecognitionPrompt] =
    useState<RecognitionPromptMeta>(EMPTY_RECOGNITION_PROMPT);
  const [meta, setMeta] = useState<LessonMeta>({});
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!existingExercises) return;
    setExercises(
      existingExercises.map((ex, i) => ({
        id: ex.id,
        category: ex.category,
        subType: ex.subType,
        orderIndex: ex.orderIndex ?? i,
        payload: ex.payload,
      })),
    );
  }, [existingExercises]);

  useEffect(() => {
    if (!existingEntries) return;
    const vocab = existingEntries
      .filter((e) => e.kind === 'vocabulary')
      .map<LessonEntryInput<'vocabulary'>>((e, i) => ({
        id: e.id,
        kind: 'vocabulary',
        orderIndex: e.orderIndex ?? i,
        payload: e.payload as LessonEntryInput<'vocabulary'>['payload'],
      }));
    const sent = existingEntries
      .filter((e) => e.kind === 'sentence')
      .map<LessonEntryInput<'sentence'>>((e, i) => ({
        id: e.id,
        kind: 'sentence',
        orderIndex: e.orderIndex ?? i,
        payload: e.payload as LessonEntryInput<'sentence'>['payload'],
      }));
    const lettersFromEntries = existingEntries
      .filter((e) => e.kind === 'letter')
      .map<LessonEntryInput<'letter'>>((e, i) => ({
        id: e.id,
        kind: 'letter',
        orderIndex: e.orderIndex ?? i,
        payload: e.payload as LessonEntryInput<'letter'>['payload'],
      }));
    const numbersFromEntries = existingEntries
      .filter((e) => e.kind === 'number')
      .map<LessonEntryInput<'number'>>((e, i) => ({
        id: e.id,
        kind: 'number',
        orderIndex: e.orderIndex ?? i,
        payload: e.payload as LessonEntryInput<'number'>['payload'],
      }));
    const recognitionFromEntries = existingEntries
      .filter((e) => e.kind === 'recognition-item')
      .map<LessonEntryInput<'recognition-item'>>((e, i) => ({
        id: e.id,
        kind: 'recognition-item',
        orderIndex: e.orderIndex ?? i,
        payload: e.payload as LessonEntryInput<'recognition-item'>['payload'],
      }));
    setVocabulary(vocab);
    setSentences(sent);
    setLetters(lettersFromEntries);
    setNumbers(numbersFromEntries);
    setRecognitionItems(recognitionFromEntries);
  }, [existingEntries]);

  useEffect(() => {
    if (!existing) return;
    setForm({
      language: existing.language,
      tier: existing.tier,
      level: existing.level,
      title: existing.title,
      shortDescription: existing.shortDescription,
      estimatedDuration: existing.estimatedDuration ?? '',
      xpReward: existing.xpReward,
      type: existing.type,
      speechRequired: existing.speechRequired,
      offlineAvailable: existing.offlineAvailable,
      status: existing.status,
    });
    setMeta(existing.meta ?? {});
    setRecognitionPrompt(existing.meta?.recognitionPrompt ?? EMPTY_RECOGNITION_PROMPT);
  }, [existing]);

  const saving = creating || updating || savingExercises || savingEntries;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (form.title.trim().length < 2) next.title = 'Title is required';
    if (!Number.isFinite(form.level) || form.level < 1) next.level = 'Level must be at least 1';
    if (form.shortDescription.length > DESCRIPTION_MAX) {
      next.shortDescription = `Keep it under ${DESCRIPTION_MAX} characters`;
    }
    return next;
  }

  async function handleSave(targetStatus?: LessonStatus) {
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    const nextMeta: LessonMeta =
      form.type === 'recognition' ? { ...meta, recognitionPrompt } : meta;
    const payload = {
      language: form.language,
      tier: form.tier,
      level: form.level,
      title: form.title.trim(),
      shortDescription: form.shortDescription,
      estimatedDuration: (form.estimatedDuration || undefined) as DurationBucket | undefined,
      xpReward: form.xpReward,
      type: form.type,
      speechRequired: form.speechRequired,
      offlineAvailable: form.offlineAvailable,
      status: targetStatus ?? form.status,
      meta: nextMeta,
    };
    try {
      let lessonId = id;
      if (isEditing && id) {
        await updateLesson({ id, ...payload }).unwrap();
      } else {
        const created = await createLesson(payload).unwrap();
        lessonId = created.id;
      }
      if (lessonId) {
        await replaceExercises({
          lessonId,
          exercises: exercises.map((ex, i) => ({
            id: ex.id,
            category: ex.category,
            subType: ex.subType,
            orderIndex: i,
            payload: ex.payload,
          })),
        }).unwrap();
      }
      if (lessonId && (payload.type === 'vocabulary' || payload.type === 'sentence')) {
        const entries =
          payload.type === 'vocabulary'
            ? vocabulary.map((row, i) => ({ ...row, orderIndex: i }))
            : sentences.map((row, i) => ({ ...row, orderIndex: i }));
        await replaceEntries({ lessonId, entries }).unwrap();
      }
      if (lessonId && payload.type === 'letters-numbers') {
        const entries = [
          ...letters.map((row, i) => ({ ...row, orderIndex: i })),
          ...numbers.map((row, i) => ({ ...row, orderIndex: i })),
        ];
        await replaceEntries({ lessonId, entries }).unwrap();
      }
      if (lessonId && payload.type === 'recognition') {
        const entries = recognitionItems.map((row, i) => ({ ...row, orderIndex: i }));
        await replaceEntries({ lessonId, entries }).unwrap();
      }
      const action = isEditing ? 'updated' : 'created';
      const status = payload.status === 'published' ? ' and published' : '';
      toast.success(`Lesson ${action}${status}`);
      if (!isEditing && lessonId) {
        navigate(`/lessons/${lessonId}/edit`, { replace: true });
        return;
      }
      setForm((s) => ({ ...s, status: payload.status }));
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string | string[] } };
      const msg = Array.isArray(e.data?.message) ? e.data?.message[0] : e.data?.message;
      const errorMessage = msg ?? 'Could not save lesson. Please try again.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    }
  }

  if (id && loadingLesson) {
    return <div className="p-8 text-neutral-variant">Loading lesson…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-1 items-start gap-3">
          <Link
            to="/lessons"
            className="rounded-md border border-border bg-white p-2 text-neutral hover:bg-neutral-soft"
            aria-label="Back to lessons"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-extrabold text-neutral sm:text-2xl">
              {isEditing ? 'Edit Lesson' : 'Create Lesson'}
            </h1>
            <p className="text-xs text-neutral-variant sm:text-sm">
              Build engaging lessons that help learners master{' '}
              {LANGUAGE_LABELS[form.language].toLowerCase()}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-neutral hover:bg-neutral-soft disabled:opacity-60 sm:flex-none"
          >
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground opacity-90 sm:flex-none"
          >
            <Eye size={16} />
            Preview Lesson
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Section
            title="1. Basic Information"
            description="Set the essential details of your lesson"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Language" required>
                <div className="flex h-11 items-center rounded-lg border border-border bg-neutral-soft px-3 text-sm font-semibold text-neutral">
                  {LANGUAGE_LABELS[form.language]}
                </div>
              </Field>
              <Field label="Tier" required>
                <NativeSelect
                  value={form.tier}
                  onChange={(v) => update('tier', v as LearningLevel)}
                  options={LEARNING_LEVELS.map((l) => ({
                    value: l,
                    label: LEARNING_LEVEL_LABELS[l],
                  }))}
                />
              </Field>
              <Field label="Level" required error={errors.level}>
                <input
                  type="number"
                  min={1}
                  value={form.level}
                  onChange={(e) => update('level', Number(e.target.value) || 1)}
                  className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
                />
              </Field>
            </div>

            <Field label="Lesson Title" required error={errors.title} className="mt-4">
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Greetings & Introductions"
                className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-neutral outline-none focus:border-primary"
              />
            </Field>

            <Field
              label="Short Description"
              required
              error={errors.shortDescription}
              className="mt-4"
            >
              <div className="relative">
                <textarea
                  value={form.shortDescription}
                  onChange={(e) =>
                    update('shortDescription', e.target.value.slice(0, DESCRIPTION_MAX))
                  }
                  rows={3}
                  placeholder="A short summary learners will see before starting."
                  className="w-full rounded-lg border border-border bg-white p-3 text-sm text-neutral outline-none focus:border-primary"
                />
                <span className="absolute bottom-2 right-3 text-xs text-neutral-variant">
                  {form.shortDescription.length}/{DESCRIPTION_MAX}
                </span>
              </div>
            </Field>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Estimated Duration">
                <NativeSelect
                  value={form.estimatedDuration}
                  onChange={(v) => update('estimatedDuration', v as DurationBucket)}
                  options={DURATION_BUCKETS.map((d) => ({ value: d, label: d }))}
                />
              </Field>
              <Field label="XP Reward" required>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={form.xpReward}
                    onChange={(e) => update('xpReward', Number(e.target.value) || 0)}
                    className="h-11 w-full rounded-lg border border-border bg-white px-3 pr-10 text-sm text-neutral outline-none focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-variant">
                    XP
                  </span>
                </div>
              </Field>
            </div>
          </Section>

          <Section
            title="2. Lesson Settings"
            description="Configure how this lesson will behave in the app"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Lesson Type"
                required
                hint={
                  isEditing
                    ? 'Lesson type is fixed after creation. Create a new lesson for a different skill.'
                    : undefined
                }
              >
                {isEditing ? (
                  <div className="flex h-10 items-center rounded-lg border border-border bg-neutral-soft/40 px-3 text-sm font-semibold text-neutral">
                    {LESSON_TYPE_LABELS[form.type]}
                  </div>
                ) : (
                  <NativeSelect
                    value={form.type}
                    onChange={(v) => update('type', v as LessonType)}
                    options={LESSON_TYPES.map((t) => ({ value: t, label: LESSON_TYPE_LABELS[t] }))}
                  />
                )}
              </Field>
              <Field label="Speech Required" required>
                <Toggle value={form.speechRequired} onChange={(v) => update('speechRequired', v)} />
              </Field>
            </div>

            <Field label="Status" required className="mt-4">
              <NativeSelect
                value={form.status}
                onChange={(v) => update('status', v as LessonStatus)}
                options={LESSON_STATUSES.map((s) => ({
                  value: s,
                  label: LESSON_STATUS_LABELS[s],
                }))}
              />
            </Field>
          </Section>

          {form.type === 'exercise' ? (
            <Section title="3. Lesson Content" description="Build the exercises for this lesson">
              <YorubaShortcutsHelp />
              <ExerciseContentEditor value={exercises} onChange={setExercises} />
            </Section>
          ) : (
            <>
              <Section
                title="3a. Source Content"
                description="The learning material learners will study before practicing"
              >
                <YorubaShortcutsHelp />
                {form.type === 'vocabulary' ? (
                  <VocabularyEditor value={vocabulary} onChange={setVocabulary} />
                ) : form.type === 'sentence' ? (
                  <SentenceEditor value={sentences} onChange={setSentences} />
                ) : form.type === 'letters-numbers' ? (
                  <LettersNumbersEditor
                    language={form.language}
                    letters={letters}
                    onLettersChange={setLetters}
                    numbers={numbers}
                    onNumbersChange={setNumbers}
                  />
                ) : (
                  <RecognitionItemsEditor
                    prompt={recognitionPrompt}
                    onPromptChange={setRecognitionPrompt}
                    items={recognitionItems}
                    onItemsChange={setRecognitionItems}
                  />
                )}
              </Section>

              <Section
                title="3b. Practice Exercises"
                description="The questions learners will answer in this lesson"
              >
                <ExerciseContentEditor
                  value={exercises}
                  onChange={setExercises}
                  restrictToCategory={lessonTypeToExerciseCategory(form.type)}
                />
              </Section>
            </>
          )}

          {errors.general ? (
            <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {errors.general}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/lessons"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-neutral hover:bg-neutral-soft"
            >
              Cancel
            </Link>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-neutral hover:bg-neutral-soft disabled:opacity-60"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save & Continue →'}
              </button>
            </div>
          </div>
        </div>

        <LessonSummaryCard
          language={form.language}
          tier={form.tier}
          level={form.level}
          type={form.type}
          speechRequired={form.speechRequired}
          estimatedDuration={form.estimatedDuration || null}
          xpReward={form.xpReward}
          status={form.status}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <header className="mb-4">
        <h2 className="font-display text-base font-bold text-neutral">{title}</h2>
        {description ? <p className="text-xs text-neutral-variant">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold text-neutral">
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-[11px] text-neutral-variant">{hint}</p> : null}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-9 text-sm text-neutral outline-none focus:border-primary"
      >
        {placeholder && !value ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-variant"
      />
    </div>
  );
}

function pillClass(active: boolean): string {
  return [
    'inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-semibold transition',
    active
      ? 'border-primary-border bg-primary-softer text-primary'
      : 'border-border bg-white text-neutral hover:bg-neutral-soft',
  ].join(' ');
}

function Toggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" onClick={() => onChange(false)} className={pillClass(!value)}>
        No
      </button>
      <button type="button" onClick={() => onChange(true)} className={pillClass(value)}>
        Yes
      </button>
    </div>
  );
}
