# LexiRoot — Claude Code Instructions

## Project Overview

**LexiRoot** is a multi-generational mobile EdTech platform for learning African (starting with Nigerian) languages and cultures. It is gamified, audio-first, and built for diaspora communities and home learners alike.

**We build iteratively.** Never scaffold everything at once. Each session focuses on a specific slice of functionality — backend first, then mobile, then admin. When in doubt, ask before building.

---

## Tech Stack

| Layer                 | Technology                                      |
| --------------------- | ----------------------------------------------- |
| Mobile App            | React Native (Expo)                             |
| Admin Dashboard       | React + Vite                                    |
| Backend API           | NestJS (TypeScript)                             |
| Database              | PostgreSQL (self-hosted)                        |
| State / Data Fetching | Redux Toolkit + RTK Query                       |
| Styling (Admin)       | Tailwind CSS (config-driven, no inline classes) |
| Auth                  | JWT (custom, handled in NestJS)                 |
| Payments              | Stripe + Apple IAP + Google Play Billing        |
| Push Notifications    | Expo Notifications                              |
| Media                 | Cloudinary (audio/images)                       |
| Hosting               | Contabo VPS + Coolify                           |

---

## Monorepo Structure

```
lexiroot/
├── apps/
│   ├── mobile/          # Expo React Native app
│   ├── admin/           # React + Vite admin dashboard
│   └── api/             # NestJS backend
├── packages/
│   └── shared/          # Shared TypeScript types, DTOs, constants
├── docker-compose.yml   # Local PostgreSQL + pgAdmin
├── .env.example
└── CLAUDE.md            # ← You are here
```

---

## Backend — NestJS (`apps/api`)

### Structure

```
apps/api/src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── languages/
│   ├── lessons/
│   ├── exercises/
│   ├── gamification/
│   ├── cultural-content/
│   ├── subscriptions/
│   ├── notifications/
│   └── payments/
├── common/
│   ├── guards/
│   ├── decorators/
│   ├── interceptors/
│   ├── filters/
│   ├── pipes/
│   └── utils/
├── config/
├── database/
│   ├── migrations/
│   └── seeds/
└── main.ts
```

### Module Rules

- Every module has: `controller`, `service`, `repository` (or TypeORM entity), `dto`, `entity`.
- Controllers only handle HTTP — no business logic.
- Services contain all business logic.
- DTOs use `class-validator` decorators. Always validate incoming data.
- Use `@plainToClass` + `@Exclude()` on entities to prevent mass assignment — never pass raw `req.body` to a save/update call.
- Use **whitelisted DTOs only**: enable `whitelist: true` and `forbidNonWhitelisted: true` in the global ValidationPipe.

### Mass Assignment Prevention

```typescript
// main.ts — always include this
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

Never do this:

```typescript
// ❌ BAD
await this.userRepository.save({ ...req.body });

// ✅ GOOD
const dto = plainToClass(UpdateUserDto, req.body);
await this.userRepository.save(dto);
```

### Payment & Race Condition Prevention

Payments are critical. Follow these rules strictly:

1. **Idempotency keys** — every payment initiation must store and check an idempotency key before processing.
2. **Database-level locking** — use `SELECT ... FOR UPDATE` (pessimistic locking) when reading subscription status before writing.
3. **Atomic transactions** — subscription activation must happen in a single DB transaction (payment record + subscription row + user flag).
4. **Webhook deduplication** — store processed webhook event IDs in a `processed_events` table; skip duplicates.
5. **Status machine** — subscriptions follow a strict state machine: `pending → active → cancelled | expired`. Never skip states.

```typescript
// Example: pessimistic lock for subscription update
await this.dataSource.transaction(async (manager) => {
  const subscription = await manager
    .getRepository(Subscription)
    .createQueryBuilder('sub')
    .setLock('pessimistic_write')
    .where('sub.userId = :userId', { userId })
    .getOne();

  if (subscription.status !== 'pending') return; // already processed
  subscription.status = 'active';
  await manager.save(subscription);
});
```

### Background Jobs

Use `@nestjs/schedule` (cron-based) or a BullMQ queue for:

- `expire-subscriptions` — daily job to mark expired subscriptions
- `streak-reset` — midnight job to reset broken streaks
- `push-notification-scheduler` — batch notification dispatch
- `xp-cache-flush` — flush unlogged PostgreSQL cache rows to main tables

Jobs live in `apps/api/src/jobs/`. Each job is a separate service decorated with `@Injectable()` and registered in a `JobsModule`.

---

## Database — PostgreSQL

### Row-Level Security (RLS)

Enable RLS on all user-owned tables. Users should only ever access their own data.

```sql
-- Enable RLS on a table
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own rows
CREATE POLICY user_progress_isolation
  ON user_progress
  USING (user_id = current_setting('app.current_user_id')::uuid);
