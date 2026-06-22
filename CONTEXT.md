# CONTEXT.md — Personal Knowledge Base

> **Audience:** new contributors, future-you, or any AI coding agent picking up
> this repo cold. Read this first; you should be productive within 15 minutes.
>
> **Last updated:** 2026-06-22 (matches the state on `origin/main` after
> initial commit).

---

## 1. What this is

A **single-user personal knowledge base** — a note-taking web app with
authentication, rich-text editing, folders, tags, pinning, full-text search,
and dark mode. Designed for **dev-scale / personal use** (SQLite, one account,
local Kestrel). The architectural ceiling is set by `docs/PHASE8_PLAN.md` §1
("personal / dev-scale project; production multi-user scale would need
PostgreSQL + containerisation").

It is intentionally **not** a multi-tenant SaaS. There is no team concept, no
billing, no email delivery. Email is auto-confirmed at registration; password
reset, 2FA, "remember me" are explicitly out of scope (`PHASE8_PLAN.md` §1).

---

## 2. Tech stack (binding versions)

| Layer | Tech | Version pinned |
|---|---|---|
| Frontend framework | React + Vite + TypeScript | 18.3 / 5.4 / 5.6 (strict + `noUncheckedIndexedAccess`) |
| Routing | React Router | 6.30 |
| Server-state | TanStack Query | 5.59 |
| HTTP | axios | 1.7 (with a typed `ApiError` envelope mapper) |
| UI primitives | Radix UI + shadcn/ui (New York / Slate) | latest |
| Styling | Tailwind CSS | 3.4 |
| Rich-text editor | TipTap (StarterKit + Link) | 2.27 |
| Forms | react-hook-form + zod | 7.80 / 3.25 |
| Toasts | sonner | 2.0 |
| Theme | next-themes | 0.3 |
| Icons | lucide-react | 0.474 |
| Backend | ASP.NET Core Web API | 10 (LTS) |
| ORM | EF Core + SQLite | 10 |
| Auth | ASP.NET Core Identity + JWT Bearer | — |
| Password hashing | PBKDF2 via Identity | — |
| Search | SQLite FTS5 virtual table + sync triggers | — |
| Logging | Serilog (console + daily-rolling file, 14-day retention) | — |
| Mapping | Mapster | — |
| API docs | Swashbuckle (Swagger UI) | — |

Full dependency manifests: [client/package.json](client/package.json) ·
[server/PersonalKnowledgeBase.Api/PersonalKnowledgeBase.Api.csproj](server/PersonalKnowledgeBase.Api/PersonalKnowledgeBase.Api.csproj).

---

## 3. Repository layout (monorepo)

```
D:\JamProject\PersonalKnowledgeBase\
├── client/                              React 18 + Vite + TS frontend
│   ├── src/
│   │   ├── api/                         axios client + typed API modules
│   │   │   ├── client.ts                ApiError envelope mapper
│   │   │   ├── auth.ts  notes.ts  tags.ts  folders.ts  search.ts  types.ts
│   │   ├── auth/                        AuthContext + ProtectedRoute + RedirectIfAuthed
│   │   ├── components/
│   │   │   ├── auth/                    AuthShell, LoginForm, RegisterForm
│   │   │   ├── editor/                  RichTextEditor, EditorToolbar, FolderSelect, TagInput
│   │   │   ├── layout/                  Layout, Header, FolderSidebar, MobileFolderSheet,
│   │   │   │                            NewFolderDialog, DeleteFolderDialog, ThemeToggle, UserMenu
│   │   │   ├── notes/                   NoteCard, NoteList, PinButton, TagChip, FolderBadge,
│   │   │   │                            DeleteNoteDialog, DiscardChangesDialog, skeletons, errors
│   │   │   ├── search/                  SearchBar (debounced 250ms + "/" shortcut)
│   │   │   ├── theme/                   ThemeProvider (next-themes wrapper)
│   │   │   └── ui/                      17 shadcn primitives (Radix-based)
│   │   ├── hooks/                       TanStack Query hooks (notes, tags, folders, search)
│   │   ├── lib/                         utils, logger, tokenStorage, queryClient,
│   │   │                                toast, error mappers, parseSnippet, schemas/
│   │   ├── pages/                       routed pages + DashboardEmptyState
│   │   ├── routes/router.tsx            createBrowserRouter with nested AuthProvider/Layout
│   │   ├── index.css                    shadcn CSS variables + tailwind layers
│   │   └── main.tsx                     entry — mounts <RouterProvider /> + <Toaster />
│   ├── vite.config.ts                   dev proxy /api → :5000, manualChunks split (7 vendors)
│   ├── tailwind.config.js, postcss.config.js, components.json
│   ├── tsconfig.{json,app,node}.json    strict + noUncheckedIndexedAccess
│   └── eslint.config.js                 flat config, 0 errors gate
│
├── server/
│   ├── PersonalKnowledgeBase.Api/       Web API project
│   │   ├── Controllers/                 5 controllers, 16 endpoints + /health
│   │   │   ├── AuthController.cs        /api/auth/register, /login, /me
│   │   │   ├── NotesController.cs       CRUD + PATCH /{id}/pin
│   │   │   ├── TagsController.cs        CRUD
│   │   │   ├── FoldersController.cs     CRUD (delete → notes fall to no-folder)
│   │   │   └── SearchController.cs      /api/search?q=… FTS5
│   │   ├── Data/AppDbContext.cs         EF Core, configures all relationships
│   │   ├── DTOs/                        request/response DTOs + ErrorResponse envelope
│   │   ├── Mappings/MapsterConfig.cs    one-liner DI registration
│   │   ├── Middleware/ExceptionHandlingMiddleware.cs
│   │   ├── Migrations/                  3 EF Core migrations (InitialCreate, TagFolderNameNocase, AddNotesFts)
│   │   ├── Models/                      Note, Tag, Folder, NoteTag, ApplicationUser
│   │   ├── Services/                    I+ impl: Auth, Note, Tag, Folder, Search, Token
│   │   ├── Logs/                        Serilog output, gitignored
│   │   ├── Properties/, appsettings*.json
│   │   ├── PersonalKnowledgeBase.Api.csproj
│   │   └── Program.cs                   DI + Identity + JWT + Serilog + Swagger + CORS
│   └── PersonalKnowledgeBase.sln
│
├── docs/                                Binding specs and per-phase plans
│   ├── PLAN.md                          original tech-stack + roadmap (§1–12)
│   ├── PHASE1_PLAN.md … PHASE8_PLAN.md  per-phase plans, each ending in a verdict
│   └── PHASE4_REVIEW.md                 code-reviewer 5-axis review example
│
├── scripts/
│   ├── smoke-test.ps1                   E2E (PowerShell) — see PHASE8_PLAN.md §3.2
│   └── smoke-test.sh                    E2E (bash)
│
├── fix-fts/                             scratch / debug project for the FTS5 fix
│
├── README.md                            5-min quickstart + API reference + troubleshooting
├── AGENTS.md                            agent guidance (skills / personas / orchestration)
├── CONTEXT.md                           ← you are here
├── skills-lock.json                     pinned skill versions
└── .github/                             CI configs + Claude / OpenCode skill packs
    ├── skills/<skill-name>/SKILL.md     workflow skills (api-and-interface-design,
│                                        frontend-ui-engineering, …)
    └── agents/<role>.md                 personas (code-reviewer, security-auditor, …)
```

---

## 4. Domain model (EF Core / SQLite)

```
ApplicationUser  ─┐
  Id, Email, UserName, PasswordHash    ◄── Identity-managed
                    │
                    │ 1
                    │
                    ▼ *
                Note
                  Id (Guid)
                  Title              (max 200)
                  ContentJson        (TipTap JSON; default "{}")
                  ContentText        (plain text projection; FTS5-indexed)
                  IsPinned
                  UserId (FK) ────► ApplicationUser
                  FolderId (FK, nullable) ──► Folder
                  CreatedAt, UpdatedAt
                    │
                    │ *
                    ▼
                NoteTag  (junction)
                  NoteId, TagId
                    │
                    ▼ *
                  Tag
                    Id, Name (unique per user, case-insensitive — collation set
                              in `TagFolderNameNocase` migration)
                    UserId (FK)

                Folder
                  Id, Name (unique per user, case-insensitive)
                  UserId (FK), CreatedAt

Virtual:   notes_fts(title, content_text)   ◄── FTS5; kept in sync by triggers
                                             created in `AddNotesFts` migration
```

**Two-form note content** ([server/.../Models/Note.cs:18-25](server/PersonalKnowledgeBase.Api/Models/Note.cs#L18-L25))
is a deliberate trade-off (see `docs/PLAN.md` §11.2): `ContentJson` for editor
round-trip, `ContentText` for FTS5 indexing. The SearchService is responsible
for keeping the FTS table in sync with `ContentText` on note write paths.

---

## 5. API surface (16 + /health)

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | Returns `{ token, user }`. `EmailConfirmed = true` always. |
| POST | `/api/auth/login` | — | Returns `{ token, user }`. JWT TTL 7 days, 1-min clock skew. |
| GET | `/api/auth/me` | ✅ | Current user payload. |
| GET | `/api/notes?folderId=&tagId=&isPinned=` | ✅ | User-scoped list, filtered. |
| GET | `/api/notes/{id}` | ✅ | User-scoped fetch. |
| POST | `/api/notes` | ✅ | Body: `{ title, contentJson, contentText, folderId?, tagIds[] }`. |
| PUT | `/api/notes/{id}` | ✅ | Replace-style update. |
| DELETE | `/api/notes/{id}` | ✅ | Hard delete. |
| PATCH | `/api/notes/{id}/pin` | ✅ | Toggle `isPinned`. |
| GET | `/api/tags` | ✅ | User-scoped. |
| POST | `/api/tags` | ✅ | Body: `{ name }`. |
| DELETE | `/api/tags/{id}` | ✅ | Hard delete; cascades through `NoteTag`. |
| GET | `/api/folders` | ✅ | User-scoped. |
| POST | `/api/folders` | ✅ | Body: `{ name }`. |
| DELETE | `/api/folders/{id}` | ✅ | Notes belonging to it are set to `folderId = null` (no cascade delete). |
| GET | `/api/search?q=&offset=&limit=` | ✅ | FTS5; returns `{ items[], total, offset, limit }` with highlighted snippets. |
| GET | `/health` | — | Liveness probe — `{ "status": "ok" }`. |

**Error envelope** ([server/.../DTOs/ErrorResponse.cs](server/PersonalKnowledgeBase.Api/DTOs/ErrorResponse.cs)):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { /* field → messages */ } } }
```
The frontend `api/client.ts` maps this into a typed `ApiError` with a `code`
enum (`VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`,
`SEARCH_QUERY_TOO_MANY_TOKENS`, `NETWORK_ERROR`, `UNKNOWN`).

**JWT 401 challenge** is custom: returns the same envelope shape instead of the
default empty 401 ([server/.../Program.cs:130-138](server/PersonalKnowledgeBase.Api/Program.cs#L130-L138)).
`OnChallenge` writes
`{"error":{"code":"UNAUTHORIZED","message":"Authentication required."}}`.

---

## 6. Frontend architecture

- **Routing** ([client/src/routes/router.tsx](client/src/routes/router.tsx)) —
  `createBrowserRouter` with a single root `<Layout>` wrapped in
  `<AuthProvider>`. Nested route guards:
  - `<RedirectIfAuthed>` — `/login`, `/register` (bounce already-authed
    visitors to `?next=` or `/`).
  - `<ProtectedRoute>` — dashboard, `/notes/new`, `/notes/:id`,
    `/notes/:id/edit`, `/search`.
- **Auth state** ([client/src/auth/AuthContext.tsx](client/src/auth/AuthContext.tsx)) —
  `user`, `isAuthenticated`, `isLoading`, plus `login(token, user, next?)` and
  `logout()`. Token persisted in `localStorage` under `pkb_token` via
  `lib/tokenStorage.ts`.
- **Server state** ([client/src/hooks/](client/src/hooks/)) — one TanStack
  Query hook per resource + per mutation. Optimistic updates with rollback on
  error (pin / delete / update). Mutations toast `success` and `error`.
  `staleTime: 5 * 60_000`, `retry: 1` ([client/src/lib/queryClient.ts](client/src/lib/queryClient.ts)).
- **Forms** — RHF + zod resolver + shadcn `<Form>`. Auth + note create/edit
  schemas live under `client/src/lib/schemas/`.
- **Editor** — TipTap with StarterKit + Link. Saves both
  `ContentJson` and `ContentText` (the latter is derived from the JSON by
  walking the doc on blur or save).
- **Search** — debounced `SearchBar` in the header (250 ms, top-5 dropdown,
  `<mark>`-highlighted snippets via `lib/parseSnippet.ts`), plus a
  dedicated `/search?q=&offset=` page with "Load more" pagination.
- **Theme** — `next-themes` with class strategy; CSS variables defined in
  `index.css` per shadcn convention.
- **Vite dev proxy** — `client/vite.config.ts:19-24` forwards `/api` to
  `http://localhost:5000`. No CORS gymnastics in the browser during dev.

### Bundle budget

| Chunk | Purpose | Approx gzip |
|---|---|---|
| `index` | app + router + query | ~59 kB |
| `tiptap` | editor (isolated vendor) | largest single vendor |
| 6 other vendors | radix / form / icons / etc | smaller |

Total gzipped is ~340 kB (under the 500 kB warn threshold) — see
`docs/PHASE7_PLAN.md` §9.

---

## 7. Configuration & secrets

`server/PersonalKnowledgeBase.Api/appsettings.json` (committed; safe defaults):

```json
{
  "ConnectionStrings": { "Default": "Data Source=app.db" },
  "JwtSettings": {
    "Issuer": "PersonalKnowledgeBase",
    "Audience": "PersonalKnowledgeBase.Client",
    "Key": "REPLACE_WITH_SECURE_KEY_AT_LEAST_32_CHARS_LONG_FOR_HS256",
    "ExpiryInDays": 7
  },
  "CorsSettings": { "AllowedOrigins": [ "http://localhost:5173" ] }
}
```

**Production checklist** (from `README.md` §"Production deployment"):

1. Rotate the JWT signing key via env var `JwtSettings__Key` (64+ random
   chars, HS256). **Do not** ship the default.
2. Restrict CORS via `CorsSettings__AllowedOrigins` to the real domain(s).
3. Terminate TLS at a reverse proxy (nginx / Caddy / Cloudflare) in front of
   Kestrel — backend listens cleartext on `:5000`.
4. Schedule `sqlite3 app.db ".backup …"` cron for backups.

`appsettings.*.local.json` and `secrets.json` are gitignored.

---

## 8. Local dev — the 5-minute loop

```powershell
# Terminal 1 — backend
cd server\PersonalKnowledgeBase.Api
dotnet ef database update     # one-time, applies 3 migrations
dotnet run                     # http://localhost:5000  (Swagger at /swagger)

# Terminal 2 — frontend
cd client
npm install
npm run dev                    # http://localhost:5173
```

First run creates `server/PersonalKnowledgeBase.Api/app.db`. No seed data —
app is single-user per account. Open <http://localhost:5173/register> and
create an account.

### Useful gates

```powershell
# backend
dotnet build server\PersonalKnowledgeBase.sln

# frontend
cd client
npm run build       # tsc -b + vite build, must be 0 errors / 0 warnings
npm run lint        # eslint flat config, must be 0 errors
npm audit --omit=dev
```

### E2E smoke test

```powershell
pwsh scripts\smoke-test.ps1                 # keep DB
pwsh scripts\smoke-test.ps1 -Reset          # delete app.db + re-migrate
pwsh scripts\smoke-test.ps1 -SkipBuild      # skip dotnet/npm build
# bash equivalent: scripts/smoke-test.sh [--reset] [--skip-build]
```

Spins up backend on `:5000` + frontend on `:5173`, polls `/health` for ≤30 s,
drives the canonical flow (register → create note → search → delete → sign
out) via `playwright-cli`, then tears down. See
`docs/PHASE8_PLAN.md` §3.2 for the full flow.

---

## 9. Status snapshot (where the project is right now)

Phases 1–7 are **APPROVED** with the state captured in
`docs/PHASE8_PLAN.md` §2 (most recent session memory, 2026-06-21):

| Phase | What | Status |
|---|---|---|
| 1 | Backend foundation — .NET 10 + EF Core + Identity + JWT + Serilog | ✅ |
| 2 | Notes / Tags / Folders CRUD | ✅ |
| 3 | FTS5 search backend | ✅ |
| 4 | Frontend foundation (Vite + React 18 strict + Tailwind 3.4 + shadcn) | ✅ (1 Important nit, 2 Nits) |
| 5 | Auth pages — RHF + zod + sonner | ✅ |
| 6 | Notes UI — 3-pane dashboard + TipTap + folder sidebar + optimistic updates | ✅ |
| 7 | Search + polish — debounced bar, /search page, dark mode, state-set audit | ✅ |
| 8 | **Production verification & launch** | 🟡 **In progress** (2026-06-21 plan; not yet executed) |

### Phase 8 deliverables still outstanding

- `README.md` at repo root — **done** in the initial commit, but the spec
  also requires the E2E flow to be re-verified end-to-end.
- `scripts/smoke-test.{ps1,sh}` — **done**, but they need a fresh E2E run to
  certify "as-shipped".
- Fix the open **Important** from `PHASE4_REVIEW.md`: `api/auth.ts:logout()`
  is a misleading no-op.
- Fix the open **Nits** from Phase 4: orphan `client/src/App.tsx`,
  `api/client.ts` `export default` style, and "what" vs "why" section
  comments.
- Final 5-axis code review (parallel fan-out: code-reviewer +
  security-auditor + test-engineer — see AGENTS.md §"Orchestration").
- Log audit — review `server/.../Logs/app-*.log` for repeated 5xx, repeated
  401, uncaught exceptions.
- Phase 8 verdict + production handoff checklist.

---

## 10. Conventions (binding — these are enforced, not suggestions)

From [`.github/copilot-instructions.md`](.github/copilot-instructions.md) and
[`AGENTS.md`](AGENTS.md):

- **TDD-first** for any new logic. For bugs: write a failing test, then fix.
- **Test hierarchy** — unit > integration > e2e. The smoke-test script is the
  current "e2e" — no Vitest / xUnit is wired in (Phase 8 follow-up).
- **Run `npm test` after every change.** *(No `npm test` script exists yet;
  the gating commands are `npm run build`, `npm run lint`, `npm audit`.)*
- **Review across five axes** — correctness, readability, architecture,
  security, performance (see `skills/code-review-and-quality`).
- **Build in small, verifiable increments.** Implement → test → verify →
  commit. Never mix formatting with behavior.
- **Skills are mandatory.** If a task matches a skill, invoke it. Never
  "just quickly implement" something a skill covers.
- **Personas don't invoke other personas.** A persona may invoke a skill.
  The only endorsed multi-persona pattern is parallel fan-out with a merge
  step (used by `/ship`).
- **Boundaries** — always run tests before commit + validate user input; ask
  first on schema changes / new dependencies; never commit secrets, remove
  failing tests, or skip verification.

---

## 11. Known limitations & non-goals (out of scope)

From `docs/PLAN.md` §12 and `docs/PHASE8_PLAN.md` §1:

- Image / file attachments in notes
- Note sharing / collaboration, real-time sync (SignalR)
- Mobile app (React Native), browser extension, web clipper
- Internationalization (i18n)
- Note analytics / word count
- 2FA, "Remember me", password show/hide, forgot password (no backend
  endpoint exists)
- Email verification flow (account is auto-confirmed on register; no email
  is sent)
- Token refresh (JWT is 7 days; user re-logs in on expiry)
- HTTPS in dev (reverse proxy required in production)
- Folder nesting, drag-to-reorder, bulk actions, saved searches, search
  filters / history
- A real test framework (Vitest / xUnit / Playwright Test) — currently the
  smoke-test script + per-phase acceptance items serve as the test surface

---

## 12. Where to go next

| If you want to … | Read |
|---|---|
| Run the project | `README.md` §"Quick start" |
| Understand the architecture | `docs/PLAN.md` |
| See what each phase delivered | `docs/PHASE*_PLAN.md` (each ends in a verdict) |
| See a 5-axis code review example | `docs/PHASE4_REVIEW.md` |
| See the production launch plan | `docs/PHASE8_PLAN.md` |
| Know the agent rules | `AGENTS.md` + `.github/copilot-instructions.md` |
| Drive the E2E flow in a browser | `.github/skills/playwright-cli/SKILL.md` |
| Ship a change | `skills/shipping-and-launch` |
| Review a change before merge | `skills/code-review-and-quality` |

---

*If you change this file, also re-read `docs/PLAN.md` and the latest phase
plan to keep the "Status snapshot" §9 honest.*
