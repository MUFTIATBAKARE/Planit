# Planit — Real-Time Task Management

A production-ready, serverless task manager built with **Next.js (App Router)**, **Firebase Authentication + Firestore**, **Tailwind CSS v4** and **Framer Motion**.

Three screens, one cohesive design system:

| Route | Purpose | Indexing |
| --- | --- | --- |
| `/` | Marketing landing page — hero, features, how-it-works, CTA | `index: true`, canonical `/` |
| `/login` | Single-screen auth with **Sign in** / **Create account** tabs | `robots: { index: false, follow: false }` |
| `/signup` | Permanent 307 redirect to `/login` (sign-up is a tab there) | follows the auth screen |
| `/dashboard` | Private, real-time task list + logout | `robots: { index: false, follow: false }` |

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
```

### Environment variables

Create `.env.local` (already gitignored) with your Firebase web config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
# Optional — used for absolute canonical/OG URLs (defaults to http://localhost:3000)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Enable **Email/Password** in Firebase console → Authentication → Sign-in method.

### Firestore setup

1. Deploy the security rules in [`firestore.rules`](./firestore.rules) — they enforce
   `userId == request.auth.uid` server-side, so tenant isolation does not rely on the client.
2. Create the composite index in [`firestore.indexes.json`](./firestore.indexes.json)
   (`tasks`: `userId ASC`, `createdAt DESC`).
   The dashboard degrades gracefully if it is missing: `subscribeToUserTasks` catches the
   `failed-precondition` error, drops `orderBy`, and sorts newest-first on the client.

Task document shape (`tasks/{taskId}`):

```ts
{
  title: string;                       // 1–140 chars
  userId: string;                      // owner uid — the isolation key
  isCompleted: boolean;                // toggled by the row checkbox
  priority: "low" | "medium" | "high"; // V2 — persistent priority level
  dueDate: string | null;              // V2 — ISO "YYYY-MM-DD" (date-only)
  description: string | null;          // V3 — long-form notes (<= 2000 chars)
  tags: string[];                      // V3 — up to 5 category labels
  isArchived: boolean;                 // V3 — soft hide, hidden from default views
  createdAt: Timestamp;                // serverTimestamp()
  updatedAt: Timestamp;                // serverTimestamp()
}
```

`dueDate` is stored as a **date-only string** rather than a timestamp so a native
`<input type="date">` round-trips exactly and no timezone offset can shift a task to
an adjacent day. Documents created by V1 have no `priority`/`dueDate` field —
`toTask()` defaults them to `"medium"` and `null`, so existing rows keep working.

`firestore.rules` validates both new fields server-side (`priority` must be one of the
three literals, `dueDate` must be `null` or match `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`) and
still restricts updates to `title`, `isCompleted`, `priority`, `dueDate`, `updatedAt`.

## Version 2 features

| Feature | Implementation |
| --- | --- |
| **Manual light/dark toggle** | `ThemeProvider` (React context + `useSyncExternalStore`) owns the `dark` class on `<html>` and the `planit-theme` key in `localStorage`. `ThemeToggle` renders Sun/Moon icons that spin 180° on each activation; cross-tab changes sync through the `storage` event, and the no-flash script in `layout.tsx` reads the same key before first paint. |
| **Server-side sorting** | `subscribeToUserTasks` queries `orderBy("createdAt", "desc")`, so newest-first ordering happens in Firestore. If the composite index is missing it falls back to an un-ordered listener and sorts client-side. |
| **Inline title editing** | Double-click (or focus the title and press **Enter** / **Space** / **F2**) morphs the label into an input with a 100ms fade. **Enter**/blur commits via `setTaskTitle`, **Escape** cancels, and an empty title is rejected. |
| **Persistent priority** | A native `<select>` (Low / Medium / High) lives in both the creation bar and every row, writing the `priority` string field. The level is always written out as text next to its colour dot. |
| **Due dates** | A native `<input type="date">` in the composer and each row stores a `dueDate` ISO string. Rows show "Due today", "Due tomorrow" or "Overdue by N days" — the overdue state is copy, not just red text. |
| **Filter tabs** | All / Active / Completed tabs above the list filter client-side, so the live listener is never rebuilt. A shared `layoutId` indicator glides between tabs. |
| **Status counter** | Four pastel counter chips (Total / Active / Completed / Overdue) inside an `aria-live="polite" aria-atomic="false"` region, so only the chip that changed is announced. |

Framer Motion details: rows keep `layout` so filtered lists glide into place,
`AnimatePresence` wraps both the list and the 100ms text ⇄ input morph, and every
transition is gated behind `useReducedMotion()`.

## Version 3 features

| Feature | Implementation |
| --- | --- |
| **Anonymous Guest Mode** | Hovering (or focusing/tapping) the landing-page dashboard preview reveals an **"Interact Live (Guest Mode)"** overlay button, which sets a client-only `planit-guest-session` flag (via `startGuestSession()`) and routes to `/dashboard` — **no Firebase user is created, no auth string is sent**. `RequireAuth` treats a guest session as valid, and `AuthProvider` exposes the app-wide `isGuest` boolean. Guest tasks live in a local array mirrored to `localStorage` by `lib/guestTasks.ts`. |
| **Guest restrictions / paywall** | `GuestGateProvider` exposes `requestAccount(feature)`; gated controls call it *instead* of acting. `GuestPaywallModal` scales up from `scale: 0.95` on a spring and fades out on close, prompting "Sign up for a free account to unlock advanced productivity filters and descriptions." Covers search, row click → details, tags, bulk actions and archive. |
| **Keyword search** | A search pill above the list filters the *client-side* array by title substring, applied after the status tab and tag pill — so typing never rebuilds the Firestore listener. Guests get a locked, inert trigger instead of an input. |
| **Task categorisation / tags** | `TagInput` attaches up to 5 tags (24 chars each, trimmed and de-duplicated by `lib/tags.ts`). `TagFilter` renders one-tap pills for every tag in use, and `collectTags()` skips archived rows. |
| **Rich description drawer** | Clicking a row slides `TaskDetailDrawer` in from the right edge (`x: 100%` → `x: 0%`, ease-out). It saves long-form notes to the `description` field, edits tags inline, and is a `role="dialog"` with `aria-modal`, Escape-to-close, body scroll lock, and focus moved in / restored out. |
| **Clear completed** | One button resolves every `isCompleted == true` id from the live snapshot and deletes them with a chunked `writeBatch` (`removeTasks`, 400 per batch). |
| **Bulk toggle complete** | A master checkbox above the list marks every *currently visible* row complete/incomplete in one batched write (`setTasksCompletion`). It is a native `<input>` so the mixed state is exposed via `indeterminate`. |
| **Archive state** | An archive button on each row flips the `isArchived` boolean. Archived rows are excluded from the default views and all counters, and are reachable only through the **Archived** tab. |
| **Skeleton loading** | `TaskListSkeleton` renders `animate-pulse` placeholder rows inside a `role="status"` live region while the first Firestore snapshot is in flight. |

### Guest Mode boundary

Guest data **never** reaches the network. Every mutation in `DashboardView` branches
on `isGuest`: members call the Firestore writers, guests only call the pure helpers in
`lib/guestTasks.ts` (`createGuestTask`, `patchGuestTask`, `toggleGuestTask`,
`removeGuestTask`), and the `TaskComposer` receives a local `onCreate` instead of its
default `addDoc`. The persistence effect writes to `localStorage` only when
`isGuest` is true, so no guest code path can reach `addDoc`, `updateDoc` or a batch.

## Scripts

```bash
npm run dev      # Turbopack dev server
npm run build    # production build (Turbopack)
npm run start    # serve the production build
npm run lint     # ESLint 9 flat config
```

## Architecture

```
app/
  layout.tsx              fonts, master metadata, viewport export, AuthProvider
  globals.css             Tailwind v4 @theme design tokens + dark variant + base layer
  page.tsx                landing page (static metadata, indexable)
  login/page.tsx          auth screen shell (noindex)
  signup/page.tsx         307 → /login
  dashboard/page.tsx      protected shell (noindex)