```

NestJS must set the session variable before queries:

```typescript
await this.dataSource.query(`SET app.current_user_id = '${userId}'`);
```

Apply RLS to: `user_progress`, `streaks`, `xp_ledger`, `subscriptions`, `lesson_completions`, `speech_attempts`.

### Migration Rules

- Use TypeORM migrations — never `synchronize: true` in production.
- Migration files are in `apps/api/src/database/migrations/`.
- Every schema change needs a migration. Never edit existing migrations.
- Seed files go in `apps/api/src/database/seeds/`.

### Key Tables (MVP)

```
users
languages
units
lessons
exercises
exercise_attempts
speech_attempts
cultural_content
xp_ledger
streaks
achievements
user_achievements
subscriptions
subscription_events
processed_webhook_events
notifications
```

---

## Admin Dashboard — React + Vite (`apps/admin`)

### Structure

```
apps/admin/src/
├── components/
│   ├── ui/              # Reusable atomic components (Button, Input, Badge...)
│   ├── layout/          # Sidebar, Header, PageWrapper
│   └── features/        # Feature-specific components (LessonEditor, UserTable...)
├── pages/
├── store/               # Redux Toolkit store
├── services/            # RTK Query API slices
├── hooks/
├── utils/
└── styles/
    └── index.css        # Tailwind base + custom tokens
```

### Tailwind Configuration Rules

We use **Tailwind v4** (CSS-first config). All design tokens live in `apps/admin/src/styles/index.css` under the `@theme` directive — there is no `tailwind.config.js`.

Vite picks Tailwind up via `@tailwindcss/vite` in `apps/admin/vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

**Never use arbitrary inline Tailwind values.** Add a token to `@theme` and use the semantic utility instead.

```css
/* apps/admin/src/styles/index.css */
@import 'tailwindcss';

@theme {
  --font-sans: 'Nunito', sans-serif;
  --font-display: 'Nunito', sans-serif;

  --color-primary: #e35336;
  --color-primary-foreground: #ffffff;

  --color-secondary: #814231;
  --color-secondary-foreground: #ffffff;

  --color-tertiary: #bf9828;
  --color-tertiary-foreground: #ffffff;

  --color-neutral: #3c3c3c;
  --color-neutral-variant: #7a7878;
  --color-neutral-foreground: #ffffff;

  --color-accent: #1fc0e0;
  --color-accent-foreground: #ffffff;

  --color-error: #ff3333;
  --color-error-foreground: #ffffff;

  --color-warning: #f9d506;
  --color-warning-foreground: #1a1a1a;

  --color-success: #16a34a;
  --color-success-foreground: #ffffff;

  --spacing-18: 4.5rem;
  --spacing-88: 22rem;
  --spacing-128: 32rem;

  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
}
```

Also add Nunito to your HTML or global CSS. In `apps/admin/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

Use semantic class names in components, not raw values:

```tsx
// ❌ BAD — arbitrary values
<button className="bg-[#E35336] text-[14px] px-[16px]">

// ✅ GOOD — from config
<button className="bg-primary text-primary-foreground text-sm px-4">
<span className="text-neutral-variant">Subtitle text</span>
<div className="bg-success text-success-foreground">Saved!</div>
<div className="bg-error text-error-foreground">Something went wrong</div>
```

### RTK Query Setup

All API calls go through RTK Query slices — no raw `fetch` or `axios` in components.

```typescript
// services/api.ts — base API
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['User', 'Lesson', 'Language', 'Subscription'],
  endpoints: () => ({}),
});
```

Each feature has its own endpoint file that injects into the base API:

```
services/
├── api.ts
├── usersApi.ts
├── lessonsApi.ts
├── subscriptionsApi.ts
└── analyticsApi.ts
```

### Component Rules

- Components are small and single-purpose. If a component exceeds ~150 lines, split it.
- No business logic in components — use custom hooks.
- All shared UI components live in `components/ui/`.
- Feature components (tables, forms, editors) live in `components/features/`.

---

## Mobile App — Expo (`apps/mobile`)

### Structure

```
apps/mobile/src/
├── components/
│   ├── ui/
│   └── features/
├── screens/
│   ├── Auth/
│   ├── Onboarding/
│   ├── Home/
│   ├── Lesson/
│   ├── Speech/
│   ├── Culture/
│   └── Profile/
├── navigation/
├── store/               # Redux Toolkit
├── services/            # RTK Query
├── hooks/
├── utils/
└── constants/
```

### Rules

- Use Expo Router (file-based routing) for navigation.
- Audio handling via `expo-av`.
- Microphone via `expo-audio` / `expo-av`.
- Push notifications via `expo-notifications`.
- Offline caching via `expo-file-system` + SQLite (`expo-sqlite`).
- No direct API calls in screens — use RTK Query hooks.

---

## Shared Package (`packages/shared`)

Contains types, DTOs, and constants shared between `api`, `admin`, and `mobile`.

```
packages/shared/src/
├── types/
│   ├── user.types.ts
│   ├── lesson.types.ts
│   ├── gamification.types.ts
│   └── subscription.types.ts
├── constants/
│   └── index.ts         # Language codes, subscription tiers, XP values
└── index.ts
```

---

## Environment Variables

```env
# apps/api/.env
DATABASE_URL=postgresql://lexiroot:password@localhost:5432/lexiroot
JWT_SECRET=
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
APPLE_IAP_SHARED_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EXPO_PUSH_ACCESS_TOKEN=

