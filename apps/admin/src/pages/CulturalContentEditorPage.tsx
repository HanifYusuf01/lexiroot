import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import {
  CULTURAL_CONTENT_TYPES,
  LANGUAGE_CODES,
  LANGUAGE_LABELS,
  LEARNING_LEVELS,
  LEARNING_LEVEL_LABELS,
  type CulturalContentBody,
  type CulturalProverbBody,
  type CulturalStoryBody,
  type CulturalContentStatus,
  type CulturalContentType,
  type LanguageCode,
  type LearningLevel,
} from '@lexiroot/shared';
import { PageHeader } from '../components/layout/PageHeader';
import { CulturalContentTypePicker } from '../components/features/cultural-content/CulturalContentTypePicker';
import { CulturalContentMediaPanel } from '../components/features/cultural-content/CulturalContentMediaPanel';
import { RichTextArea } from '../components/features/cultural-content/RichTextArea';
import { YorubaInput } from '../components/ui/YorubaInput';
import { YorubaShortcutsHelp } from '../components/features/lessons/YorubaShortcutsHelp';
import { useToast } from '../components/ui/Toast';
import {
  useCreateCulturalContentMutation,
  useGetCulturalContentQuery,
  useUpdateCulturalContentMutation,
} from '../services/culturalContentApi';

const TITLE_MAX = 100;
const PROVERB_MAX = 150;
const SHORT_DESC_MAX = 200;
const EXPLANATION_MAX = 200;
const USAGE_MAX = 200;

interface FormState {
  type: CulturalContentType;
  language: LanguageCode;
  tier: LearningLevel;
  titleEnglish: string;
  titleTranslated: string;
  shortDescription: string;
  storyContentEnglish: string;
  storyContentTranslated: string;
  proverbExplanation: string;
  proverbUsageExample: string;
  coverImageUrl: string | null;
  audioUrl: string | null;
  audioFileName: string | null;
}

interface FieldErrors {
  titleEnglish?: string;
  titleTranslated?: string;
  proverbExplanation?: string;
  general?: string;
}

const DEFAULT_FORM: FormState = {
  type: 'story',
  language: 'yo',
  tier: 'beginner',
  titleEnglish: '',
  titleTranslated: '',
  shortDescription: '',
  storyContentEnglish: '',
  storyContentTranslated: '',
  proverbExplanation: '',
  proverbUsageExample: '',
  coverImageUrl: null,
  audioUrl: null,
  audioFileName: null,
};

function bodyForType(form: FormState): CulturalContentBody {
  if (form.type === 'proverb') {
    return {
      explanation: form.proverbExplanation,
      usageExample: form.proverbUsageExample,
    } satisfies CulturalProverbBody;
  }
  return {
    contentEnglish: form.storyContentEnglish,
    contentTranslated: form.storyContentTranslated,
  } satisfies CulturalStoryBody;
}

function isProverbBody(b: CulturalContentBody): b is CulturalProverbBody {
  return Object.prototype.hasOwnProperty.call(b, 'explanation');
}

