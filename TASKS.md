# CipherNote backend build

Board for the backend build. Owner agents update `status` as work moves.

## Mismatches (frontend vs CLAUDE.md)

`src/lib/api.ts` is **dead scaffolding**: no file imports it. All 15 route and
component files call `demo.*` from `src/lib/demo.ts`. So the frontend is not a
working client of any contract yet.

Ruling: **CLAUDE.md wins for paths**, because api.ts cannot express two panels
(one token key, no panel prefixes, no admin auth, no setup). Where api.ts
declares a response **shape**, that shape is honoured exactly.

| # | api.ts / frontend | CLAUDE.md | Resolution |
|---|---|---|---|
| M1 | `/auth/login`, `/notes`, `/users`, `/posts` (no panel prefix) | `/api/user/*` and `/api/admin/*` | CLAUDE.md. Rewrite api.ts with two prefixed clients |
| M2 | one token key `inkwell_token` | `user_token` + `admin_token` | CLAUDE.md. Two keys, two sessions |
| M3 | `User.role: "user" \| "admin"`; `UserForm` has a role picker | two collections, no role field, no route to create an admin | CLAUDE.md. Drop `role` from the model, the payload, the form select and the users table column. A picker that the backend strips would be a control that silently does nothing |
| M4 | no admin login, no setup, no admin-prefixed calls | admin login + one-time setup | CLAUDE.md. Add them to api.ts and add a `/admin/setup` route |
| M5 | `api.users` → `/users` (collides with the user panel) | `/api/admin/users` | CLAUDE.md |
| M6 | `api.posts(userId)` → `/users/:id/posts` | user: `/api/user/posts/author/:id`, admin: `/api/admin/users/:id/posts` | CLAUDE.md. Same handler behind both |
| M7 | posts page lists only the signed-in author's posts | `GET /api/user/posts` is a public feed | Keep the page's own-posts view via the by-author route. Feed route still exists |
| M8 | `demo.workspace()` dumps the whole workspace for the admin overview | no such endpoint | Compose the overview from `/admin/users`, `/admin/notes`, `/admin/users/grouped-by-interests` |
| M9 | `AuthGuards` reads `demo.session()` and a role | per-panel auth context | Two contexts: `AuthContext` (user) and `AdminAuthContext` |
| M10 | note lists sort by `updatedAt` | sort by `_id` desc (index `{owner:1,_id:-1}`) | CLAUDE.md. Display is unaffected |
| M11 | frontend is one app on `:8080`; user pages link to `/admin/*` | two apps on `:5173` / `:5174`, no link between them | One app, per the orchestrator brief. Backend keeps two routers, two collections, two secrets. Both CORS values point at `:8080` |
| M12 | `register.tsx` confirm-password field calls `setPassword` | — | Frontend bug, blocks registration. Fix in T6 |
| M13 | demo credentials printed on both login pages; `"Live demo"` pill; `"Try u-lee"` placeholder | no placeholder text anywhere | Remove in T6 |

## Tasks

### T1 Foundation — agent: foundation — status: todo
Depends on: nothing.
Files: `backend/package.json`, `backend/.env.example`, `backend/src/config/db.js`,
`backend/src/app.js`, `backend/src/server.js`, `backend/src/middleware/{authUser,authAdmin,error,validate}.js`,
`backend/src/utils/{asyncHandler,paginate,token}.js`, `backend/src/models/{User,Admin,Note,Post,SetupLock}.js`,
`backend/src/routes/user/index.js`, `backend/src/routes/admin/index.js`.

Contract the other agents code against:
- `asyncHandler(fn)` → wrapped handler.
- `paginate(req)` → `{ page, limit, skip }`; default limit 10, max 50.
- `signUserToken(id)` / `signAdminToken(id)`; verify pins `algorithms: ["HS256"]`.
- `authUser` → sets `req.user` (Mongoose doc, no password). `authAdmin` → sets `req.admin`.
- `validate(schema)` → parses `req.body`, strips unknown keys, replaces `req.body`, 400 on failure.
- `routes/user/index.js` and `routes/admin/index.js` export an `express.Router()`. T1 leaves them empty; T2 owns the user one from then on, T3 the admin one.
- Only three indexes, all via `schema.index()`.

