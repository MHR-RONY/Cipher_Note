# CipherNote API

Express + Mongoose REST API for a note-taking workspace with two independent
panels: a user panel for private notes and a shared posts feed, and an admin
panel for managing users and reviewing their content.

Author: [mhrrony.com](https://mhrrony.com)

## Panel separation

Each panel has its own accounts, routes, JWT secret, and token lifetime. A user
token is rejected on every admin route and an admin token on every user route —
the secrets differ, so rejection is structural, not a role check.

| | User panel | Admin panel |
|---|---|---|
| Collection | `users` | `admins` |
| Prefix | `/api/user` | `/api/admin` |
| Sign up | `POST /api/user/auth/register` | none — one admin, created by setup |
| JWT secret | `USER_JWT_SECRET` | `ADMIN_JWT_SECRET` |
| Token lifetime | 1 day | 2 hours |
| CORS origin | `USER_PANEL_URL` | `ADMIN_PANEL_URL` |

Auth middleware loads the account by `_id` on every request, so a deleted
account loses access immediately.

`Note.owner` is a `User` ref, so an admin `_id` can never own a note. An admin
writes notes on behalf of a user instead: create takes an explicit `ownerId`,
while update and delete act on any note by id with no ownership filter, since
the admin already reads every note.

## Setup

Requires Node.js and MongoDB (local `mongod` or Atlas — the test suite spins up
its own in-memory instance).

```sh
cd backend
npm install
cp .env.example .env
npm run dev
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

Both panel URLs point at the same origin because both panels are served from one
frontend app. That is why the two JWT secrets must stay distinct — a shared
origin means a shared `localStorage`.

## First-time admin setup

The workspace starts with no admin. `GET /api/admin/setup/status` returns
`{ required: true }` until one exists, and `POST /api/admin/setup` creates it
given a matching `ADMIN_SETUP_KEY`. After that the route returns 404 permanently.

The claim is guarded by a `SetupLock` document with `_id: "admin"`, inserted
before the admin is created — a duplicate key error means setup already ran, so
two concurrent requests cannot both succeed. If admin creation then fails, the
lock is rolled back. The setup key is compared with `crypto.timingSafeEqual`
over SHA-256 digests; a wrong key returns 403.

There is no seed script and no demo data.

## API

### User panel

| Method | Path | Access |
|---|---|---|
| POST | `/api/user/auth/register` | public |
| POST | `/api/user/auth/login` | public |
| GET | `/api/user/auth/me` | user |
| GET | `/api/user/notes?page&limit` | user — own notes only |
| POST | `/api/user/notes` | user |
| GET | `/api/user/notes/:id` | user — own note only |
| PUT | `/api/user/notes/:id` | user |
| DELETE | `/api/user/notes/:id` | user |
| GET | `/api/user/posts?page&limit` | user — public feed, newest first |
| POST | `/api/user/posts` | user |

### Admin panel

| Method | Path | Access |
|---|---|---|
| GET | `/api/admin/setup/status` | public |
| POST | `/api/admin/setup` | public, one time |
| POST | `/api/admin/auth/login` | public |
| GET | `/api/admin/auth/me` | admin |
| GET | `/api/admin/users?page&limit` | admin |
| POST | `/api/admin/users` | admin |
| GET | `/api/admin/users/grouped-by-interests` | admin |
| GET | `/api/admin/users/:id` | admin |
| PUT | `/api/admin/users/:id` | admin — password optional |
| DELETE | `/api/admin/users/:id` | admin — cascades to notes and posts |
| GET | `/api/admin/users/:id/posts?page&limit` | admin |
| GET | `/api/admin/notes?page&limit&userId` | admin — `userId` optional |
| GET | `/api/admin/notes/:id` | admin — any note, any owner |
| POST | `/api/admin/notes` | admin — body adds `ownerId` |
| PUT | `/api/admin/notes/:id` | admin — any note |
| DELETE | `/api/admin/notes/:id` | admin — any note |

### Shapes

```
Paginated: { data: [], pagination: { page, limit, total, totalPages } }
Note:  { _id, title, content, owner, createdAt, updatedAt }
User:  { _id, name, email, interests, createdAt }
Admin: { _id, name, email, createdAt }
Post:  { _id, title, body, author, createdAt }
```

Default `limit` is 10, maximum 50. Errors are `{ message }`. An invalid
ObjectId in a route param returns 404 with no database call, and a user
requesting another user's note gets 404 rather than 403.

## Indexes

Three, all declared with `schema.index()` — no `index: true`, no `unique: true`
on a field.

| Model | Index | Supports |
|---|---|---|
| User | `{ email: 1 }` unique | login, duplicate email check |
| Note | `{ owner: 1, _id: -1 }` | user's notes, admin filter by user, cascade delete |
| Post | `{ author: 1, _id: -1 }` | posts of one author in the lookup, cascade delete |

Nothing else is indexed. Every list sorts by `_id` descending and get-by-id
routes use the default `_id` index, which covers the admin user list, the
all-notes list, the post feed, and `SetupLock`. The `admins` collection holds
one document. The interests aggregation reads every user, so an index on
`interests` does not help it and none is defined.

## Aggregations

Both are a single `User.aggregate()` call.

**Users grouped by interests** — `$unwind` interests, `$group` by interest
counting and pushing members, `$sort` by count then name, `$project` to rename
`_id`.

**Posts of one user** — `$match` the cast user `_id`, then `$lookup` from
`posts` with a `$facet` splitting a sorted/skipped/limited `data` branch from a
`$count` total.

## Testing

```sh
npm test         # vitest, in-memory MongoDB — never touches MONGO_URI
npm run typecheck
```

Covers registration and login, cross-panel token rejection, note ownership and
invalid-id 404s, pagination defaults and the 50 cap, one-time setup and
wrong-key rejection, passwords never appearing in a response, both
aggregations, and the delete-user cascade.

`tests/explain.ts` is a standalone script that seeds a small dataset and prints
`explain("executionStats")` for every indexed query, confirming `IXSCAN`:

```sh
npx tsx tests/explain.ts
```

## Commands

| Command | Does |
|---|---|
| `npm run dev` | API on port 5005, restarts on change |
| `npm run build` | Compiles to `dist/` |
| `npm start` | Runs the compiled build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest suite |

## Structure

```
backend/src
  app.ts             builds and configures the Express app (no listen call)
  server.ts          connects Mongo, then listens
  config/db.ts       Mongoose connection
  models/            User, Admin, Note, Post, SetupLock
  middleware/        authUser, authAdmin, validate, rateLimit, error
  routes/user/       /api/user/{auth,notes,posts}
  routes/admin/      /api/admin/{setup,auth,users,notes}
  controllers/       one file per resource
  validators/        zod schemas, one per write route
  utils/             asyncHandler, httpError, objectId, paginate, password, token
  types/express.d.ts augments Request with the authenticated user/admin
```

## Security

- bcrypt at 12 rounds; `password` uses `select: false` and is never returned.
- Login returns one message for a wrong email and a wrong password, and runs a
  bcrypt compare against a fixed dummy hash when the email does not exist, so
  response time does not reveal which emails are registered.
- JWTs pinned to `HS256` on verify, with an expiry set per panel.
- Note ownership is enforced in the query filter (`{ _id, owner }`), not after
  the fetch.
- zod on every write route with unknown keys stripped, so a body cannot smuggle
  in an id or a role.
- helmet, `x-powered-by` off, 10kb JSON body limit.
- CORS is registered per panel ahead of the rate limiters, so a 429 still
  carries `Access-Control-Allow-Origin` instead of surfacing as a network error.
- Rate limits on user login, register, admin login, and setup.
