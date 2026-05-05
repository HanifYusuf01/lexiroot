import { ReactNode } from 'react';
import { BookOpen, Crown, Flame, Zap } from 'lucide-react';
import { LANGUAGE_LABELS, LEARNING_LEVEL_LABELS } from '@lexiroot/shared';
import { Modal } from '../../ui/Modal';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { UserRow } from '../../../services/usersApi';
import { formatDate, formatNumber, formatRelative } from '../../../utils/format';

interface Props {
  user: UserRow | null;
  onClose: () => void;
}

interface StatTileProps {
  label: string;
  value: string;
  icon: ReactNode;
  tint: string;
}

function StatTile({ label, value, icon, tint }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-12 items-center justify-center rounded-sm"
          style={{ backgroundColor: tint }}
        >
          {icon}
        </span>
        <span className="text-[8px] font-normal uppercase tracking-wide text-neutral-variant">
          {label}
        </span>
      </div>
      <div className="mt-1 text-lg font-extrabold text-neutral">{value}</div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-neutral-variant">{label}</span>
      <span className="font-semibold text-neutral">{value}</span>
    </div>
  );
}

interface ActivityRowProps {
  icon: ReactNode;
  description: string;
  timestamp: string;
}

function ActivityRow({ icon, description, timestamp }: ActivityRowProps) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <div className="flex items-center gap-3 text-neutral">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-soft">
          {icon}
        </span>
        <span>{description}</span>
      </div>
      <span className="text-neutral-variant">{timestamp}</span>
    </div>
  );
}

export function UserOverviewModal({ user, onClose }: Props) {
  return (
    <Modal open={!!user} onClose={onClose} size="lg">
      {user ? (
        <div>
          <h2 className="font-display text-lg font-bold text-neutral">User Overview</h2>

          <div className="mt-5 flex items-start gap-4 rounded-2xl border border-border p-4">
            <Avatar name={user.displayName} size={72} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-neutral">{user.displayName}</span>
                {user.isActive ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="error">Inactive</Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-neutral-variant">
                Mail: <span className="text-neutral">{user.email}</span>
              </div>
              <div className="text-sm text-neutral-variant">
                Language: {user.language ? LANGUAGE_LABELS[user.language] : '—'}
              </div>
              <div className="text-sm text-neutral-variant">
                Date Joined: {formatDate(user.createdAt)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Total XP"
              value={formatNumber(user.xp)}
              icon={<Zap size={14} className="text-success" />}
              tint="#E9F9EF"
            />
            <StatTile
              label="Level"
              value={user.level ? LEARNING_LEVEL_LABELS[user.level] : '—'}
              icon={<Crown size={14} className="text-tertiary" />}
              tint="#FFF4D5"
            />
            <StatTile
              label="Current Streak"
              value={String(user.currentStreakDays)}
              icon={<Flame size={14} className="text-error" />}
              tint="#FCDADA"
            />
            <StatTile
              label="Lessons Completed"
              value={String(user.lessonsCompleted)}
              icon={<BookOpen size={14} className="text-accent" />}
              tint="#E5E4FF"
            />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-neutral">Additional Details</h3>
            <div className="mt-2 rounded-xl border border-border px-4">
              <DetailRow label="Account Type" value="Premium" />
              <DetailRow label="Last Active" value={formatRelative(user.lastActiveAt)} />
              <DetailRow label="Location" value="Nigeria" />
              <DetailRow
                label="Role"
                value={<span className="capitalize">{user.role}</span>}
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-neutral">Recent Activity</h3>
            <div className="mt-2 rounded-xl border border-border px-4">
              <ActivityRow
                icon={<BookOpen size={14} className="text-accent" />}
                description='Completed lesson "Greetings & Introductions"'
                timestamp="Today, 9:42 AM"
              />
              <ActivityRow
                icon={<Zap size={14} className="text-success" />}
                description="Earned 50 XP"
                timestamp="Today, 9:40 AM"
              />
              <ActivityRow
                icon={<Flame size={14} className="text-error" />}
                description="Maintained a 15-Day Streak"
                timestamp="Yesterday, 9:15 PM"
              />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