components/
  providers/AuthProvider  onAuthStateChanged session tracking + useAuth()
  providers/ThemeProvider light/dark store (useSyncExternalStore + localStorage)
  auth/                   AuthScreen (tabs), RequireAuth (route guard)
  layout/                 SiteHeader, SiteFooter, DashboardShell (rail + drawer),
                          ThemeToggle (Sun/Moon, rotating)
  landing/LandingHero     animated hero + product preview
  tasks/                  TaskComposer, TaskList, TaskItem, TaskStats,
                          TaskFilterTabs, PrioritySelect, DueDateField,
                          TaskSearchField, TagInput, TagFilter,
                          TaskDetailDrawer, TaskListSkeleton
  guest/                  GuestGateProvider (paywall intercept), GuestPaywallModal
  ui/                     Button, Input, Card, Logo, Spinner
lib/
  firebase.ts             app/auth/db singletons
  tasks.ts                addDoc/updateDoc/deleteDoc, batched bulk writes,
                          scoped onSnapshot listener
  guestTasks.ts           localStorage-only guest store (no network calls)
  tags.ts                 tag normalisation, limits and collection
  auth.ts                 signUp / signIn / logOut wrappers
  authErrors.ts           Firebase error code → human copy
  priority.ts             priority labels, order and AA-safe chip classes
  types.ts, utils.ts      Task model, cn(), timestamp + due-date formatting
design/
  dashboard.svg           the visual reference every token was sampled from
