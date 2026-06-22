# Personal Knowledge Base

A personal note-taking web app: ASP.NET Core 10 backend, React 18 + Vite
frontend, SQLite + FTS5 full-text search, rich-text editing via TipTap,
folders, tags, pin, and dark mode.

---

## Prerequisites

| Tool | Version | Verify |
|------|---------|--------|
| .NET SDK | 10.x | `dotnet --version` |
| Node.js | 20+ (tested with 26.3.0) | `node --version` |
| npm | 10+ | `npm --version` |
| Git | 2.30+ | `git --version` |
| `playwright-cli` | latest | `playwright-cli --help` *(optional — only for the E2E smoke test)* |

The dev environment used to build this project: Windows 11, PowerShell 7,
.NET SDK 10.0.301, Node 26.3.0, npm 11.16.0.

---

## Quick start (5 minutes)

```powershell
# 1. clone
git clone https://github.com/jampissarandev/Personal-Knowledge-Base-demo.git PersonalKnowledgeBase
cd PersonalKnowledgeBase

# 2. backend — one terminal
cd server\PersonalKnowledgeBase.Api
dotnet ef database update      # apply the 3 EF Core migrations
dotnet run                      # listens on http://localhost:5000
```

```powershell
# 3. frontend — second terminal
cd client
npm install
npm run dev                     # serves on http://localhost:5173
```

Open <http://localhost:5173/register>, create an account, and you are in.

The first time you run the backend, EF Core will create `app.db` next to
the project. There is no seed data — the app is single-user per account.

---

## Project layout

```
PersonalKnowledgeBase/
├── client/                      React 18 + Vite + TS frontend
│   ├── src/api/                 axios client + typed API modules
│   ├── src/auth/                AuthContext + ProtectedRoute
│   ├── src/components/          UI (shadcn primitives + app components)
│   ├── src/hooks/               TanStack Query hooks
│   ├── src/lib/                 utils, logger, error mappers
│   ├── src/pages/               routed pages
│   └── vite.config.ts           dev proxy /api -> :5000
├── server/
│   ├── PersonalKnowledgeBase.Api/
│   │   ├── Controllers/         5 controllers, 16 endpoints + /health
│   │   ├── Data/                EF Core AppDbContext
│   │   ├── DTOs/                request / response DTOs
│   │   ├── Migrations/          3 EF Core migrations
│   │   ├── Services/            NoteService, SearchService, ...
│   │   ├── Logs/                Serilog output (gitignored)
│   │   └── Program.cs           DI + Identity + JWT + Serilog + Swagger
│   └── PersonalKnowledgeBase.sln
├── docs/                        PLAN.md + per-phase plans + verdicts
├── scripts/                     smoke-test.ps1 + smoke-test.sh
└── .github/                     skills (Claude Code / OpenCode)
```

For the full architecture, see [docs/PLAN.md](docs/PLAN.md).

---

## Useful commands

### Backend

```powershell
# build
dotnet build server\PersonalKnowledgeBase.sln

# run (dev)
cd server\PersonalKnowledgeBase.Api
dotnet run

# add a migration (after model change)
dotnet ef migrations add <Name>

# apply pending migrations
dotnet ef database update

# Swagger UI (when running)
# http://localhost:5000/swagger
```

### Frontend

```powershell
cd client

npm run dev          # Vite dev server on :5173
npm run build        # production build -> dist/
npm run preview      # serve the production build locally on :4173
npm run lint         # ESLint (must be 0 errors before commit)
npm audit --omit=dev # audit production dependencies
```

### Smoke test (E2E)

```powershell
# Windows
pwsh scripts\smoke-test.ps1                # keep DB as-is
pwsh scripts\smoke-test.ps1 -Reset         # delete app.db and re-migrate
pwsh scripts\smoke-test.ps1 -SkipBuild     # skip dotnet/npm build step

# bash / WSL / macOS
bash scripts/smoke-test.sh --reset
bash scripts/smoke-test.sh --skip-build
```