export function CulturalContentEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const presetType = useMemo<CulturalContentType | null>(() => {
    const raw = searchParams.get('type');
    return raw && (CULTURAL_CONTENT_TYPES as readonly string[]).includes(raw)
      ? (raw as CulturalContentType)
      : null;
  }, [searchParams]);

  const { data: existing, isLoading: loadingItem } = useGetCulturalContentQuery(id!, {
    skip: !id,
  });
  const [createItem, { isLoading: creating }] = useCreateCulturalContentMutation();
  const [updateItem, { isLoading: updating }] = useUpdateCulturalContentMutation();

  const [form, setForm] = useState<FormState>(() => ({
    ...DEFAULT_FORM,
    type: presetType ?? DEFAULT_FORM.type,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!existing) return;
    const body = existing.body ?? ({} as CulturalContentBody);
    setForm({
      type: existing.type,
      language: existing.language,
      tier: existing.tier,
      titleEnglish: existing.titleEnglish,
      titleTranslated: existing.titleTranslated,
      shortDescription: existing.shortDescription,
      storyContentEnglish: isProverbBody(body) ? '' : (body.contentEnglish ?? ''),
      storyContentTranslated: isProverbBody(body) ? '' : (body.contentTranslated ?? ''),
      proverbExplanation: isProverbBody(body) ? body.explanation : '',
      proverbUsageExample: isProverbBody(body) ? body.usageExample : '',
      coverImageUrl: existing.coverImageUrl,
      audioUrl: existing.audioUrl,
      audioFileName: existing.audioFileName,
    });
  }, [existing]);

  const saving = creating || updating;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (form.type === 'proverb') {
      if (form.titleEnglish.trim().length < 1) next.titleEnglish = 'Proverb (English) is required';
      if (form.titleTranslated.trim().length < 1) {
        next.titleTranslated = `Proverb (${LANGUAGE_LABELS[form.language]}) is required`;
      }
      if (form.proverbExplanation.trim().length < 1) {
        next.proverbExplanation = 'Explanation/Context is required';
      }
    } else {
      if (form.titleEnglish.trim().length < 1) next.titleEnglish = 'Title is required';
    }
    return next;
  }

  async function handleSave(targetStatus: CulturalContentStatus) {
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    const payload = {
      type: form.type,
      language: form.language,
      tier: form.tier,
      titleEnglish: form.titleEnglish.trim(),
      titleTranslated: form.titleTranslated.trim(),
      shortDescription: form.shortDescription,
      body: bodyForType(form),
      coverImageUrl: form.coverImageUrl,
      audioUrl: form.audioUrl,
      audioFileName: form.audioFileName,
      status: targetStatus,
    };
    try {
      if (isEditing && id) {
        await updateItem({ id, ...payload }).unwrap();
      } else {
        const created = await createItem(payload).unwrap();
        toast.success(
          targetStatus === 'published'
            ? 'Content created and published'
            : 'Content created as draft',
        );
        navigate(`/cultural-content/${created.id}/edit`, { replace: true });
        return;
      }
      toast.success(
        targetStatus === 'published' ? 'Content updated and published' : 'Content saved as draft',
      );
    } catch (err) {
      const e = err as { data?: { message?: string | string[] } };
      const msg = Array.isArray(e.data?.message) ? e.data?.message[0] : e.data?.message;
      const errorMessage = msg ?? 'Could not save content. Please try again.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    }
  }

  if (id && loadingItem) {
    return <div className="p-8 text-neutral-variant">Loading content…</div>;
  }

  const langLabel = LANGUAGE_LABELS[form.language];
  const isProverb = form.type === 'proverb';

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link
          to="/cultural-content"
          className="rounded-md border border-border bg-white p-2 text-neutral hover:bg-neutral-soft"
          aria-label="Back to cultural content"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <PageHeader
            title={isEditing ? 'Edit cultural content' : 'Add cultural content'}
            subtitle="Create, manage and organize cultural content for LexiRoot learners."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <CulturalContentTypePicker
            value={form.type}
            onChange={(t) => update('type', t)}
            disabled={isEditing}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Language" required>
              <NativeSelect
                value={form.language}
                onChange={(v) => update('language', v as LanguageCode)}
                options={LANGUAGE_CODES.map((c) => ({ value: c, label: LANGUAGE_LABELS[c] }))}
              />
            </Field>
            <Field label="Level" required>
              <NativeSelect
                value={form.tier}
                onChange={(v) => update('tier', v as LearningLevel)}
                options={LEARNING_LEVELS.map((l) => ({
                  value: l,
                  label: LEARNING_LEVEL_LABELS[l],
                }))}
              />
            </Field>
          </div>

          <section className="rounded-2xl border border-border bg-white p-5">
            <header className="mb-4">
              <h2 className="font-display text-base font-bold text-neutral">Content Details</h2>
            </header>

            {isProverb ? (
              <ProverbFields
                form={form}
                langLabel={langLabel}
                errors={errors}
                update={update}
                isYoruba={form.language === 'yo'}
              />
            ) : (
              <StoryFields
                form={form}
                langLabel={langLabel}
                errors={errors}
                update={update}
                isYoruba={form.language === 'yo'}
              />
            )}
          </section>

          {errors.general ? (
            <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {errors.general}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/cultural-content"
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
                {saving ? 'Saving…' : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save & Continue →'}
              </button>
            </div>
          </div>
        </div>

        <CulturalContentMediaPanel
          coverImageUrl={form.coverImageUrl}
          audioUrl={form.audioUrl}
          audioFileName={form.audioFileName}
          audioLanguageLabel={langLabel}
          onCoverImageChange={(url) => update('coverImageUrl', url)}
          onAudioChange={({ url, fileName }) => {
            setForm((s) => ({ ...s, audioUrl: url, audioFileName: fileName }));
          }}
        />
      </div>
    </div>
  );
}

interface FieldsProps {
  form: FormState;
  langLabel: string;
  errors: FieldErrors;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  isYoruba: boolean;
}

function StoryFields({ form, langLabel, errors, update, isYoruba }: FieldsProps) {
  return (
    <>
      <Field label="Title (English)" required error={errors.titleEnglish}>
        <CountedInput
          value={form.titleEnglish}
          onChange={(v) => update('titleEnglish', v)}
          placeholder="Enter title in English"
          maxLength={TITLE_MAX}
        />
      </Field>

      <Field label={`Title (${langLabel})`} className="mt-4">
        {isYoruba ? <YorubaShortcutsHelp /> : null}
        <YorubaOrPlainInput
          enabled={isYoruba}
          value={form.titleTranslated}
          onChange={(v) => update('titleTranslated', v)}
          placeholder={`Enter title in ${langLabel}`}
          maxLength={TITLE_MAX}
        />
      </Field>

      <Field label="Short Description" className="mt-4">
        <CountedInput
          value={form.shortDescription}
          onChange={(v) => update('shortDescription', v)}
          placeholder="Write a short summary of the content…"
          maxLength={SHORT_DESC_MAX}
        />
      </Field>

      <Field label="Content (English)" className="mt-4">
        <RichTextArea
          value={form.storyContentEnglish}
          onChange={(v) => update('storyContentEnglish', v)}
          placeholder="Write or paste the content in English"
          maxLength={5000}
        />
      </Field>

      <Field label={`Content (${langLabel})`} className="mt-4">
        {isYoruba ? <YorubaShortcutsHelp /> : null}
        <RichTextArea
          value={form.storyContentTranslated}
          onChange={(v) => update('storyContentTranslated', v)}
          placeholder={`Write or paste the content in ${langLabel}`}
          maxLength={5000}
          yoruba={isYoruba}
        />
      </Field>
    </>
  );
}

function ProverbFields({ form, langLabel, errors, update, isYoruba }: FieldsProps) {
  return (
    <>
      <Field label="Proverb (English)" required error={errors.titleEnglish}>
        <CountedInput
          value={form.titleEnglish}
          onChange={(v) => update('titleEnglish', v)}
          placeholder="Enter the proverb in English"
          maxLength={PROVERB_MAX}
        />
      </Field>

      <Field
        label={`Proverb (${langLabel})`}
        required
        error={errors.titleTranslated}
        className="mt-4"
      >
        {isYoruba ? <YorubaShortcutsHelp /> : null}
        <YorubaOrPlainInput
          enabled={isYoruba}
          value={form.titleTranslated}
          onChange={(v) => update('titleTranslated', v)}
          placeholder={`Enter the proverb in ${langLabel}`}
          maxLength={PROVERB_MAX}
        />
      </Field>

      <Field
        label="Explanation/Context"
        required
        error={errors.proverbExplanation}
        className="mt-4"
      >
        <YorubaOrPlainInput
          enabled={isYoruba}
          value={form.proverbExplanation}
          onChange={(v) => update('proverbExplanation', v)}
          placeholder="Explain the meaning and when to use the proverb"
          maxLength={EXPLANATION_MAX}
        />
      </Field>

      <Field label="Usage example (Optional)" className="mt-4">
        <YorubaOrPlainTextarea
          enabled={isYoruba}
          value={form.proverbUsageExample}
          onChange={(v) => update('proverbUsageExample', v)}
          placeholder="Provide an example sentence or situation where this proverb is used"
          maxLength={USAGE_MAX}
          rows={4}
        />
      </Field>
    </>
  );
}

function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-neutral">
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}

function CountedInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  maxLength: number;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-border bg-white pl-3 pr-16 text-sm text-neutral outline-none placeholder:text-neutral-variant focus:border-primary"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-variant">
        {value.length}/{maxLength}
      </span>
    </div>
  );
}