# apps/admin/.env
VITE_API_URL=http://localhost:3000

# apps/mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Code Organization Rules

### Data-manipulation helpers live in `utils/`

Any pure function that transforms data — date/time formatting, number/money formatting, string casing, percentage math, sorting/grouping helpers, label-from-code lookups, etc. — must live in `apps/<app>/src/utils/` (or `packages/shared/` if it's cross-app) and be imported where needed. Do **not** define `formatDate`, `formatNumber`, `formatRelative`, `slugify`, etc. inline at the top of a component file.

```tsx
// ❌ BAD — inline helper duplicated across files
function formatDate(iso: string) { /* ... */ }
export function UsersPage() { return <td>{formatDate(user.createdAt)}</td>; }

// ✅ GOOD
import { formatDate } from '../utils/format';
export function UsersPage() { return <td>{formatDate(user.createdAt)}</td>; }
```

Group related helpers in topic files: `utils/format.ts`, `utils/currency.ts`, `utils/dates.ts`, etc.

### SVGs live in their own component files

Inline SVG markup is allowed only inside a dedicated icon component file. Each SVG that's used as an icon or illustration goes in `apps/<app>/src/components/icons/<IconName>.tsx` (or `.../icons/index.ts` for re-exports) and is imported where needed.

```tsx
// ❌ BAD — full SVG markup pasted into a feature component
function StatsCards() {
  return <span><svg viewBox="0 0 37 37">...50 lines of paths...</svg></span>;
}

// ✅ GOOD
import { TotalUsersIcon } from '../components/icons/TotalUsersIcon';
function StatsCards() {
  return <span><TotalUsersIcon /></span>;
}
```

This applies to both web (React) and mobile (React Native + `react-native-svg`). Icons that take variants (color, size) should accept those as props.

## What NOT to Do

- ❌ Do not use `synchronize: true` in TypeORM production config
- ❌ Do not pass raw `req.body` to database save methods
- ❌ Do not write business logic in controllers or components
- ❌ Do not use arbitrary Tailwind values — add tokens to config
- ❌ Do not process the same payment webhook twice (check `processed_webhook_events`)
- ❌ Do not skip DB transactions for payment/subscription state changes
- ❌ Do not hard-code secrets — always use `.env`
- ❌ Do not create a new module without controller + service + dto + entity
- ❌ Do not add Redux slices for server state — use RTK Query instead

---

## Current Phase: Project Setup

**Goal for this session:** Scaffold the monorepo structure, configure tooling, set up local development environment. No feature code yet.

### Setup Checklist

- [x] Initialize monorepo (pnpm workspaces)
- [x] Scaffold `apps/api` — NestJS skeleton (TypeORM + PostgreSQL deps; entities/modules added per feature slice)
- [x] Scaffold `apps/admin` — React + Vite + Tailwind v4 + RTK Query
- [x] Scaffold `apps/mobile` — Expo + Expo Router + RTK Query
- [x] Create `packages/shared` with base types
- [x] Set up `docker-compose.yml` for local PostgreSQL + pgAdmin
- [x] Configure global ValidationPipe in NestJS
- [x] Configure Tailwind v4 brand tokens (`apps/admin/src/styles/index.css`)
- [x] Set up RTK Query base API slice (admin + mobile)
- [x] Create `.env.example` files
- [ ] Run `pnpm install` and verify dev servers boot
- [ ] Configure ESLint + Prettier across all apps

**Do not implement any features until the above is complete and confirmed working.**
