# CipherNote backend build

Only the reviewer agent (T9) may set a status to `done`, and only after it
verifies the acceptance check itself. Owning agents move a task to `doing`
and then to `review`.

## Mismatches (frontend vs CLAUDE.md)

`src/lib/api.ts` is **dead code** — no file imports it. All 15 route and
component files call `demo.*` from `src/lib/demo.ts`, so the frontend is not
yet a client of any contract. **CLAUDE.md wins on every path, shape, model and
security decision.** Where api.ts declares a response *shape* that CLAUDE.md
also specifies, they already agree and that shape is kept.

| # | Frontend today | CLAUDE.md | Resolution |
|---|---|---|---|
| M1 | `/auth/login`, `/notes`, `/users`, `/posts` — no panel prefix | `/api/user/*` and `/api/admin/*` | CLAUDE.md. Two prefixes |
| M2 | one token key `inkwell_token` | `user_token` + `admin_token` | CLAUDE.md. Two keys, two sessions |
| M3 | `User.role: "user" \| "admin"`, plus a role `<select>` in `UserForm` and a Role column in the users table | two collections, no role field, no route that creates an admin | CLAUDE.md. `role` is **removed** from the type, the payload, the form select and the table column — not merely stripped server-side. A picker the backend ignores is a control that silently does nothing |
| M4 | no admin login, no setup, no admin-prefixed call | admin login + one-time setup | CLAUDE.md. Add both, plus an `/admin/setup` route |
| M5 | `api.users` → `/users`, colliding with the user panel | `/api/admin/users` | CLAUDE.md |
| M6 | `api.posts(userId)` → `/users/:id/posts` | user `/api/user/posts/author/:id`, admin `/api/admin/users/:id/posts` | CLAUDE.md. One shared handler behind both |
| M7 | posts page lists only the signed-in author's posts | `GET /api/user/posts` is a public feed | Page keeps its own-posts view via the by-author route; the feed route exists alongside it |
| M8 | `demo.workspace()` dumps the whole workspace for the admin overview, and derives 4 stat tiles from it | no such endpoint | Compose the overview from `/admin/users`, `/admin/notes` and `/admin/users/grouped-by-interests`. "Weekly activity" has no backend source and is dropped |
| M9 | `AuthGuards` reads `demo.session()` and switches on a role | per-panel auth | Two contexts: `AuthContext` (user) and `AdminAuthContext` |
| M10 | note lists sort by `updatedAt` | sort by `_id` desc, matching `{ owner: 1, _id: -1 }` | CLAUDE.md. Display is unaffected |
| M11 | one app on `:8080`, user pages link to `/admin/*` | two apps on `:5173`/`:5174`, no link between them | One app, per the brief. Backend still has two routers, two collections, two secrets, two lifetimes. Both CORS values point at `:8080` |
| M12 | `register.tsx` confirm-password field calls `setPassword`, so the two fields can never disagree | — | Frontend bug that lets a typo through. Fix in T8 |
| M13 | demo credentials on both login pages (`.demo-credentials` in `styles.css`), a hardcoded `Live demo` pill in `AppShell`, `"Try u-lee"` filter placeholder | no placeholder text anywhere | Removed in T8, including the now-dead CSS rule |

## Demo call sites (Step 0.5 inventory)

28 calls across 15 files. 19 distinct demo functions. `src/lib/demo.ts` itself
is deleted once nothing imports it.

| File | Calls | Replaced by |
|---|---|---|
| `components/AuthGuards.tsx` | `session` | both auth contexts |
| `components/AppShell.tsx` | `logout` x2 | `logout` from the matching context |
| `routes/login.tsx` | `login` | `userApi.login` |
| `routes/register.tsx` | `register` | `userApi.register` |
| `routes/notes.tsx` | `notes`, `deleteNote` | `userApi.notes`, `userApi.deleteNote` |
| `routes/notes.new.tsx` | `createNote` | `userApi.createNote` |
| `routes/notes.$id.edit.tsx` | `note`, `updateNote` | `userApi.note`, `userApi.updateNote` |
| `routes/posts.tsx` | `posts`, `createPost` | `userApi.postsByAuthor`, `userApi.createPost` |
| `routes/admin.login.tsx` | `login` | `adminApi.login` |
| `routes/admin.overview.tsx` | `workspace` | three real calls (see M8) |
| `routes/admin.users.tsx` | `users`, `deleteUser` | `adminApi.users`, `adminApi.deleteUser` |
| `routes/admin.users.new.tsx` | `createUser` | `adminApi.createUser` |
| `routes/admin.users.$id.edit.tsx` | `user`, `updateUser` | `adminApi.user`, `adminApi.updateUser` |
| `routes/admin.notes.tsx` | `allNotes` | `adminApi.notes` |
| `routes/admin.interests.tsx` | `interests` | `adminApi.interests` |

