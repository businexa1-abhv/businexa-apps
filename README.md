# businexa-apps

Monorepo for the **Businexa** platform: **API** (Express), **web** (Next.js), **mobile** (Expo), and **shared** packages.

## Layout

| Path | Package | Description |
|------|---------|-------------|
| `apps/api` | `@businexa/api` | Node.js Express API (`server.js`, `src/`) |
| `apps/web` | `@businexa/web` | Next.js App Router, Tailwind, OTP + seller dashboard |
| `apps/mobile` | `@businexa/mobile` | Expo Router, tabs, OTP + dashboard |
| `packages/shared` | `@businexa/shared` | Shared types/utilities (optional) |

## Install

From the repository root:

```bash
npm install
```

Workspace packages are linked automatically.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | API dev server (`nodemon`) |
| `npm run start:api` | API production start |
| `npm run test:api` | API tests |
| `npm run dev:web` | Next.js web (`apps/web`) |
| `npm run build:web` | Production build for web |
| `npm run dev:mobile` | Expo dev (`apps/mobile`) |

## API environment

Copy and configure env for the API:

```bash
cp apps/api/.env.example apps/api/.env
```

Run the API from root with `npm run dev:api` or from `apps/api` with `npm run dev`.

### Web & mobile env

- Web: `cp apps/web/.env.example apps/web/.env.local`
- Mobile: copy `apps/mobile/.env.example` and set `EXPO_PUBLIC_*` variables.

## Shared code

Import from other workspaces using package names, for example:

```js
const { /* ... */ } = require('@businexa/shared');
```

Add `@businexa/shared` to `dependencies` in consuming packages when you start using it.

## Git

The Git repository root is this folder (`businexa-apps` / `web-app-businexa` locally).
