import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Mail, User } from 'lucide-react';
import type { CountryCode } from '@lexiroot/shared';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { CountrySelect } from '../components/ui/CountrySelect';
import { SectionCard } from '../components/ui/SectionCard';
import { TextField } from '../components/ui/TextField';
import { useSignAvatarUploadMutation, useUpdateMeMutation } from '../services/authApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { adminAuthStorage } from '../utils/storage';
import { uploadAvatarToCloudinary } from '../utils/cloudinary';

interface EmailPrefs {
  securityAlerts: boolean;
  weeklyReports: boolean;
}

interface FormErrors {
  displayName?: string;
  email?: string;
  general?: string;
}

const DEFAULT_COUNTRY: CountryCode = 'NG';

export function ManageAccountPage() {
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);
  const dispatch = useAppDispatch();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [signAvatarUpload] = useSignAvatarUploadMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initialCountry: CountryCode = user?.country ?? DEFAULT_COUNTRY;

  const [fullName, setFullName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [country, setCountry] = useState<CountryCode>(initialCountry);
  const [prefs, setPrefs] = useState<EmailPrefs>({
    securityAlerts: false,
    weeklyReports: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Re-seed when the cached user changes (e.g. after first /auth/me load).
  useEffect(() => {
    if (!user) return;
    setFullName(user.displayName);
    setEmail(user.email);
    setCountry(user.country ?? DEFAULT_COUNTRY);
  }, [user]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const next: FormErrors = {};
    if (fullName.trim().length < 2) next.displayName = 'Please enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Please enter a valid email address';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      const result = await updateMe({
        displayName: fullName.trim(),
        email: email.trim().toLowerCase(),
        country,
      }).unwrap();
      if (token) {
        adminAuthStorage.set({ token, user: result });
        dispatch(setCredentials({ token, user: result }));
      }
      setSavedAt(Date.now());
    } catch (err) {
      const e2 = err as { status?: number; data?: { message?: string | string[] } };
      if (e2.status === 409) {
        setErrors({ email: 'Email already in use' });
        return;
      }
      const msg = e2.data?.message;
      if (Array.isArray(msg)) {
        const fieldErrors: FormErrors = {};
        msg.forEach((m) => {
          const lower = m.toLowerCase();
          if (lower.includes('email')) fieldErrors.email = m;
          else if (lower.includes('displayname')) fieldErrors.displayName = m;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Could not save changes. Please try again.' });
      }
    }
  }

  async function handleAvatarFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingAvatar(true);
    try {
      const signature = await signAvatarUpload().unwrap();
      const url = await uploadAvatarToCloudinary(file, signature);
      const result = await updateMe({ avatarUrl: url }).unwrap();
      adminAuthStorage.set({ token, user: result });
      dispatch(setCredentials({ token, user: result }));
    } catch {
      setErrors({ general: 'Could not update photo. Please try again.' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const showSavedToast = savedAt && Date.now() - savedAt < 4000;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Account"
        subtitle="View and update your account information and preference."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form className="space-y-6 lg:col-span-2" onSubmit={handleSave}>
          <SectionCard
            icon={<User size={18} />}
            title="Account Information"
            subtitle="Update your personal information and contact details"
          >
            <div className="space-y-4">
              <TextField
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                error={errors.displayName}
              />
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                error={errors.email}
              />
              <CountrySelect label="Country" value={country} onChange={setCountry} />
              {errors.general ? (
                <p className="text-xs font-medium text-error">{errors.general}</p>
              ) : null}
              <div className="flex items-center gap-3">
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
                {showSavedToast ? (
                  <span className="text-xs font-semibold text-success">Saved.</span>
                ) : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Mail size={18} />}
            title="Email Preferences"
            subtitle="Choose what emails you want to receive."
          >
            <div className="space-y-4">
              <Checkbox
                checked={prefs.securityAlerts}
                onChange={(v) => setPrefs((p) => ({ ...p, securityAlerts: v }))}
                label="Security Alerts"
                description="Get notified about important security events"
              />
              <Checkbox
                checked={prefs.weeklyReports}
                onChange={(v) => setPrefs((p) => ({ ...p, weeklyReports: v }))}
                label="Weekly Reports"
                description="Receive weekly summary of platform activity."
              />
            </div>
          </SectionCard>
        </form>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-base font-bold text-neutral">Profile</h2>
            <p className="mt-0.5 text-xs text-neutral-variant">This is how your profile appears</p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar name={user?.displayName ?? 'Admin'} size={96} src={user?.avatarUrl} />
                {uploadingAvatar ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarFile}
              />
              <Button
                type="button"
                variant="secondary"
                className="border-primary text-primary"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
              </Button>
              <p className="text-center text-[11px] text-neutral-variant">
                WEBP, PNG, JPEG Max size: 2MB
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
