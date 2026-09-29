# CipherNote

A secure note-taking workspace with two separate panels sharing one backend:
a member notebook for writing private notes and a public posts feed, and an
administrator console for managing people and reviewing everything they write.

Author: [mhrrony.com](https://mhrrony.com)

## Repo layout

```
/backend    Express + Mongoose API (TypeScript), serves both panels
/frontend   TanStack Start (React + TypeScript + Tailwind), one app, both panels
```

The user panel and the admin panel are routes inside the one frontend app
(`/...` and `/admin/...`), not separate builds. They share no session: each
panel keeps its own token, its own login page, and its own account collection
on the backend. A user token is rejected on every admin route and an admin
token is rejected on every user route.

## What's inside

**Member area** — private notes with a simple editor, and a public posts
feed everyone shares. A member only ever sees their own notes.

**Administrator console** — a collapsible sidebar shell over people
management, an all-notes view filterable by user, a per-member posts view,
and an interests breakdown that groups members by the topics they picked.

## Stack

| Part | Backend | Frontend |
|---|---|---|
| Language | TypeScript (ES modules) | TypeScript |
| Framework | Express 5 | React 19 + TanStack Start (SSR) |
| Data | MongoDB + Mongoose | TanStack Router (file-based), TanStack Query |
| Validation | zod | plain `useState` forms, no client-side schema validation |
| Auth | JWT (jsonwebtoken), one secret per panel | Bearer token per panel in `localStorage` |
| Security | helmet, cors, express-rate-limit, bcryptjs | — |
| Styling | — | Tailwind CSS 4, dark Notion-style theme |
| Build/test | tsc, vitest + supertest + mongodb-memory-server | Vite 8 |

## Getting started

Requires Node.js and a way to run MongoDB (a local `mongod`, Atlas, or let the
test suite spin up its own in-memory instance — see Testing below).

### 1. Backend

```sh
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```
PORT=5005
MONGO_URI=mongodb://localhost:27017/secure-notes
USER_JWT_SECRET=<long random value>
ADMIN_JWT_SECRET=<long random value>
USER_PANEL_URL=http://localhost:8080
ADMIN_PANEL_URL=http://localhost:8080
ADMIN_SETUP_KEY=<long random value>
```

Both panel URLs point at the same origin, since the two panels are routes in
one frontend app running on port 8080. Never commit `.env`.

```sh
npm run dev
```

The API listens on `http://localhost:5005`.

### 2. Frontend

```sh
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app listens on `http://localhost:8080`.

### 3. First-time admin setup

The workspace starts with no administrator account. Open
`http://localhost:8080/admin/login` — since no admin exists yet, it redirects
to `/admin/setup`. Fill in a name, email, password, and the `ADMIN_SETUP_KEY`
from the backend's `.env`. This creates the one administrator account and logs
you in. After that, `POST /api/admin/setup` returns 404 and `/admin/setup`
redirects straight back to `/admin/login` — there is no way to create a second
admin from the UI.

There is no seed script and no demo data anywhere in the app.

## Commands

Backend, inside `/backend`:

| Command | Does |
|---|---|
| `npm run dev` | API on port 5005, restarts on change |
| `npm run build` | Compiles to `dist/` |
| `npm start` | Runs the compiled build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Runs the vitest suite against an in-memory MongoDB |

Frontend, inside `/frontend`:

| Command | Does |
|---|---|
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build |
| `npm run build:dev` | Production build in development mode |
| `npm run preview` | Preview a production build locally |
| `npm run lint` | ESLint over the repo |
| `npm run format` | `prettier --write .` |

## Testing

Backend tests (`backend/tests/`) use `mongodb-memory-server`, so `npm test`
needs no local `mongod` and never touches the database in `MONGO_URI`. They
cover registration/login, cross-panel token rejection, note ownership and
404s on an invalid id, pagination defaults and the 50-item cap, one-time admin
setup, wrong-setup-key rejection, password fields never leaking into a
response, both aggregation endpoints, and the delete-user cascade to notes and
posts.

`backend/tests/explain.ts` is a standalone script (not part of the vitest
run) that seeds a small dataset and prints `explain("executionStats")` for
every indexed query. Regenerate `docs/explain-report.md` with:

```sh
cd backend
npx tsx tests/explain.ts
```

## Environment reference

`/backend/.env` — see the setup section above for the full list.

`/frontend/.env`

```
VITE_API_URL=http://localhost:5005/api
```

## Project structure

```
backend/src
  app.ts             creates and configures the Express app (no listen call)
  server.ts          boots the app: connects Mongo, then listens
  config/db.ts       Mongoose connection
  models/            User, Admin, Note, Post, SetupLock — 3 indexes total
  middleware/        authUser, authAdmin, validate, rateLimit, error
  routes/user/       /api/user/{auth,notes,posts}
  routes/admin/      /api/admin/{setup,auth,users,notes}
  controllers/       one file per resource
  validators/        zod schemas, one per write route
  utils/             asyncHandler, httpError, objectId, paginate, password, token
  types/express.d.ts augments Express's Request with the authenticated user/admin

frontend/src
  routes/            file-based routes; routeTree.gen.ts is generated
  components/        AppShell, AuthGuards, LoginPage, Notes, Forms, UserForm, Pagination
  context/           AuthContext — a user session and an admin session, independently
  lib/               api.ts (userApi, adminApi — one typed REST client per panel),
                     error-capture.ts + error-page.ts (SSR error recovery)
  styles.css         theme tokens and layout
```

## Security notes

- Passwords are hashed with bcrypt (12 rounds) and never selected by default.
  Login takes the same amount of time whether the email exists or not, so an
  attacker can't tell which emails are registered by measuring response speed.
- Each panel has its own JWT secret pinned to `HS256`, so a token from one
  panel is structurally rejected by the other, not just by a role check.
- CORS is scoped per panel to its own origin; rate limits sit behind CORS so a
  429 still carries the right headers instead of surfacing as a network error.
- Every write route validates with zod and strips unknown keys — a request
  body can't smuggle in fields like an id or a role.
- Route guards in the frontend (`Protected`, `AdminOnly`) shape the UI only.
  Authorization is enforced by the API.
