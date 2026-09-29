# CipherNote build board

Statuses: `todo` / `doing` / `done`. Only **T10 (reviewer)** may set `done`, and only
after running the acceptance check itself. Owning agents set `doing` and report
"ready for review" — never `done`.

## Task table

| ID | Title | Owner agent | Depends on | Files touched | Acceptance check | Status |
|---|---|---|---|---|---|---|
| T0 | Repo restructure to `/frontend` + `/backend` | restructure (orchestrator, main tree) | — | all root files → `frontend/`, delete legacy JS `backend/`, root `package.json`, `.gitignore` | `cd frontend && bun install && bun run build` succeeds; `bunx tsc --noEmit` clean; no frontend file left at repo root | doing |
| T1 | Backend foundation (TypeScript) | foundation | T0 | `backend/{package,tsconfig}.json`, `.env.example`, `src/{app,server}.ts`, `src/config/db.ts`, `src/middleware/*.ts`, `src/utils/*.ts`, `src/models/*.ts` | `tsc --noEmit` clean; exactly 3 `schema.index(` calls repo-wide; zero `index: true` / `unique: true` on a field; `app.ts` exports without listening; CORS registered before rate limiters (bug B1) | doing |
| T2 | User API | user-api | T1 | `src/routes/user/*.ts`, `src/controllers/{userAuth,note,post}Controller.ts`, `src/validators/user.ts` | every path/shape matches the API contract; ownership in the query filter; invalid ObjectId → 404 with no DB call; generic login message + dummy bcrypt compare; zod on every write | doing |
| T3 | Admin API | admin-api | T1 | `src/routes/admin/*.ts`, `src/controllers/{setup,adminAuth,adminUser,adminNote}Controller.ts`, `src/validators/admin.ts` | setup succeeds once then 404s; wrong key → 403 via `timingSafeEqual`; `grouped-by-interests` registered before `/users/:id`; user delete cascades to notes + posts | doing |
| T4 | Aggregations | aggregation | T1 | `src/controllers/aggregationController.ts` | exactly one `aggregate(` per handler, nothing else in the interests handler; `$lookup` with `let`+`pipeline`+`$facet`; id cast with `new mongoose.Types.ObjectId`; 404 on missing user | doing |
| T5 | Backend security & lean pass | backend-reviewer | T2, T3, T4 | all of `backend/src` | every CLAUDE.md security-checklist line verified in code; `tsc --noEmit` clean; no unjustified `any` in a model or controller signature; `build` and `dev` scripts both run; no dead code or unused deps | doing |
| T6 | Backend tests + explain report | tester | T5 | `backend/tests/**`, `backend/vitest.config.ts`, `docs/explain-report.md` | `npm test` green; covers the 10 listed cases; `explain("executionStats")` shows IXSCAN on all three indexed queries; logs bugs here, fixes none | doing |
| T7 | Frontend API rewrite | frontend-api | T5 | `frontend/src/lib/api.ts`, `frontend/.env.example` | two prefixes, two token keys, one 401 handler per panel; typed fn per contract endpoint; zero `role`; SSR-safe (no bare `localStorage`) | doing |
| T8 | Demo removal + `/` → login | frontend-cleanup | T7 | every file in the call-site inventory below | `grep -ri demo frontend/src` empty; `tsc --noEmit` + build clean; `/` renders the login form; styling/JSX unchanged | todo |
| T9 | Documentation | docs | T8 | root `README.md`, `CLAUDE.md` (paths only) | README covers both folders, both env sets, first-run admin setup, dev + test commands | todo |
| T10 | Final review | reviewer | all | `TASKS.md` | every box below ticked by the reviewer directly | todo |

## Execution phases

1. T0 alone → verify frontend still runs. 2. T1 alone. 3. **T2 ‖ T3 ‖ T4** concurrent.
4. T5 alone. 5. T6, looping with T2/T3/T4 owners until green. 6. T7. 7. T8. 8. T9. 9. T10.

---

## Progress log (orchestrator)

Merged to `master`, verified by the orchestrator, awaiting T10 sign-off. None of
these are `done` — only T10 flips that.

| Task | Merge commit | What the orchestrator checked itself |
|---|---|---|
| T0 | `7c29304` | `frontend/` builds (`vite build` ✓) and `tsc --noEmit` is clean; no frontend file left at repo root; legacy JS backend dropped |
| T1 | `01cf840` | `tsc --noEmit` clean; exactly 3 `schema.index(` calls; zero `index: true` / field-level `unique: true`; CORS registered before the limiters (B1 fixed); `app.ts` exports without listening |
| T4 | `0e980de` | `tsc --noEmit` clean; exactly one `aggregate<T>(` per handler and nothing else in the interests handler; stage order matches CLAUDE.md; `$facet` empty-total yields `0` |
| T2 | `b252ec8` | `tsc --noEmit` clean; ownership in the query filter (other-owner is indistinguishable from missing → 404); one bcrypt compare on every login path; zod strips unknown keys; no `role` anywhere |

T3 (admin-api) was still running at the time of writing.

## Mismatches found in Step 0

