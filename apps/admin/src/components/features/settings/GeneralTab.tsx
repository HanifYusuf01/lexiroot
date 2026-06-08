import { useState } from 'react';
import { TEACHING_LANGUAGE_STATUS_LABELS, type TeachingLanguage } from '@lexiroot/shared';
import { Badge } from '../../ui/Badge';
import { TextField } from '../../ui/TextField';
import {
  useCreateTeachingLanguageMutation,
  useTeachingLanguagesQuery,
} from '../../../services/languagesApi';
import { usePlatformSettingsDraft } from '../../../hooks/usePlatformSettingsDraft';
import { formatNumber } from '../../../utils/format';
import { AddLanguageModal } from './AddLanguageModal';
import { SettingRow } from './SettingRow';
import { SettingsFooter } from './SettingsFooter';

function LanguageCard({ language }: { language: TeachingLanguage }) {
  const connected = language.status === 'connected';
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral">{language.name}</h3>
        <Badge tone={connected ? 'success' : 'warning'}>
          {connected ? 'Connected' : 'Draft'}
        </Badge>
      </div>
      <div className="mt-3 space-y-0.5 text-xs text-neutral-variant">
        <p>
          {connected
            ? `${formatNumber(language.learners)} learners`
            : TEACHING_LANGUAGE_STATUS_LABELS[language.status]}
        </p>
        <p>{formatNumber(language.lessons)} Lessons</p>
      </div>
      <button
        type="button"
        className="mt-3 rounded-lg border border-primary px-4 py-1.5 text-xs font-bold text-primary transition hover:bg-primary-soft"
      >
        Edit
      </button>
    </div>
  );
}

export function GeneralTab() {
  const { draft, isLoading, saving, dirty, savedAt, set, save, reset } = usePlatformSettingsDraft();
  const { data: languages = [] } = useTeachingLanguagesQuery();
  const [createLanguage, { isLoading: creating }] = useCreateTeachingLanguageMutation();
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading || !draft) {
    return <div className="py-16 text-center text-sm text-neutral-variant">Loading settings…</div>;
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
            onChange={(e) => set('platformName', e.target.value)}
          />
          <TextField
            label="Platform Tagline"
            value={draft.platformTagline}
            onChange={(e) => set('platformTagline', e.target.value)}
          />
          <TextField
            label="Admin Email"
            type="email"
            value={draft.adminEmail}
            onChange={(e) => set('adminEmail', e.target.value)}
          />
          <TextField
            label="Support email"
            type="email"
            value={draft.supportEmail}
            onChange={(e) => set('supportEmail', e.target.value)}
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
            onClick={() => setAddOpen(true)}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            Add Language
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((language) => (
            <LanguageCard key={language.id} language={language} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-bold text-neutral">Maintenance mode</h2>
        <p className="mt-0.5 text-xs text-neutral-variant">
          Temporarily take the platform offline for learners
        </p>
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border px-5">
          <SettingRow
            label="Enable maintenance mode"
            description="Learners will see a maintenance page. Admin access remains active."
            checked={draft.maintenanceMode}
            onChange={(v) => set('maintenanceMode', v)}
          />
          <SettingRow
            label="Show estimated downtime message"
            description="Display a message or countdown on the maintenance page"
            checked={draft.showDowntimeMessage}
            onChange={(v) => set('showDowntimeMessage', v)}
          />
        </div>
      </section>

      <SettingsFooter
        dirty={dirty}
        saving={saving}
        saved={savedAt !== null}
        onCancel={reset}
        onSave={save}
      />

      <AddLanguageModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        saving={creating}
        onCreate={async (values) => {
          await createLanguage(values).unwrap();
        }}
      />
    </div>
  );
}