Non-call `demo` references to clear as well: `styles.css` `.demo-credentials`,
the `Live demo` pill in `AppShell.tsx`, and the demo-credential blocks plus
prefilled demo emails and passwords in `login.tsx` and `admin.login.tsx`.

## Tasks

| ID | Title | Owner | Depends on | Status |
|---|---|---|---|---|
| T1 | Foundation | foundation | — | doing |
| T2 | User API | user-api | T1 | todo |
| T3 | Admin API | admin-api | T1 | todo |
| T4 | Aggregations | aggregation | T1 | todo |
| T5 | Backend security & lean pass | backend-reviewer | T2, T3, T4 | todo |
| T6 | Backend tests + explain report | tester | T5 | todo |
| T7 | Frontend API rewrite | frontend-api | T5 | todo |
| T8 | Frontend demo removal | frontend-cleanup | T7 | todo |
| T9 | Final review + README | reviewer | all | todo |

### T1 Foundation — branch `feat/foundation`
Files: `backend/package.json`, `backend/.env.example`, `backend/src/config/db.js`,
`backend/src/app.js`, `backend/src/server.js`,
`backend/src/middleware/{authUser,authAdmin,error,validate,rateLimit}.js`,
`backend/src/utils/{asyncHandler,paginate,token,password}.js`,
`backend/src/models/{User,Admin,Note,Post,SetupLock}.js`,
`backend/src/routes/{user,admin}/index.js` (empty routers).

Contract the other agents code against:
- `asyncHandler(fn)` → wrapped handler.
- `paginate(req)` → `{ page, limit, skip }`. Default limit 10, max 50, min page 1.
- `signUserToken(id)` / `signAdminToken(id)`; verification pins `algorithms: ["HS256"]`.
- `authUser` sets `req.user`, `authAdmin` sets `req.admin`, both loaded by `_id` so a deleted account loses access at once.
- `validate(schema)` parses `req.body`, strips unknown keys, replaces `req.body`, 400 on failure.
- `DUMMY_PASSWORD_HASH` from `utils/password.js` for the constant-time login path.
- Rate limiters live in `middleware/rateLimit.js` and are applied in `app.js` on the exact login, register and setup paths, so a route file cannot forget one.
- Password hashing is a pre-save hook on `User` and `Admin` (12 rounds, only when modified), so no controller can skip it.

Acceptance: `node --check` on every file; exactly 3 `schema.index(` calls and no `index: true` / `unique: true` in any model; no unused dependency; `app.js` exports the app without listening.

### T2 User API — branch `feat/user-api`
Files: `backend/src/routes/user/{index,auth,notes,posts}.js`, `backend/src/controllers/{userAuthController,noteController,postController}.js`, `backend/src/validators/user.js`.
Acceptance: paths and shapes match the contract; ownership enforced inside the query filter; invalid ObjectId → 404 with no DB call; one generic login message with a dummy compare on unknown email; every write route zod-validated.

### T3 Admin API — branch `feat/admin-api`
Files: `backend/src/routes/admin/{index,setup,auth,users,notes}.js`, `backend/src/controllers/{setupController,adminAuthController,adminUserController,adminNoteController}.js`, `backend/src/validators/admin.js`.
Acceptance: setup succeeds once then 404s; wrong key → 403 via `timingSafeEqual`; `grouped-by-interests` registered before `/users/:id`; deleting a user removes their notes and posts.

### T4 Aggregations — branch `feat/aggregation`
Files: `backend/src/controllers/aggregationController.js` only.
Acceptance: exactly one `aggregate(` per handler; interests shape `{ data: [{ interest, count, users }] }`; `postsByAuthor` casts with `new mongoose.Types.ObjectId`, uses `$lookup` with `let`+`pipeline` and a `$facet`, and 404s on a missing user.

### T5 Backend security & lean pass — branch `chore/backend-review`
Walks the CLAUDE.md security checklist line by line, strips dead code, unused deps and surplus comments. Reports findings; does not redesign.

### T6 Backend tests + explain report — branch `test/backend`
Files: `backend/tests/**`, `backend/vitest.config.js`, `docs/explain-report.md`. Adds vitest, supertest and mongodb-memory-server plus the `test` script. Does **not** fix source; logs bugs in the table below.

### T7 Frontend API rewrite — branch `feat/frontend-api`
Files: `src/lib/api.ts`, `.env.example`. Rewritten from scratch: two prefixes, two token keys, one 401 interceptor per panel redirecting to that panel's login, typed functions for every endpoint, no `role` anywhere.

### T8 Frontend demo removal — branch `chore/frontend-cleanup`
Every call site in the inventory above rewired; `src/lib/demo.ts` deleted; role picker and placeholder text removed; JSX, layout, classNames and styling otherwise untouched.

### T9 Final review + README — branch `chore/review`
`grep -ri demo src/` empty, clean build, one full flow traced against CLAUDE.md, every Definition-of-done item checked, README written. Only this agent flips statuses to `done`.

## Bugs

| # | Task | Description | Found by | Fixed by | Status |
|---|---|---|---|---|---|