Acceptance: `node --check` passes on every file; `npm ls` shows no unused dependency; `grep -rn "index: true\|unique: true" backend/src/models` is empty; exactly 3 `schema.index(` calls.

### T2 User API — agent: user-api — status: todo
Depends on: T1.
Files: `backend/src/routes/user/{index,auth,notes,posts}.js`, `backend/src/controllers/{userAuthController,noteController,postController}.js`, `backend/src/validators/user.js`.
Scope: register, login, me; notes CRUD scoped by `{ _id, owner: req.user._id }`; post create and public feed. Mounts `postsByAuthor` from T4 at `GET /posts/author/:id`.
Acceptance: paths and shapes match the API contract table; ownership enforced in the query filter; invalid ObjectId → 404 with no DB call; one generic login error message plus a dummy bcrypt compare on unknown email.

### T3 Admin API — agent: admin-api — status: todo
Depends on: T1.
Files: `backend/src/routes/admin/{index,setup,auth,users,notes}.js`, `backend/src/controllers/{setupController,adminAuthController,adminUserController,adminNoteController}.js`, `backend/src/validators/admin.js`.
Scope: setup status + one-time setup (`SetupLock`, `crypto.timingSafeEqual`), admin login and me, users CRUD with cascade delete of notes and posts, all-notes list with optional `userId` filter. Mounts T4's handlers at `GET /users/grouped-by-interests` (before `/users/:id`) and `GET /users/:id/posts`.
Acceptance: setup works once then 404s; wrong setup key → 403; `grouped-by-interests` registered before `:id`; delete removes the user's notes and posts.

### T4 Aggregations — agent: aggregation — status: todo
Depends on: T1.
Files: `backend/src/controllers/aggregationController.js` only.
Exports `usersGroupedByInterests` and `postsByAuthor`. Exactly one `aggregate()` call each. `postsByAuthor` starts from `User.aggregate`, casts with `new mongoose.Types.ObjectId(id)`, uses `$lookup` with `let` + `pipeline`, and a `$facet` of `data` / `total`. Shared by the user route and the admin route.
Acceptance: one `aggregate(` per handler; interests response is `{ data: [{ interest, count, users }] }`; missing user → 404.

### T5 Tests — agent: tester — status: todo
Depends on: T2, T3, T4.
Files: `backend/tests/**`, `backend/vitest.config.js`, `docs/explain-report.md`. Does **not** edit source; reports bugs in this file.
Covers: register/login, one generic login error, cross-panel token rejection both ways, note ownership 404, invalid ObjectId 404, pagination default 10 and max 50, setup once then 404, password never returned, both aggregations, delete-user cascade. Then `explain("executionStats")` on every list query and both pipelines, written up in `docs/explain-report.md`.
Acceptance: `npm test` green in `/backend`; IXSCAN confirmed where an index is expected.

### T6 Frontend cleanup — agent: frontend-cleanup — status: todo
Depends on: T1 (contract only).
Files: `src/lib/api.ts`, `src/context/{AuthContext,AdminAuthContext}.tsx`, `src/components/AuthGuards.tsx`, `src/components/{AppShell,UserForm}.tsx`, every `src/routes/*.tsx` that imports `demo`, `src/routes/admin.setup.tsx`, `.env.example`. Deletes `src/lib/demo.ts`.
Scope: real API through `VITE_API_URL`, token keys `user_token` and `admin_token`, no demo data or placeholder text left. No UI or styling changes.
Acceptance: `grep -rn "demo" src` returns nothing; `npm run lint` and `tsc --noEmit` clean; no file imports `@/lib/demo`.

### T7 Review and docs — agent: reviewer — status: todo
Depends on: T5, T6.
Files: `README.md`, plus removals across `backend/src` and `src`.
Scope: walk the CLAUDE.md security checklist and Definition of Done line by line, strip dead code and unused packages and surplus comments, write the README (setup, env, first-time admin setup, tests).
Acceptance: every checklist line verified or reported; README covers all four topics.

## Bugs found by the tester

Filed here by T5, fixed by the owning agent. Empty until T5 runs.

| # | Task | Bug | Status |
|---|---|---|---|
