import { useState } from 'react';
import {
  COUNTRIES,
  TEACHING_LANGUAGE_STATUS_LABELS,
  type CountryCode,
  type TeachingLanguage,
} from '@lexiroot/shared';
import { Badge } from '../../ui/Badge';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/Toast';
import {
  useCreateTeachingLanguageMutation,
  useDeleteTeachingLanguageMutation,
  useTeachingLanguagesQuery,
  useUpdateTeachingLanguageMutation,
} from '../../../services/languagesApi';
import { usePlatformSettingsDraft } from '../../../hooks/usePlatformSettingsDraft';
import { formatNumber } from '../../../utils/format';
import { LanguageForm, type LanguageDraft } from './LanguageForm';
import { SettingsFooter } from './SettingsFooter';

function LanguageCard({
  language,
  onEdit,
}: {
  language: TeachingLanguage;
  onEdit: (language: TeachingLanguage) => void;
}) {
  const connected = language.status === 'connected';
  const country = COUNTRIES[language.country as CountryCode];
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral">{language.name}</h3>
        <Badge tone={connected ? 'success' : 'warning'}>
          {connected ? 'Connected' : 'Draft'}
        </Badge>
      </div>
      {country ? (
        <p className="mt-1 text-xs text-neutral-variant">
          {country.flag} {country.name}
        </p>
      ) : null}
      <div className="mt-3 space-y-0.5 text-xs text-neutral-variant">
        <p className='font-bold'>
          {connected
            ? `${formatNumber(language.learners)} learners`
            : TEACHING_LANGUAGE_STATUS_LABELS[language.status]}
        </p>
        <p>{formatNumber(language.lessons)} Lessons</p>
      </div>
      <button
        type="button"
        onClick={() => onEdit(language)}
        className="mt-3 rounded-lg border border-primary px-4 py-1.5 text-xs font-bold text-primary transition hover:bg-primary-soft"
      >
        Edit
      </button>
    </div>
  );
}

const EMPTY_DRAFT: LanguageDraft = {
  mode: 'add',
  name: '',
  code: '',
  country: null,
  status: 'draft',
};

function validateDraft(draft: LanguageDraft): string | undefined {
  if (draft.name.trim().length < 2) return 'Please enter a language name';
  if (!/^[a-z]{2,3}$/.test(draft.code.trim().toLowerCase())) {
    return 'Code must be a 2–3 letter ISO code (e.g. ig)';
  }
  if (!draft.country) return 'Please select a country';
  return undefined;
}

function errorMessage(err: unknown): string {
  if (typeof err === 'object' && err && 'data' in err) {
    return (err as { data?: { message?: string } }).data?.message ?? 'Could not save language';
  }
  return 'Could not save language';
}

export function GeneralTab() {
  const toast = useToast();
  const settings = usePlatformSettingsDraft();
  const { data: languages = [] } = useTeachingLanguagesQuery();
  const [createLanguage, { isLoading: creating }] = useCreateTeachingLanguageMutation();
  const [updateLanguage, { isLoading: updating }] = useUpdateTeachingLanguageMutation();
  const [deleteLanguage, { isLoading: deleting }] = useDeleteTeachingLanguageMutation();

  const [langDraft, setLangDraft] = useState<LanguageDraft | null>(null);
  const [langError, setLangError] = useState<string | undefined>();

  if (settings.isLoading || !settings.draft) {
    return <div className="py-16 text-center text-sm text-neutral-variant">Loading settings…</div>;
  }

  const draft = settings.draft;

  function setSetting<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    settings.set(key as never, value as never);
  }

  function patchLanguage(patch: Partial<LanguageDraft>) {
    setLangDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setLangError(undefined);
  }

  function toggleAdd() {
    setLangError(undefined);
    setLangDraft((prev) => (prev && prev.mode === 'add' ? null : { ...EMPTY_DRAFT }));
  }

  function openEdit(language: TeachingLanguage) {
    setLangError(undefined);
    setLangDraft({
      mode: 'edit',
      id: language.id,
      name: language.name,
      code: language.code,
      country: language.country as CountryCode,
      status: language.status,
    });
  }

  function isLanguageDirty(): boolean {
    if (!langDraft) return false;
    if (langDraft.mode === 'add') {
      return Boolean(langDraft.name.trim() || langDraft.code.trim() || langDraft.country);
    }
    const original = languages.find((l) => l.id === langDraft.id);
    if (!original) return true;
    return (
      langDraft.name !== original.name ||
      langDraft.code !== original.code ||
      langDraft.country !== original.country ||
      langDraft.status !== original.status
    );
  }

  const languageDirty = isLanguageDirty();
  const dirty = settings.dirty || languageDirty;
  const saving = settings.saving || creating || updating;

  async function handleSave() {
    if (langDraft && languageDirty) {
      const validation = validateDraft(langDraft);
      if (validation) {
        setLangError(validation);
        return;
      }
      const payload = {
        name: langDraft.name.trim(),
        code: langDraft.code.trim().toLowerCase(),
        country: langDraft.country as CountryCode,
        status: langDraft.status,
      };
      const wasAdd = langDraft.mode === 'add';
      try {
        if (wasAdd) {
          await createLanguage(payload).unwrap();
        } else {
          await updateLanguage({ id: langDraft.id!, changes: payload }).unwrap();
        }
        setLangDraft(null);
        setLangError(undefined);
        toast.success(wasAdd ? `${payload.name} added` : `${payload.name} updated`);
      } catch (err) {
        setLangError(errorMessage(err));
        return;
      }
    }

    if (settings.dirty) {
      await settings.save();
      toast.success('Settings saved');
    }
  }

  function handleCancel() {
    settings.reset();
    setLangDraft(null);
    setLangError(undefined);
  }

  async function handleDelete() {
    if (!langDraft?.id) return;
    const name = langDraft.name;
    try {
      await deleteLanguage(langDraft.id).unwrap();
      setLangDraft(null);
      setLangError(undefined);
      toast.success(`${name || 'Language'} deleted`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-base font-bold text-neutral">General settings</h2>
        <p className="mt-0.5 text-xs text-neutral-variant">
          Platform-wide identity and configuration
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField
            label="Platform Name"
            value={draft.platformName}
            onChange={(e) => setSetting('platformName', e.target.value)}
          />
          <TextField
            label="Platform Tagline"
            value={draft.platformTagline}
            onChange={(e) => setSetting('platformTagline', e.target.value)}
          />
          <TextField
            label="Admin Email"
            type="email"
            value={draft.adminEmail}
            onChange={(e) => setSetting('adminEmail', e.target.value)}
          />
          <TextField
            label="Support email"
            type="email"
            value={draft.supportEmail}
            onChange={(e) => setSetting('supportEmail', e.target.value)}
          />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral">Teaching languages</h2>
            <p className="mt-0.5 text-xs text-neutral-variant">
              Languages available for learners to study
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAdd}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            {langDraft?.mode === 'add' ? 'Close' : 'Add Language'}
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {languages.map((language) => (
            <LanguageCard key={language.id} language={language} onEdit={openEdit} />
          ))}
        </div>

        {langDraft ? (
          <LanguageForm
            draft={langDraft}
            onPatch={patchLanguage}
            error={langError}
            onClose={() => {
              setLangDraft(null);
              setLangError(undefined);
            }}
            onDelete={handleDelete}
            deleting={deleting}
          />
        ) : null}
      </section>

      <SettingsFooter
        dirty={dirty}
        saving={saving}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  );
}
