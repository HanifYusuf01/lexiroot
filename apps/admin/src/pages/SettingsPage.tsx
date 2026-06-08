import { useState } from 'react';
import { Bell, CreditCard, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { GeneralTab } from '../components/features/settings/GeneralTab';
import { NotificationTab } from '../components/features/settings/NotificationTab';
import { SecurityPrivacyTab } from '../components/features/settings/SecurityPrivacyTab';
import { SubscriptionBillingTab } from '../components/features/settings/SubscriptionBillingTab';

type TabKey = 'general' | 'notification' | 'billing' | 'security';

const TABS: { key: TabKey; label: string; icon: typeof Bell }[] = [
  { key: 'general', label: 'General', icon: SlidersHorizontal },
  { key: 'notification', label: 'Notification', icon: Bell },
  { key: 'billing', label: 'Subscription & Billing', icon: CreditCard },
  { key: 'security', label: 'Security and Privacy', icon: ShieldCheck },
];

export function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('general');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your platform preferences and configuration."
      />

      <nav className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-variant hover:text-neutral'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {tab === 'general' ? <GeneralTab /> : null}
      {tab === 'notification' ? <NotificationTab /> : null}
      {tab === 'billing' ? <SubscriptionBillingTab /> : null}
      {tab === 'security' ? <SecurityPrivacyTab /> : null}
    </div>
  );
}
