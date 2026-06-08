import { useEffect, useState } from 'react';
import type { PlatformSettings, UpdatePlatformSettings } from '@lexiroot/shared';
import {
  usePlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
} from '../services/platformSettingsApi';

/** Fields the admin can edit (everything except the server-managed timestamp). */
type EditableKey = keyof Omit<PlatformSettings, 'updatedAt'>;

function computeChanges(
  draft: PlatformSettings,
  base: PlatformSettings,
): UpdatePlatformSettings {
  const changes: UpdatePlatformSettings = {};
  (Object.keys(draft) as (keyof PlatformSettings)[]).forEach((key) => {
    if (key === 'updatedAt') return;
    if (draft[key] !== base[key]) {
      (changes as Record<string, unknown>)[key] = draft[key];
    }
  });
  return changes;
}

/**
 * Loads platform settings, holds a local editable draft, and saves only the
 * fields that actually changed. Shared by the General, Notification and
 * Security tabs, which each edit a different slice of the same settings row.
 */
export function usePlatformSettingsDraft() {
  const { data, isLoading } = usePlatformSettingsQuery();
  const [update, { isLoading: saving }] = useUpdatePlatformSettingsMutation();
  const [draft, setDraft] = useState<PlatformSettings | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  function set<K extends EditableKey>(key: K, value: PlatformSettings[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSavedAt(null);
  }

  const changes = draft && data ? computeChanges(draft, data) : {};
  const dirty = Object.keys(changes).length > 0;

  async function save() {
    if (!dirty) return;
    await update(changes).unwrap();
    setSavedAt(Date.now());
  }

  function reset() {
    if (data) setDraft(data);
    setSavedAt(null);
  }

  return { draft, isLoading, saving, dirty, savedAt, set, save, reset };
}
