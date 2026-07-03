# Push Notifications

Hybrid delivery: **local scheduled reminders** on-device + **remote push** via
Expo Push Service (FCM/APNs) for server-driven events.

## Delivery model

| Notification         | Method | Source                                        |
| -------------------- | ------ | --------------------------------------------- |
| Daily study reminder | Local  | Scheduled on-device (follows device timezone) |
| Streak warning       | Remote | `StreakReminderJob` → outbox                   |
| Achievement unlocked | Remote | Lesson completion → outbox                     |
| New cultural content | Remote | Admin publish → outbox broadcast              |

Each server type is gated by a `user_settings` toggle (`streakReminder`,
`achievementAlerts`, `culturalContentAlert`). Daily reminders are local-only and
gated by `dailyReminder` + `dailyReminderTime`.

## Backend

- **Tables** (`CreatePushNotifications` migration): `push_devices`,
  `notification_outbox`, `notification_deliveries`. `push_devices` and
  `notification_outbox` are RLS-isolated per user.
- **Enqueue**: `NotificationsService.enqueue` / `enqueueBroadcast` — honours the
  user's settings toggle and de-duplicates via `dedupe_key`.
- **Worker** (`PushOutboxJob`, every 30s): claims due rows with
  `FOR UPDATE SKIP LOCKED`, fans out to enabled devices via `expo-server-sdk`,
  records deliveries + tickets, retries transient failures with backoff.
- **Receipts** (`PushReceiptsJob`, every 5m): fetches Expo receipts and disables
  tokens returning `DeviceNotRegistered`.

### Required env

```env
# apps/api/.env
EXPO_PUSH_ACCESS_TOKEN=   # Expo dashboard → Account → Access tokens (enable enhanced push security)
```

Without it, sends still work but without enhanced security (a warning is logged).
**Never** put this token in the mobile bundle.

## Mobile

- Packages: `expo-notifications`, `expo-device`. Config plugin added in
  `app.json`.
- `src/services/notifications.ts`: channels, permission, token registration,
  local reminder scheduling, tap-route allowlist.
- `usePushNotificationsBootstrap()` (root layout): channels + tap routing +
  silent re-register on login for already-opted-in users.
- Permission is requested **only** when the learner enables a toggle in
  Settings → Notification (Android 13+ requires the runtime grant).

## Testing / build prerequisites

- **Remote push requires a development or production build** — it does **not**
  work in Expo Go, and delivery does not work on simulators. Build a dev client:

  ```bash
  eas build --profile development --platform ios   # or android
  ```

  Token registration and remote push are guarded (`Device.isDevice` + try/catch),
  so the app degrades gracefully in Expo Go: local daily reminders still schedule;
  remote registration silently skips.

- Send a test push from the [Expo push tool](https://expo.dev/notifications)
  using a token from the `push_devices` table.
