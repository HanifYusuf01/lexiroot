import { useState } from 'react';
import { Languages, Trash2, X } from 'lucide-react';
import {
  TEACHING_LANGUAGE_STATUSES,
  type CountryCode,
  type TeachingLanguageStatus,
} from '@lexiroot/shared';
import { Button } from '../../ui/Button';
import { CountrySelect } from '../../ui/CountrySelect';
import { SelectMenu } from '../../ui/SelectMenu';
import { TextField } from '../../ui/TextField';

export interface LanguageDraft {
  mode: 'add' | 'edit';
  id?: string;
  name: string;
  code: string;
  country: CountryCode | null;
  status: TeachingLanguageStatus;
}

interface LanguageFormProps {
  draft: LanguageDraft;
  onPatch: (patch: Partial<LanguageDraft>) => void;
  error?: string;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}

const STATUS_OPTIONS = TEACHING_LANGUAGE_STATUSES.map((value) => ({
  value,
  label:
    value === 'in-development' ? 'In Development' : value === 'connected' ? 'Connected' : 'Draft',
}));

export function LanguageForm({
  draft,
  onPatch,
  error,
  onClose,
  onDelete,
  deleting,
}: LanguageFormProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = draft.mode === 'edit';

  return (
    <div className="mt-4 flex flex-col gap-5 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Languages size={18} />
        </span>
        <div>
          <h3 className="text-base font-bold text-neutral">
            {isEdit ? 'Edit teaching language' : 'Add teaching language'}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-variant">
            {isEdit
              ? 'Update the language details, then use Save Changes to apply.'
              : 'Make a new language available for learners, then use Save Changes to apply.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-neutral-variant transition hover:bg-neutral-soft hover:text-neutral"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Language name"
          placeholder="e.g. Igbo"
          value={draft.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        <TextField
          label="Language code"
          placeholder="e.g. ig"
          value={draft.code}
          maxLength={3}
          onChange={(e) => onPatch({ code: e.target.value })}
        />
        <CountrySelect
          label="Country"
          value={draft.country}
          onChange={(country) => onPatch({ country })}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-neutral">Status</label>
          <SelectMenu
            value={draft.status}
            options={STATUS_OPTIONS}
            onChange={(status) => onPatch({ status })}
            align="left"
          />
        </div>
      </div>

      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}

      {isEdit ? (
        <div className="flex items-center border-t border-border pt-4">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-error">Delete this language?</span>
              <Button
                type="button"
                variant="ghost"
                className="!h-9 !px-3 !text-error"
                loading={deleting}
                onClick={onDelete}
              >
                Confirm
              </Button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-semibold text-neutral-variant hover:text-neutral"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-error hover:underline"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
