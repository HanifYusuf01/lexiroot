import { PROVIDER_TEXT, type PlanProviderSync } from '@lexiroot/shared';
import { formatCurrency } from './format';

type Tone = 'success' | 'warning' | 'error' | 'neutral';

export interface PlanSyncPresentation {
  tone: Tone;
  /** Badge text, e.g. "Live on Stripe". */
  label: string;
  /** Sync-button text. */
  action: string;
  /** Whether the button should read as a call to action rather than a refresh. */
  urgent: boolean;
  /** Extra context shown under the badge, when there's something to explain. */
  hint: string | null;
}

/**
 * How a plan's provider sync state should read in the admin UI.
 *
 * `out_of_date` is tone `error`, not `warning`: an unsynced plan fails loudly at
 * checkout, but a drifted one quietly charges the *old* price. The silent bug is
 * the more dangerous one, so it gets the louder colour.
 */
export function planSyncPresentation(sync: PlanProviderSync): PlanSyncPresentation {
  const provider = PROVIDER_TEXT[sync.provider];

  switch (sync.state) {
    case 'synced':
      return {
        tone: 'success',
        label: `Live on ${provider}`,
        action: 'Re-sync',
        urgent: false,
        hint: null,
      };
    case 'not_synced':
      return {
        tone: 'warning',
        label: `Not on ${provider}`,
        action: `Sync to ${provider}`,
        urgent: true,
        hint: 'Learners cannot buy this plan yet.',
      };
    case 'out_of_date':
      return {
        tone: 'error',
        label: 'Price out of date',
        action: `Re-sync to ${provider}`,
        urgent: true,
        hint: outOfDateHint(sync, provider),
      };
  }
}

function outOfDateHint(sync: PlanProviderSync, provider: string): string {
  const currency = sync.currency ?? 'USD';
  const charging =
    sync.syncedAmountMinor === null
      ? 'an old price'
      : formatCurrency(sync.syncedAmountMinor / 100, currency);
  const expected = formatCurrency(sync.expectedAmountMinor / 100, currency);
  return `${provider} still charges ${charging}, not ${expected}.`;
}