The brief listed five "confirmed facts". Three are wrong, and two of the errors
change the plan. CLAUDE.md still wins on every path, shape, model and security
decision — these are corrections to the *starting state*, not to the target.

| # | Brief said | Actually | Consequence |
|---|---|---|---|
| M1 | "`api.ts` is dead code — nothing imports it." | `AuthContext.tsx:2` imports five **runtime** values from it (`api`, `clearSession`, `getStoredToken`, `getStoredUser`, `saveSession`), and `AuthProvider` is mounted in `__root.tsx`, so `api.me()` already fires on every page load. Nine more files import its **types**. | T7 cannot treat `api.ts` as greenfield. Rewriting it changes live behaviour in `AuthContext` and breaks 9 type imports, all of which T7/T8 must land together. |
| M2 | "React + Vite" (CLAUDE.md) / plain SPA (brief) | **TanStack Start**: SSR via nitro, file-based routing (`routeTree.gen.ts` is generated), custom `src/server.ts` SSR error wrapper and `src/start.ts` CSRF middleware. Dev server is port **8080**, not 5173. | Biggest deviation. (a) There is no `ProtectedRoute` — guards are `Protected`/`AdminOnly` in `AuthGuards.tsx`. (b) Every token read must stay SSR-safe (`typeof window === "undefined"` guards) or SSR crashes. (c) `src/routes/index.tsx` **is** the `/` route — see D1. |
| M3 | Build the backend fresh | A complete **plain-JS** backend is already tracked at `backend/` in `HEAD`, deleted in the working tree, with more WIP on four stale worktree branches. | Requirement is TypeScript, so the JS is reference material, not a base. Preserved as commits `b6ed17a` / `616823e` / `7aafd68`, then the tree is dropped in T0. Its one known defect (B1) carries forward. |
| M4 | CLAUDE.md: `/user-panel` + `/admin-panel`, two apps | One app with `/admin/*` routes. Brief overrides CLAUDE.md here and says both CORS values may point at the same origin. | CLAUDE.md's repo-layout, port and "user never downloads admin code" claims become inaccurate; T9 corrects the paths. Both token keys share one origin's `localStorage`, which is exactly why two distinct keys are needed. |
| M5 | — | CLAUDE.md's `GET /api/user/posts` is a **public feed of all posts**; the current `/posts` page shows only the signed-in user's own posts, and `admin.users.tsx` links to `/posts?userId=…` where CLAUDE.md defines `/posts/author/:id`. | T8 wires no-`userId` → feed, `?userId=` → by-author. Composer stays. |
| M6 | — | No local `mongod` binary. `fastdl.mongodb.org` and the npm registry are both reachable. | T6 and T10's end-to-end trace both run against `mongodb-memory-server`, not a live server. |

## Decisions taken (flagged for the user)

- **D1 — `src/routes/index.tsx` cannot simply be deleted.** In TanStack Start's
  file-based router that file *is* the `/` route; with it gone, `/` 404s, which
  contradicts "`/` renders the login page". The brief anticipated this and allowed
  a thin physical file. Taken: `login.tsx`'s markup moves into a `LoginPage`
  component, and both `index.tsx` and `login.tsx` render it — so `/` shows the real
  login form (not a redirect), with no duplicated JSX. The old landing-page content
  is deleted. `DONE WHEN: src/routes/index.tsx is gone` is therefore met in spirit,
  not literally: the file exists at 3 lines. Say the word if you want a hard
  redirect instead.
- **D2 — T0 runs in the main tree, not a worktree.** It is a ~100-file `git mv`
  that runs alone in its phase, so a worktree buys no isolation and makes every
  later branch conflict. Worktree-per-agent resumes from T1.
- **D3 — `register.tsx` does not collect interests**, which CLAUDE.md's register
  body requires. Sending `[]` and leaving the form alone (styling is out of scope
  for T8).
- **D4 — `admin.overview.tsx` is built from `demo.workspace()`**, a whole fake
  database with no backend equivalent. Rewired to real totals from the paginated
  user/note endpoints rather than deleted, since it is the admin landing route.

## Demo call-site inventory (input to T8)

`src/lib/demo.ts` — **delete** once the 12 files below are clear. `src/lib/api.ts` is
rewritten by T7.