```

## Design tokens

All colour, radius and elevation tokens live in `app/globals.css` under Tailwind v4's
`@theme` directive (there is intentionally no `tailwind.config.ts`):

| Token | Light | Dark |
| --- | --- | --- |
| `--color-accent-primary` | `#8280FF` | `#8280FF` |
| `--color-accent-strong` | `#5A56E0` | `#8280FF` |
| `--color-accent-deep` | `#6164CF` | `#6164CF` |
| `--color-accent-soft` | `#F1F0FE` | — |
| `--color-app-bg-*` | `#EFEFEF` | `#020617` |
| `--color-surface-card-*` | `#FFFFFF` | `#0F172A` |
| `--color-text-header-*` | `#0F172A` | `#F8FAFC` |
| `--color-border-*` | `#E7E7E7` | `#1E293B` |

### Where these values come from

`design/dashboard.svg` is a flattened Figma export (no text or fill nodes), so its
colours were read out of the embedded raster data by **pixel sampling** instead of
being eyeballed:

| Sampled from the reference | Hex | Token |
| --- | --- | --- |
| "ADD NEW TASK" button, progress + chart fills | `#8280FF` | `--color-accent-primary` |
| Active nav label / avatar gradient | `#5858F4` | `--color-accent-strong` |
| Selected calendar day | `#6164CF` | `--color-accent-deep` |
| Active nav pill background | `#F1F0FE` | `--color-accent-soft` |
| Page canvas | `#EFEFEF` | `--color-app-bg-light` |
| Cards / hairline borders | `#FFFFFF` / `#E7E7E7` | `--color-surface-card-light`, `--color-border-light` |
| Stat-card pastels | `#8280FF`, `#A7D0D6`, `#F6BBB7`, `#A4EDC0` | `--color-chip-*` |

Contrast is enforced rather than assumed: `#5A56E0` carries white text at **5.47:1**
(and 4.75:1 on the `#EFEFEF` canvas), so it is the accent used for accent *text*,
links, focus rings and the fill of primary CTAs. `#8280FF` (3.24:1 against white,
but only 2.82:1 on `#EFEFEF`) is reserved for *graphics* — checkbox fills, progress
bars, icon bubbles — where WCAG 1.4.11 asks for 3:1, and it is never placed bare on
the page canvas. The reference's pastel stat cards keep their exact fills but carry
near-black labels (>9:1) instead of the artwork's white text, which would have failed AA.

Dark mode keeps the mandated midnight palette (`#020617` / `#0F172A` / `#F8FAFC` /
`#1E293B`) because the reference only ships a light theme, and it re-uses `#8280FF`,
which is itself AA on `#0F172A` (5.0:1).

Typography is **Poppins** — the geometric, rounded sans the artwork is set in — loaded
through `next/font/google` so it is self-hosted with no runtime third-party request.

## Accessibility

- Skip-to-content link, semantic landmarks (`header`/`main`/`nav`/`footer`), one `h1` per screen.
- Visible `focus-visible` rings on every interactive element (never a bare `outline: none`).
- Native `<input type="checkbox">` for completion state, wrapped in a 44×44px target.
- `aria-label` on every icon-only control (delete, password visibility, menu toggles).
- `aria-live="polite" aria-atomic="false"` status chips, so a completion announces only
  the counter that changed; `role="alert"` for form and mutation errors.
- WAI-ARIA tabs with roving `tabIndex` + arrow/Home/End keys on both the auth screen and
  the dashboard filter bar (`role="tablist"` / `role="tab"` / `role="tabpanel"`).
- Inline rename is keyboard-reachable: **Enter**, **Space** or **F2** on the task title
  opens the editor, **Enter** commits, **Escape** cancels, and the shortcut is exposed
  to screen readers through `aria-describedby`.
- Priority is always written out ("High priority", "Medium") beside its colour dot, and
  an overdue due date reads "Overdue by 2 days" — colour is never the only cue.
- Native `<select>` and `<input type="date">` are used for priority and due dates, so
  keyboard support and the platform pickers come for free.
- The mobile navigation drawer is a `role="dialog"` with `aria-modal`, Escape-to-close,
  body scroll lock, and focus moved in on open and restored on close.
- All motion is gated behind `useReducedMotion()` and a `prefers-reduced-motion` fallback.

## SEO

- `metadataBase` + title template (default `Planit | Pro-Level Task Management`, template `%s | Planit`).
- Open Graph (`og:title`, `og:description`, `og:type`, `og:url`) and Twitter
  (`summary_large_image`) tags on the root layout, landing page, auth screen and dashboard.
- Absolute canonical URLs per route; `themeColor`/`colorScheme` exported via `viewport`,
  not `metadata`.
- Private routes ship `robots: { index: false, follow: false, nocache: true }`.

