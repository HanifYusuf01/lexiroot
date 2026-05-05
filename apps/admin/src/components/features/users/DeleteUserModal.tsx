import { Trash2 } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { useDeleteUserMutation, UserRow } from '../../../services/usersApi';

interface Props {
  user: UserRow | null;
  onClose: () => void;
}

export function DeleteUserModal({ user, onClose }: Props) {
  const [deleteUser, { isLoading }] = useDeleteUserMutation();

  async function handleConfirm() {
    if (!user) return;
    try {
      await deleteUser(user.id).unwrap();
      onClose();
    } catch {
      /* leave modal open; RTK Query holds the error if we want to surface it */
    }
  }

  return (
    <Modal open={!!user} onClose={onClose} size="sm" showClose={false}>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
          <Trash2 size={22} />
        </div>
        <p className="mt-4 text-sm text-neutral">
          This action will permanently remove{' '}
          <span className="font-bold">{user?.displayName}</span>'s account, learning progress, XP,
          streaks, and associated data.
        </p>
        <div className="mt-6 flex w-full gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-error hover:!bg-error/90"
            onClick={handleConfirm}
            loading={isLoading}
            type="button"
          >
            Delete User
          </Button>
        </div>
      </div>
    </Modal>
  );
}