The script starts the backend on `:5000` and the frontend on `:5173`,
polls `/health` for up to 30 s, drives the canonical E2E flow (register
→ create note → search → delete → sign out) via `playwright-cli`, and
tears down. See [docs/PHASE8_PLAN.md](docs/PHASE8_PLAN.md) §3.2 for the
full flow.

---

## API reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login → JWT token |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/notes?folderId=&tagId=&isPinned=` | ✅ | List notes |
| GET | `/api/notes/{id}` | ✅ | Get a note |
| POST | `/api/notes` | ✅ | Create a note |
| PUT | `/api/notes/{id}` | ✅ | Update a note |
| DELETE | `/api/notes/{id}` | ✅ | Delete a note |
| PATCH | `/api/notes/{id}/pin` | ✅ | Toggle pin |
| GET | `/api/tags` | ✅ | List tags |
| POST | `/api/tags` | ✅ | Create a tag |
| DELETE | `/api/tags/{id}` | ✅ | Delete a tag |
| GET | `/api/folders` | ✅ | List folders |
| POST | `/api/folders` | ✅ | Create a folder |
| DELETE | `/api/folders/{id}` | ✅ | Delete folder (notes → no folder) |
| GET | `/api/search?q=&offset=&limit=` | ✅ | FTS5 search |
| GET | `/health` | — | Liveness probe |

Full live reference while the backend is running: <http://localhost:5000/swagger>
(use the **Authorize** button to paste a JWT from `/api/auth/login`).

---

## Logs and debugging

- **Backend logs** — `server/PersonalKnowledgeBase.Api/Logs/app-YYYYMMDD.log`
  (Serilog, 14-day rolling retention). Console output is interleaved.
- **Frontend logs** — open the browser DevTools console. The app uses
  `lib/logger.ts` (info / warn / error / api) — no PII is logged.
- **E2E debugging** — the [`playwright-cli`](../.github/skills/playwright-cli/SKILL.md)
  skill drives a real browser; use it to repro a flow step-by-step.

---

## Production deployment

This project is designed for personal / dev-scale use. SQLite is fine for
one user; for multi-user, see the handoff checklist in
[docs/PHASE8_PLAN.md](docs/PHASE8_PLAN.md) §5.7 (12 items).

**Before exposing the app to the public internet, at minimum:**

1. **Rotate the JWT signing key** — generate a fresh 64-char random
   value, set it via the `JwtSettings__Key` env var (not in
   `appsettings.json`).
2. **Restrict CORS** — override `CorsSettings__AllowedOrigins` to the
   real production domain(s).
3. **Terminate TLS at a reverse proxy** (nginx / Caddy / Cloudflare)
   in front of Kestrel; the backend listens cleartext on `:5000` and
   is not safe to expose directly.
4. **Schedule DB backups** (`sqlite3 app.db ".backup ..."` cron).

The app does **not** include CSRF protection by design — auth is
JWT-in-`Authorization`-header, not cookies, so there is no CSRF vector.
Token storage is `localStorage` (XSS-readable); a future hardening pass
could move it to an HttpOnly cookie + refresh-token flow.

---

## License

MIT — do what you want, no warranty.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `CORS error` in browser console | The Vite port changed. Update `appsettings.json` → `CorsSettings.AllowedOrigins`. |
| `401` on every request | Token expired (7-day TTL) or missing. Sign out and back in. |
| `dotnet ef: command not found` | `dotnet tool install --global dotnet-ef` |
| Vite proxy `504` | Backend isn't running on `:5000`. Start it in the other terminal. |
| `Search returns 0 results` | FTS5 virtual table missing. Run `dotnet ef database update`. |
| `app.db is locked` | The previous backend is still running. `Get-Process -Name 'PersonalKnowledgeBase.Api' \| Stop-Process`. |
