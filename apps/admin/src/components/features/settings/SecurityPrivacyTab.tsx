import {
  ADMIN_SESSION_TIMEOUTS,
  ADMIN_SESSION_TIMEOUT_LABELS,
  type AdminSessionTimeout,
} from '@lexiroot/shared';
import { SelectMenu } from '../../ui/SelectMenu';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/Toast';
import { usePlatformSettingsDraft } from '../../../hooks/usePlatformSettingsDraft';
import { SettingRow } from './SettingRow';
import { SettingsFooter } from './SettingsFooter';

const TIMEOUT_OPTIONS = ADMIN_SESSION_TIMEOUTS.map((value) => ({
  value,
  label: ADMIN_SESSION_TIMEOUT_LABELS[value],
}));

export function SecurityPrivacyTab() {
  const toast = useToast();
  const { draft, isLoading, saving, dirty, set, save, reset } = usePlatformSettingsDraft();

  async function handleSave() {
    await save();
    toast.success('Settings saved');
  }

  if (isLoading || !draft) {
    return <div className="py-16 text-center text-sm text-neutral-variant">Loading settings…</div>;
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-base font-bold text-neutral">Authentication</h2>
        <p className="mt-0.5 text-xs text-neutral-variant">Secure admin and learner access</p>
        {/*
          Note: we intentionally do NOT expose session revocation / "force logout"
          controls. Forcibly ending a learner's active session can break their
          daily streak, so by policy we never revoke active sessions here.
        */}
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border px-5">
          <SettingRow
            label="Two-factor authentication (2FA)"
            description="Require 2FA for admin accounts"
            checked={draft.twoFactorAuth}
            onChange={(v) => set('twoFactorAuth', v)}
          />
          <SettingRow
            label="Single sign-on (SSO)"
            description="Allow admin login via Google Workspace"
            checked={draft.singleSignOn}
            onChange={(v) => set('singleSignOn', v)}
          />
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-neutral">Admin session timeout</label>
              <SelectMenu
                value={draft.adminSessionTimeout}
                options={TIMEOUT_OPTIONS}
                onChange={(v: AdminSessionTimeout) => set('adminSessionTimeout', v)}
                align="left"
              />
            </div>
            <TextField
              label="Max failed login attempts"
              type="number"
              min={1}
              max={10}
              value={draft.maxFailedLoginAttempts}
              onChange={(e) => set('maxFailedLoginAttempts', Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <SettingsFooter dirty={dirty} saving={saving} onCancel={reset} onSave={handleSave} />
    </div>
  );
}