| File | demo calls | Notes |
|---|---|---|
| `components/AppShell.tsx` | `demo.logout()` ×2, `useDemoUser()` | also drop the "Live demo" status pill |
| `components/AuthGuards.tsx` | `demo.session()`, `useDemoUser` export | rename to `useCurrentUser`; drop `role` gate in favour of per-panel token |
| `components/UserForm.tsx` | — | drop the **role picker** and `role` from `UserPayload` |
| `routes/index.tsx` | — | deleted per D1 |
| `routes/login.tsx` | `demo.login(…, "user")` | drop seeded `lee@inkwell.demo` / `member123` + `.demo-credentials` block |
| `routes/admin.login.tsx` | `demo.login(…, "admin")` | drop seeded `ada@inkwell.demo` / `admin123` + credentials block |
| `routes/register.tsx` | `demo.register` | see D3; also bug B2 |
| `routes/notes.tsx` | `demo.notes`, `demo.deleteNote` | |
| `routes/notes.new.tsx` | `demo.createNote` | |
| `routes/notes.$id.edit.tsx` | `demo.note`, `demo.updateNote` | |
| `routes/posts.tsx` | `demo.posts`, `demo.createPost`, `useDemoUser` | see M5 |
| `routes/admin.users.tsx` | `demo.users`, `demo.deleteUser` | drop the Role column and the "demo owner" guard |
| `routes/admin.users.new.tsx` | `demo.createUser` | |
| `routes/admin.users.$id.edit.tsx` | `demo.user`, `demo.updateUser` | |
| `routes/admin.notes.tsx` | `demo.allNotes` | drop the `"Try u-lee"` placeholder |
| `routes/admin.interests.tsx` | `demo.interests` | |
| `routes/admin.overview.tsx` | `demo.workspace`, `DemoWorkspace`, `role === "user"` | see D4 |

Type-only importers of `api.ts` that T7 must keep compiling: `components/{Pagination,Notes,UserForm,AuthGuards}.tsx`,
`context/AuthContext.tsx`, `routes/{notes,posts,admin.notes,admin.users,admin.users.$id.edit}.tsx`.

## Bugs

| # | Task | Description | Found by | Fixed by | Status |
|---|---|---|---|---|---|
| B1 | T1 | Rate limiters registered before the per-router CORS middleware, so a 429 carries no `Access-Control-Allow-Origin` and the browser reports a network failure instead of the throttle message. Carried forward from the legacy JS backend (commit `b7e11b0`); the TypeScript rewrite must not reintroduce it. Repro: exceed the login limiter from the browser, observe a network error rather than a 429 body. | orchestrator (read of legacy `app.js`) | T1 | open |
| B2 | T8 | `frontend/src/routes/register.tsx:9` — the "Confirm password" field's `onChange` calls `setPassword`, not `setConfirmPassword`, so `confirmPassword` stays `""` and the mismatch check is unreachable. Repro: register with two different passwords → accepted. | orchestrator (read of `register.tsx`) | T8 | open |

## Definition of done (T10 ticks these directly)

- [ ] Repo root has `/frontend` and `/backend` as siblings, nothing cross-contaminated
- [ ] `/` renders the login page; no landing page remains (D1)
- [ ] A user token is rejected by every admin route, and an admin token by every user route
- [ ] Setup route creates the admin once, then 404s
- [ ] Every list route paginated, default limit 10, max 50
- [ ] Exactly the 3 CLAUDE.md indexes exist, all via `schema.index()`
- [ ] Both aggregation scenarios use a single `aggregate()` call
- [ ] `tsc --noEmit` clean in `/backend`
- [ ] `npm test` green in `/backend`
- [ ] `grep -ri demo frontend/src` returns nothing
- [ ] Query plans show IXSCAN where an index is expected
- [ ] README explains setup, env variables, and first-time admin setup
| B3 | T1 | `backend/.env.example` set `USER_PANEL_URL=http://localhost:5173` and `ADMIN_PANEL_URL=http://localhost:5174`, but the frontend is a single TanStack Start app on port **8080**, so both CORS origins rejected every real browser request. Repro: start backend with the example env, call `/api/user/auth/login` from the app, observe the preflight failure. | orchestrator (T1 verification) | orchestrator, commit `0cda7cf` | fixed |

## Open findings (not bugs — need a decision or a later owner)

| # | Raised by | Finding | Disposition |
|---|---|---|---|
| F1 | T2 | No `test` script and no test deps in `backend/package.json`, while CLAUDE.md's Commands section lists `npm test` and Definition of done requires passing tests. | T6 owns this; it installs vitest/supertest/mongodb-memory-server and adds the script. |
| F2 | T2 | CLAUDE.md does not specify status codes or envelopes for note/post writes. T2 chose 201 + bare object (create), 200 + bare object (get/update), 204 empty (delete). | Accepted — matches CLAUDE.md's documented bare `Note` / `Post` shapes. T7 must type the frontend against exactly this. |
| F3 | T2 | Responses include Mongoose's `__v`, one field beyond the documented shapes. | Accepted as harmless and consistent; the panels ignore it. Not worth a projection on every read. |
| F4 | T2 | `types/express.d.ts` declares `user?`/`admin?` optional while `AuthedRequest`/`AdminRequest` assert them required, bridged by a cast in `asyncHandler`. Correct at runtime because the auth middleware always runs first, but the compiler is not what guarantees it — a controller mounted without `authUser` would typecheck and then crash at runtime. | Left as T1 designed it. T5 should confirm every protected route really carries its auth middleware, since types will not catch a miss. |
| B4 | T2 | `validators/user.ts` used `z.email().toLowerCase()`; zod 4 runs the format check *before* the transform, so `"  ada@example.com  "` and `" A@B.CO "` were rejected on both register and login. Repro verified with a throwaway script against the merged schema. | admin-api agent (flagged cross-task), confirmed by orchestrator | orchestrator, commit on master | fixed |
