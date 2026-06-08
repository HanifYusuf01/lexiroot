import { FormEvent, useState } from 'react';
import { Languages } from 'lucide-react';
import {
  TEACHING_LANGUAGE_STATUSES,
  type CreateTeachingLanguage,
  type TeachingLanguageStatus,
} from '@lexiroot/shared';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { SelectMenu } from '../../ui/SelectMenu';
import { TextField } from '../../ui/TextField';

interface AddLanguageModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (values: CreateTeachingLanguage) => Promise<void>;
  saving: boolean;
}

const STATUS_OPTIONS = TEACHING_LANGUAGE_STATUSES.map((value) => ({
  value,
  label: value === 'in-development' ? 'In Development' : value === 'connected' ? 'Connected' : 'Draft',
}));

export function AddLanguageModal({ open, onClose, onCreate, saving }: AddLanguageModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<TeachingLanguageStatus>('draft');
  const [error, setError] = useState<string | undefined>();

  function handleClose() {
    setName('');
    setCode('');
    setStatus('draft');
    setError(undefined);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Please enter a language name');
      return;
    }
    if (!/^[a-z]{2,3}$/.test(code.trim().toLowerCase())) {
      setError('Code must be a 2–3 letter ISO code (e.g. ig)');
      return;
    }
    try {
      await onCreate({ name: name.trim(), code: code.trim().toLowerCase(), status });
      handleClose();
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'data' in err
          ? ((err as { data?: { message?: string } }).data?.message ?? 'Could not add language')
          : 'Could not add language';
      setError(message);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Languages size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-neutral">Add teaching language</h2>
            <p className="mt-0.5 text-xs text-neutral-variant">
              Make a new language available for learners to study.
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

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Add Language
          </Button>
        </div>
      </form>
    </Modal>
  );
}
