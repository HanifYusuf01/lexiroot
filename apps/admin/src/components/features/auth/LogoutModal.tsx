import { LogOut } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ open, onClose, onConfirm }: LogoutModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" showClose={false}>
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <LogOut size={22} />
        </div>
        <p className="text-base font-semibold text-neutral">Are you sure you want to log out?</p>
        <div className="flex w-full gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1 border-primary text-primary">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            Log Out
          </Button>
        </div>
      </div>
    </Modal>
  );
}
