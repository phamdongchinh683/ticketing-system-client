# Ticketing System Client

Angular 19 frontend for the ticketing system admin portal.

## Core Features

- Authentication: login, logout, change password
- Dashboard overview and trend charts
- Company, company-admin, user, and device management
- Balance, withdraw, payout history, and revenue export
- Firebase Cloud Messaging (FCM) device registration/removal
- Centralized theming and shared UI primitives
- In-memory API caching with TTL by domain

## Tech Stack

- Angular 19 (standalone components)
- RxJS
- Angular Router
- Angular Forms (Reactive Forms)
- Chart.js
- Firebase Messaging (`@angular/fire`)
- `@ngx-env/builder` for runtime env injection

## Requirements

- Node.js 18+ (LTS recommended)
- npm 9+

## Environment Variables

This project reads variables via `import.meta.env`.

Required:

- `NG_APP_API_URL`
- `NG_APP_FIREBASE_VAPID_KEY`
- `NG_APP_FIREBASE_API_KEY`
- `NG_APP_FIREBASE_AUTH_DOMAIN`
- `NG_APP_FIREBASE_PROJECT_ID`
- `NG_APP_FIREBASE_STORAGE_BUCKET`
- `NG_APP_FIREBASE_MESSAGING_SENDER_ID`
- `NG_APP_FIREBASE_APP_ID`

Main usage points:

- `src/app/data/constants/api/index.ts`
- `src/environments/environment.development.ts`
- `src/environments/environment.production.ts`

## Quick Start

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm start
```

Default dev URL: `http://localhost:4200`

Build production bundle:

```bash
npm run build
```

Build output: `dist/ticketing-system-client`

## Project Structure

```text
ticketing-system-client/
├── public/
│   └── firebase-messaging-sw.js
├── src/
│   ├── app/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── core/
│   │   │   ├── interceptors/
│   │   │   └── services/
│   │   ├── data/
│   │   │   ├── constants/
│   │   │   ├── interfaces/
│   │   │   ├── mocks/
│   │   │   └── services/
│   │   ├── guards/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── shared/
│   ├── environments/
│   ├── styles/
│   │   └── theme.css
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
└── tsconfig.json
```

## Architecture Notes

### Theme System

- Global theme tokens live in `src/styles/theme.css`
- Imported once in `src/styles.scss`
- Update colors/typography/shadows centrally through CSS variables

### API Service Layer and Caching

- Each domain has a dedicated service under `src/app/data/services`
- Shared cache utilities live in `src/app/data/services/cache-utils.ts`
- Common cache strategy: in-memory `Map` + TTL + prefix invalidation

Current TTL defaults by domain:

- Company list: 5 minutes
- Company admin list: 1 minute
- Dashboard overview/charts: 1 minute
- Device token list: 3 minutes
- Notifications: 15 seconds
- Balance overview: 30 seconds

Cache is invalidated after relevant mutations (create/update/delete/withdraw/mark-as-read).

### FCM Token Flow

- After successful login, app requests notification permission and tries to register the current device token
- Login still succeeds even if token registration fails (warning is shown)
- On logout, app removes current device token from backend before final session cleanup
- Main logic is centralized in `src/app/core/services/fcm-device.service.ts`

## Routing Overview

Main routes in `src/app/app.routes.ts`:

- `/login`
- `/dashboard`
- `/companies`
- `/admins`
- `/users`
- `/devices`
- `/balance`
- `/password`
- `/unauthorized`
- `**` (not found)

Authenticated pages are rendered inside `MainLayoutComponent`.

## Development Workflow

1. Start backend API and verify `NG_APP_API_URL`
2. Run frontend with `npm start`
3. Login with a valid account
4. Implement features in `src/app/pages/<feature>/`
5. Keep contracts aligned in:
   - `src/app/data/interfaces/...`
   - `src/app/data/services/...`

## Troubleshooting

- **Cannot call API**
  - Check `NG_APP_API_URL`
  - Confirm backend availability and CORS configuration

- **FCM notifications not working**
  - Verify Firebase env values
  - Verify `public/firebase-messaging-sw.js` registration
  - Verify browser notification permission

- **Redirected to `/login` unexpectedly**
  - Backend likely returned unauthorized/token-expired
  - Re-login and confirm token exists in `localStorage`
