import type { ReactNode } from 'react';
import {
  REMINDER_TIME_ZONES,
  REMINDER_TIME_ZONE_LABELS,
  type ReminderTimeZone,
} from '@lexiroot/shared';
import { SelectMenu } from '../../ui/SelectMenu';
import { TextField } from '../../ui/TextField';
import { usePlatformSettingsDraft } from '../../../hooks/usePlatformSettingsDraft';
import { SettingRow } from './SettingRow';
import { SettingsFooter } from './SettingsFooter';

const TIME_ZONE_OPTIONS = REMINDER_TIME_ZONES.map((value) => ({
  value,
  label: REMINDER_TIME_ZONE_LABELS[value],
}));

function Group({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-neutral">{title}</h2>
      <p className="mt-0.5 text-xs text-neutral-variant">{subtitle}</p>
      <div className="mt-3 divide-y divide-border rounded-2xl border border-border px-5">{children}</div>
    </section>
  );
}

export function NotificationTab() {
  const { draft, isLoading, saving, dirty, savedAt, set, save, reset } = usePlatformSettingsDraft();

  if (isLoading || !draft) {
    return <div className="py-16 text-center text-sm text-neutral-variant">Loading settings…</div>;
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Group title="Push Notifications" subtitle="Sent directly to a user's mobile device">
            <SettingRow
              label="Daily streak Reminder"
              description="Remind users to keep their streak alive each day"
              checked={draft.dailyStreakReminder}
              onChange={(v) => set('dailyStreakReminder', v)}
            />
            <SettingRow
              label="Lesson available Reminder"
              description="Notify learners when a new lesson is published"
              checked={draft.lessonAvailableReminder}
              onChange={(v) => set('lessonAvailableReminder', v)}
            />
            <SettingRow
              label="Achievements & badge alerts"
              description="Celebrate when a learner earns a badge or levels up"
              checked={draft.achievementBadgeAlerts}
              onChange={(v) => set('achievementBadgeAlerts', v)}
            />
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <TextField
                label="Default reminder time"
                type="time"
                value={draft.defaultReminderTime}
                onChange={(e) => set('defaultReminderTime', e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-neutral">Reminder time-zone</label>
                <SelectMenu
                  value={draft.reminderTimeZone}
                  options={TIME_ZONE_OPTIONS}
                  onChange={(v: ReminderTimeZone) => set('reminderTimeZone', v)}
                  align="left"
                />
              </div>
            </div>
          </Group>

          <Group title="System & admin alerts" subtitle="Sent to platform administrators">
            <SettingRow
              label="Critical error alerts"
              description="Instant notification when a system error occurs"
              checked={draft.criticalErrorAlerts}
              onChange={(v) => set('criticalErrorAlerts', v)}
            />
            <SettingRow
              label="Payment failure alerts"
              description="Instant email when a subscription payment fails"
              checked={draft.paymentFailureAlerts}
              onChange={(v) => set('paymentFailureAlerts', v)}
            />
          </Group>
        </div>

        <Group title="Email notifications" subtitle="Automated emails sent to learners">
          <SettingRow
            label="Welcome email"
            description="Sent immediately after a user registers"
            checked={draft.welcomeEmail}
            onChange={(v) => set('welcomeEmail', v)}
          />
          <SettingRow
            label="Subscription confirmation"
            description="Sent when a user upgrades to Premium"
            checked={draft.subscriptionConfirmation}
            onChange={(v) => set('subscriptionConfirmation', v)}
          />
          <SettingRow
            label="Password reset emails"
            description="Triggered when a user requests a password reset"
            checked={draft.passwordResetEmails}
            onChange={(v) => set('passwordResetEmails', v)}
          />
          <SettingRow
            label="Inactivity re-engagement"
            description="Email users who haven't logged in for 7+ days"
            checked={draft.inactivityReengagement}
            onChange={(v) => set('inactivityReengagement', v)}
          />
        </Group>
      </div>

      <SettingsFooter
        dirty={dirty}
        saving={saving}
        saved={savedAt !== null}
        onCancel={reset}
        onSave={save}
      />
    </div>
  );
}
