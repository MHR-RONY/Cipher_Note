# CipherNote

A secure note-taking workspace with two separate areas: a member notebook for
writing private notes and public posts, and an administrator console for
managing people and reviewing everything they write.

Author: [mhrrony.com](https://mhrrony.com)

## What's inside

**Member area** — private notes with a borderless editor, a public posts feed,
and per-author post views. A member only ever sees their own notes.

**Administrator console** — a collapsible sidebar shell over people management,
an all-notes view filterable by user, and an interests breakdown that groups
members by the topics they picked.

The two areas have their own sign-in pages, their own shell, and their own
navigation. Nothing in the member area links into the admin area.

## Stack

| Part            | Choice                                           |
| --------------- | ------------------------------------------------ |
| Framework       | React 19 + TanStack Start (SSR)                  |
| Routing         | TanStack Router, file-based                      |
| Data fetching   | TanStack Query                                   |
| Styling         | Tailwind CSS 4, dark Notion-style theme          |
| Components      | Radix UI primitives, lucide icons, sonner toasts |
| Validation      | zod + react-hook-form                            |
| Build           | Vite 8, TypeScript                               |
| Package manager | bun                                              |

## Quick start

```sh
git clone https://github.com/MHR-RONY/Cipher_Note.git
cd Cipher_Note
bun install
bun run dev
```

The dev server listens on [http://localhost:8080](http://localhost:8080).

`npm install && npm run dev` works too, but `bun.lock` is the committed
lockfile and `bunfig.toml` carries a supply-chain guard that only bun reads.

## Environment

Create `.env` in the project root:

```
VITE_API_URL=http://localhost:5000/api
```

It defaults to `http://localhost:5000/api` when unset.

## Scripts

| Command           | Does                       |
| ----------------- | -------------------------- |
| `bun run dev`     | Dev server on port 8080    |
| `bun run build`   | Production build           |
| `bun run preview` | Serve the production build |
| `bun run lint`    | ESLint over the repo       |
| `bun run format`  | Prettier write             |

## Routes

| Path                                        | Area   | Page                        |
| ------------------------------------------- | ------ | --------------------------- |
| `/`                                         | public | Landing page, pick an area  |
| `/login`, `/register`                       | public | Member sign in and sign up  |
| `/notes`                                    | member | Own notes, paginated        |
| `/notes/new`, `/notes/:id/edit`             | member | Note editor                 |
| `/posts`                                    | member | Public feed and create form |
| `/posts?userId=:id`                         | member | Posts by one author         |
| `/admin/login`                              | public | Administrator sign in       |
| `/admin/overview`                           | admin  | Workspace summary           |
| `/admin/users`                              | admin  | People list, paginated      |
| `/admin/users/new`, `/admin/users/:id/edit` | admin  | Member forms                |
| `/admin/notes`                              | admin  | All notes, filter by member |
| `/admin/interests`                          | admin  | Members grouped by interest |

## Project structure

```
src
  routes/          file-based routes; routeTree.gen.ts is generated
  components/      AppShell, AuthGuards, Notes, Forms, Pagination
  components/ui/   Radix-based primitives
  context/         AuthContext (account, token, loading)
  lib/api.ts       REST client, bearer auth, 401 handling
  lib/demo.ts      local workspace store used by the current pages
  server.ts        SSR entry with an error boundary
  start.ts         request middleware, CSRF for server functions
  styles.css       theme tokens and layout
```

## Data layer

`src/lib/api.ts` is the real client for the backend API. It attaches
`Authorization: Bearer <token>`, and on a 401 it clears the stored session and
sends the visitor back to `/login`. `AuthContext` restores a session on load by
calling `/auth/me`.

The pages currently read and write through `src/lib/demo.ts`, a
localStorage-backed workspace, so the UI runs end to end without a server.
Swapping a page over to the live API means changing its `demo` calls to the
matching `api` calls — the response shapes already line up.

Demo sign-in while that store is in place:

| Area          | Email              | Password    |
| ------------- | ------------------ | ----------- |
| Member        | `lee@inkwell.demo` | `member123` |
| Administrator | `ada@inkwell.demo` | `admin123`  |

## Security notes

- Server functions sit behind CSRF middleware (`src/start.ts`).
- SSR failures render an error page instead of leaking a stack trace.
- `bunfig.toml` skips package versions published in the last 24 hours.
- Write forms validate with zod before anything is sent.

Route guards and the demo store run in the browser, so they shape the
experience rather than enforce access. Authorization belongs to the API.
