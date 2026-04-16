# Ticketing System Client

Angular 19 frontend for the ticketing system admin portal.

This project includes:
- Authentication (login, logout, change password)
- Dashboard analytics/charts
- Company, company-admin, user, and device management
- Firebase Cloud Messaging (FCM) integration for notifications

## Tech Stack

- Angular 19 (standalone components)
- RxJS
- Angular Router
- Angular Forms (Reactive Forms)
- Chart.js
- Firebase Messaging (`@angular/fire`)
- `@ngx-env/builder` for environment variable injection

## Prerequisites

- Node.js 18+ (recommended LTS)
- npm 9+

## Environment Variables

This project reads runtime build variables via `import.meta.env`.

Required:
- `NG_APP_API_URL`
- `NG_APP_FIREBASE_VAPID_KEY`
- `NG_APP_FIREBASE_API_KEY`
- `NG_APP_FIREBASE_AUTH_DOMAIN`
- `NG_APP_FIREBASE_PROJECT_ID`
- `NG_APP_FIREBASE_STORAGE_BUCKET`
- `NG_APP_FIREBASE_MESSAGING_SENDER_ID`
- `NG_APP_FIREBASE_APP_ID`

These values are consumed in:
- `src/app/data/constants/api/index.ts`
- `src/environments/environment.development.ts`
- `src/environments/environment.production.ts`

## Install

```bash
npm install
```

## Run (Development)

```bash
npm start
```

Default Angular dev server behavior:
- Serves app from `http://localhost:4200`
- Uses `development` build configuration

## Build

```bash
npm run build
```

Build output:
- `dist/ticketing-system-client`

## Project Structure

```text
ticketing-system-client/
├── public/                      # Static public assets (copied as-is)
│   └── firebase-messaging-sw.js # Service worker for FCM background notifications
├── src/
│   ├── app/
│   │   ├── app.config.ts        # Global providers (router, http, firebase, interceptors)
│   │   ├── app.routes.ts        # Route definitions and lazy-loaded pages
│   │   ├── core/
│   │   │   └── interceptors/    # Global HTTP interceptors (e.g., token-expired redirect)
│   │   ├── data/
│   │   │   ├── constants/       # API URL, Firebase config, pagination constants
│   │   │   ├── interfaces/      # Shared TypeScript interfaces/types
│   │   │   ├── mocks/           # Sidebar/menu and local static data
│   │   │   └── services/        # API service layer (auth, user, admin, company, ...)
│   │   ├── guards/              # Route guards (auth/login access rules)
│   │   ├── layouts/
│   │   │   └── main/            # Main app shell (sidebar, topbar, router outlet)
│   │   ├── pages/               # Feature pages
│   │   │   ├── login/           # Login page
│   │   │   ├── dashboard/       # Analytics dashboard/charts
│   │   │   ├── company/         # Company management
│   │   │   ├── admin/           # Company admin management
│   │   │   ├── user/            # User management
│   │   │   ├── device/          # Device/FCM token management
│   │   │   ├── password/        # Change-password page
│   │   │   ├── unauthorized/    # 403-style page
│   │   │   └── not-found/       # 404 page
│   │   └── shared/              # Reusable UI components and utilities
│   ├── environments/            # Angular environment entry points
│   ├── main.ts                  # App bootstrap
│   └── styles.scss              # Global styles
├── angular.json                 # Angular workspace/build config
├── package.json                 # Scripts and dependencies
└── tsconfig.json                # TypeScript config
```

## Folder-by-Folder Notes

### `public/`
- Contains static files copied directly to build output.
- `firebase-messaging-sw.js` must stay in `public` root so the browser can register it as a service worker.

### `src/app/core/interceptors/`
- Place cross-cutting HTTP behavior here.
- Current interceptor redirects to `/login` when API returns unauthorized/token-expired responses.

### `src/app/data/services/`
- Thin API client layer wrapping backend endpoints.
- Keeps page/components focused on UI state and interaction.
- Common pattern: each domain has its own folder (`auth`, `user`, `company-admin`, etc.).

### `src/app/data/interfaces/`
- Centralized DTO and model typing used across services/components.
- Update interfaces first when backend contracts change.

### `src/app/pages/`
- Main feature modules (standalone component style).
- Each page can have:
  - `components/` for local subcomponents
  - `styles/` for shared styles inside that page domain
  - `utils/` for page-level helpers/mappers

### `src/app/shared/`
- Reusable components (input/button/notification/stat-card...)
- Shared validators and helper utilities.

### `src/environments/`
- `environment.ts` re-exports development by default.
- Use Angular configurations in `angular.json` for dev/prod replacement behavior.

## Routing Overview

Main routes are defined in `src/app/app.routes.ts`:
- `/login`
- `/dashboard`
- `/companies`
- `/admins`
- `/users`
- `/devices`
- `/password`
- `/unauthorized`
- `**` (not found)

Authenticated pages are rendered inside `MainLayoutComponent`.

## Common Development Workflow

1. Start backend API and confirm `NG_APP_API_URL` is set.
2. Run frontend:
   ```bash
   npm start
   ```
3. Open app and login.
4. Work on feature page under `src/app/pages/<feature>/`.
5. Add/update API contract in:
   - `src/app/data/interfaces/...`
   - `src/app/data/services/...`

## Troubleshooting

- **App cannot call API**
  - Check `NG_APP_API_URL`.
  - Confirm backend is reachable and CORS is configured.

- **FCM notifications not received**
  - Verify Firebase env values.
  - Check service worker registration and browser notification permission.

- **Auto-redirect to `/login`**
  - Usually means 401/unauthorized/token expired returned by backend.
  - Re-login and verify token is persisted in `localStorage`.