function YorubaOrPlainInput({
  enabled,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  enabled: boolean;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  maxLength: number;
}) {
  if (!enabled) {
    return (
      <CountedInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    );
  }
  return (
    <div>
      <YorubaInput
        value={value}
        onChange={(v) => onChange(v.slice(0, maxLength))}
        placeholder={placeholder}
        inputClassName="h-11 w-full rounded-lg border border-border bg-white pl-3 pr-3 text-sm text-neutral outline-none placeholder:text-neutral-variant focus:border-primary"
      />
      <div className="mt-1 text-right text-[11px] text-neutral-variant">
        {value.length}/{maxLength}
      </div>
    </div>
  );
}

function YorubaOrPlainTextarea({
  enabled,
  value,
  onChange,
  placeholder,
  maxLength,
  rows,
}: {
  enabled: boolean;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  maxLength: number;
  rows: number;
}) {
  if (!enabled) {
    return (
      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          className="w-full resize-y rounded-lg border border-border bg-white p-3 pr-16 text-sm text-neutral outline-none placeholder:text-neutral-variant focus:border-primary"
        />
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-neutral-variant">
          {value.length}/{maxLength}
        </span>
      </div>
    );
  }
  return (
    <div>
      <YorubaInput
        multiline
        rows={rows}
        value={value}
        onChange={(v) => onChange(v.slice(0, maxLength))}
        placeholder={placeholder}
        inputClassName="w-full resize-y rounded-lg border border-border bg-white p-3 text-sm text-neutral outline-none placeholder:text-neutral-variant focus:border-primary"
      />
      <div className="mt-1 text-right text-[11px] text-neutral-variant">
        {value.length}/{maxLength}
      </div>
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-9 text-sm text-neutral outline-none focus:border-primary"
      >
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
