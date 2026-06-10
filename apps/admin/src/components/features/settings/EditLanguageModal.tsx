import { FormEvent, useEffect, useState } from 'react';
import { Languages, Trash2 } from 'lucide-react';
import {
  TEACHING_LANGUAGE_STATUSES,
  type TeachingLanguage,
  type TeachingLanguageStatus,
} from '@lexiroot/shared';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { SelectMenu } from '../../ui/SelectMenu';
import { TextField } from '../../ui/TextField';
import {
  useDeleteTeachingLanguageMutation,
  useUpdateTeachingLanguageMutation,
} from '../../../services/languagesApi';

interface EditLanguageModalProps {
  language: TeachingLanguage | null;
  onClose: () => void;
}

const STATUS_OPTIONS = TEACHING_LANGUAGE_STATUSES.map((value) => ({
  value,
  label:
    value === 'in-development' ? 'In Development' : value === 'connected' ? 'Connected' : 'Draft',
}));

function errorMessage(err: unknown): string {
  if (typeof err === 'object' && err && 'data' in err) {
    return (err as { data?: { message?: string } }).data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
}

export function EditLanguageModal({ language, onClose }: EditLanguageModalProps) {
  const [update, { isLoading: saving }] = useUpdateTeachingLanguageMutation();
  const [remove, { isLoading: deleting }] = useDeleteTeachingLanguageMutation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<TeachingLanguageStatus>('draft');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Re-seed the form whenever a different language is opened.
  useEffect(() => {
    if (!language) return;
    setName(language.name);
    setCode(language.code);
    setStatus(language.status);
    setConfirmDelete(false);
    setError(undefined);
  }, [language]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!language) return;
    if (name.trim().length < 2) {
      setError('Please enter a language name');
      return;
    }
    if (!/^[a-z]{2,3}$/.test(code.trim().toLowerCase())) {
      setError('Code must be a 2–3 letter ISO code (e.g. ig)');
      return;
    }
    try {
      await update({
        id: language.id,
        changes: { name: name.trim(), code: code.trim().toLowerCase(), status },
      }).unwrap();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDelete() {
    if (!language) return;
    try {
      await remove(language.id).unwrap();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal open={language !== null} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Languages size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-neutral">Edit teaching language</h2>
            <p className="mt-0.5 text-xs text-neutral-variant">
              Update the language details or remove it from the platform.
            </p>
          </div>
        </div>

        <TextField
          label="Language name"
          placeholder="e.g. Igbo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Language code"
          placeholder="e.g. ig"
          value={code}
          maxLength={3}
          onChange={(e) => setCode(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-neutral">Status</label>
          <SelectMenu value={status} options={STATUS_OPTIONS} onChange={setStatus} align="left" />
        </div>

        {error ? <p className="text-xs font-medium text-error">{error}</p> : null}

        <div className="flex items-center justify-between gap-3 pt-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-error">Delete this language?</span>
              <Button
                type="button"
                variant="ghost"
                className="!h-9 !px-3 !text-error"
                loading={deleting}
                onClick={handleDelete}
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

          <div className="ml-auto flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
