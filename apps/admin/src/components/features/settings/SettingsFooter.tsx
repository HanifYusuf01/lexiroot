import { Button } from '../../ui/Button';

interface SettingsFooterProps {
  dirty: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function SettingsFooter({ dirty, saving, onCancel, onSave }: SettingsFooterProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-10 flex items-center justify-end gap-3 border-t border-border bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <Button variant="secondary" onClick={onCancel} disabled={!dirty || saving}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={!dirty} loading={saving}>
        Save Changes
      </Button>
    </div>
  );
}
