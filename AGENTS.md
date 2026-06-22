# AGENTS.md

> **Audience:** AI coding agents (Claude Code, Cursor, Copilot, Antigravity,
> etc.) and any human contributor picking up this repo cold.
>
> **Read [CONTEXT.md](CONTEXT.md) first** for the project overview,
> architecture, and status snapshot. This file is the *operating manual*:
> how to work in this repo day-to-day.

---

## 1. What this project is

**Personal Knowledge Base** — a single-user note-taking web app.

| Layer | Stack | Anchor file |
|---|---|---|
| Backend | ASP.NET Core 10 + EF Core 10 + SQLite (FTS5) | [server/PersonalKnowledgeBase.Api/Program.cs](server/PersonalKnowledgeBase.Api/Program.cs) |
| Frontend | React 18 + Vite 5 + TypeScript 5.6 (strict) | [client/vite.config.ts](client/vite.config.ts) |
| Auth | ASP.NET Identity + JWT (7-day TTL) | `Program.cs` lines 86–138 |
| Editor | TipTap 2.27 (StarterKit + Link) | [client/src/components/editor/RichTextEditor.tsx](client/src/components/editor/RichTextEditor.tsx) |
| Server state | TanStack Query 5.59 | [client/src/lib/queryClient.ts](client/src/lib/queryClient.ts) |
| Logging | Serilog (console + 14-day rolling file) | `Program.cs` lines 17–27 |
| E2E | `playwright-cli` driven by PowerShell + bash scripts | [scripts/smoke-test.ps1](scripts/smoke-test.ps1) |

**Dev environment target:** Windows 11 + PowerShell 7 + .NET SDK 10.x + Node 20+ + npm 10+. WSL / macOS / Linux work for the bash smoke test.

**Out of scope (do not propose adding these without an explicit product decision):** multi-tenant, billing, image attachments, sharing, mobile app, real-time sync, 2FA, password reset, email verification, i18n. See [CONTEXT.md §11](CONTEXT.md#11-known-limitations--non-goals-out-of-scope) for the full list and rationale.

---

## 2. The 5-minute dev loop

```powershell
# Terminal 1 — backend (run from repo root)
cd server\PersonalKnowledgeBase.Api
dotnet ef database update     # first time only — applies 3 migrations
dotnet run                     # http://localhost:5000  (Swagger at /swagger)

# Terminal 2 — frontend
cd client
npm install                    # first time only
npm run dev                    # http://localhost:5173
```

Open <http://localhost:5173/register>, create an account, and you're in. The
SQLite file `app.db` is created next to the project on first run; no seed
data, no multi-user concept.

### Quality gates (must pass before commit)

| Command | What it checks |
|---|---|
| `dotnet build server\PersonalKnowledgeBase.sln` | C# compiles, 0 errors |
| `npm run build` (in `client/`) | `tsc -b` + Vite build, 0 errors / 0 warnings |
| `npm run lint` (in `client/`) | ESLint flat config, 0 errors |
| `npm audit --omit=dev` (in `client/`) | 0 high / 0 critical vulns |
| `pwsh scripts\smoke-test.ps1` | Full E2E (register → create note → search → delete → sign out) |

> **Note:** There is no `npm test` yet. The smoke-test script + per-phase
> acceptance items are the current "test surface." A future phase could add
> Vitest + RTL.

---

## 3. Working conventions (binding)

From [`.github/copilot-instructions.md`](.github/copilot-instructions.md) and
established in the Phase 1–7 reviews:

### 3.1 TDD-first

- Write tests before code. For bugs: write a failing test first, then fix
  (the "Prove-It" pattern).
- Test hierarchy: **unit > integration > e2e**. Use the lowest level that
  captures the behavior — most pure logic should not need a browser.
- For now, "tests" means: smoke-test E2E + the acceptance items listed in
  the relevant `docs/PHASE*_PLAN.md`. Add Vitest when the project needs it.

### 3.2 Five-axis code review

Every change gets reviewed across **correctness, readability, architecture,
security, performance**. See
[`.github/skills/code-review-and-quality/SKILL.md`](.github/skills/code-review-and-quality/SKILL.md)
for the methodology. Severity levels: **Critical → Important → Nit → FYI**.

### 3.3 Incremental delivery

- Build in small, verifiable increments.
- Each increment: **implement → test → verify → commit**.
- Never mix formatting changes with behavior changes in the same commit.

### 3.4 Boundaries

| Always | Ask first | Never |
|---|---|---|
| Run gates before commit | Change DB schema (new migration) | Commit secrets |
| Validate user input on both ends | Add a new dependency | Remove failing tests |
| Update the relevant `docs/PHASE*_PLAN.md` if a binding decision changes | Change the JWT signing key location | Skip the smoke test for a "small" change |
| Match the file's existing style | Touch `appsettings.json` secrets | Push directly to `main` without a smoke-test run |

### 3.5 Server-testing patience

From the existing rule: **never wait indefinitely for `/health`.** Max 30 s.
If not healthy: inspect logs, report the startup error, stop. Do not retry
automatically more than once. See [`scripts/smoke-test.ps1`](scripts/smoke-test.ps1) for the reference implementation.

---

## 4. Skills and personas in this repo

This repo **vendors** an opinionated agent toolkit under `.github/`. These
are dev tools, **not** the product. Don't confuse them with the Personal
Knowledge Base itself.

### 4.1 Skills (`.github/skills/<name>/SKILL.md`) — the *how*

24 skills cover the lifecycle. A skill is a workflow with steps and exit
criteria. Loaded on demand — only the name and `description` are in context
at startup; the full `SKILL.md` loads only when the agent decides the skill
is relevant.

**Mapping from intent → skill:**

| Intent | Skill(s) |
|---|---|
| New feature / new behavior | `spec-driven-development` → `incremental-implementation` → `test-driven-development` |
| Planning / breaking down work | `planning-and-task-breakdown` |
| Bug, failure, unexpected behavior | `debugging-and-error-recovery` |
| Code review | `code-review-and-quality` |
| Refactor / clarity pass | `code-simplification` |
| API / module / type contract | `api-and-interface-design` |
| UI work (components, state, layout) | `frontend-ui-engineering` |
| Performance regression | `performance-optimization` |
| Security review | `security-and-hardening` |
| Production launch | `shipping-and-launch` |
| E2E browser driving | `playwright-cli` |
| Decision record / ADR | `documentation-and-adrs` |
| Removing old code | `deprecation-and-migration` |
| Adding logs / metrics | `observability-and-instrumentation` |
| Vague idea | `idea-refine` (divergent) or `interview-me` (clarify) |
| Adversarial review | `doubt-driven-development` |
| CI/CD change | `ci-cd-and-automation` |
| Git workflow question | `git-workflow-and-versioning` |
| Use a framework correctly | `source-driven-development` (read official docs first) |

**The "anti-rationalization" rule:** thoughts like "this is too small for a
skill" or "I'll just quickly implement this" are wrong. Always check for and
invoke a skill if one applies, even at a 1% match.

### 4.2 Personas (`.github/agents/<role>.agent.md`) — the *who*

Four personas are vendored. Each has a perspective and an output format.

| Persona | Use for |
|---|---|
| `code-reviewer` | Five-axis code review before merge |
| `security-auditor` | Threat modeling, vulnerability review |
| `test-engineer` | Test strategy + coverage analysis |
| `web-performance-auditor` | Core Web Vitals + load/render/network optimization |

**Composition rule:** *the user (or a slash command) is the orchestrator.*
Personas do not invoke other personas. A persona may invoke a skill.

**The only endorsed multi-persona pattern is parallel fan-out with a merge step**
— used by `shipping-and-launch` to run `code-reviewer`, `security-auditor`,
and `test-engineer` concurrently and synthesize their reports. Do not build
a "router" persona that decides which persona to call.

**Claude Code interop:** the personas in `agents/` work as Claude Code
subagents (auto-discovered) and as Agent Teams teammates. Two platform
constraints align with our rules: subagents cannot spawn other subagents,
and teams cannot nest.

### 4.3 Slash commands (`.claude/commands/*.md`) — the *when*

The orchestration layer — user-facing entry points. Not currently populated
in this repo, but the directory is reserved.

---

## 5. Domain rules of thumb (so you don't break things)

These are the gotchas a fresh agent will hit on day one. Internalize them.

### 5.1 Backend

- **Two-form note content** ([server/.../Models/Note.cs:18-25](server/PersonalKnowledgeBase.Api/Models/Note.cs#L18-L25)) —
  `ContentJson` for the TipTap round-trip, `ContentText` for FTS5. **You must
  keep them in sync** on every write path that touches content. The
  `SearchService` depends on `ContentText` being current.
- **FTS5 schema is in raw SQL** ([server/.../Migrations/20260620052831_AddNotesFts.cs](server/PersonalKnowledgeBase.Api/Migrations/20260620052831_AddNotesFts.cs))
  — EF Core can't generate virtual tables + triggers. Do not try to "fix" it
  by moving it into a `DbSet`. The sync triggers handle insert / update /
  delete.
- **Tag and Folder names are case-insensitive unique per user** (collation
  set in `Migrations/20260619151755_TagFolderNameNocase.cs`). Don't add a new
  uniqueness rule that bypasses the collation.
- **Deleting a folder sets notes' `FolderId` to `null`** — it does **not**
  cascade-delete notes. Match that behaviour.
- **Error envelope** ([server/.../DTOs/ErrorResponse.cs](server/PersonalKnowledgeBase.Api/DTOs/ErrorResponse.cs)) is the
  contract. Every 4xx/5xx response must produce
  `{ "error": { "code": "…", "message": "…", "details"?: {…} } }`. The
  frontend `ApiError` mapper is typed against this shape.
- **Validation errors** flow through `ApiBehaviorOptions.InvalidModelStateResponseFactory`
  in `Program.cs:42-52` — don't bypass it with a custom `BadRequest` in a
  controller.
- **JWT 401 challenge** is custom (returns the envelope, not an empty body) —
  `Program.cs:130-138`. Don't add another 401 path that returns the default
  body.
- **CORS** is locked to `CorsSettings:AllowedOrigins` in
  `appsettings.json` (default `http://localhost:5173`). If the Vite port
  changes, update there, not in the controller.
- **Serilog is wired with `UseSerilogRequestLogging()` + the global `Log.Logger`** —
  use `ILogger<T>` from DI, not the static `Log.*`, inside request scopes so
  the log context propagates.

### 5.2 Frontend

- **Vite proxy** ([client/vite.config.ts:19-24](client/vite.config.ts#L19-L24))
  forwards `/api` → `http://localhost:5000`. In dev, **always** use relative
  `/api/…` URLs — never hardcode `http://localhost:5000`. The axios base URL
  is `/` for this reason.
- **Token storage** is `localStorage` (`pkb_token` key). Acceptable for a
  personal app, **XSS-readable** — see README §"Production deployment" for
  the future hardening (HttpOnly cookie + refresh-token flow).
- **Server state** lives in TanStack Query. Don't introduce a parallel state
  library. All mutations go through the hooks in
  [client/src/hooks/](client/src/hooks/) so optimistic updates + rollback
  + toasts are uniform.
- **Optimistic updates** for pin / delete / update are implemented via
  `onMutate` / `onError` in the hooks. Match the pattern; don't add raw
  `setQueryData` calls outside the hooks.
- **Toasts** come from [client/src/lib/toast.ts](client/src/lib/toast.ts)
  (re-exports `sonner`). One import path. Every successful mutation toasts.
  Every error toasts via the shared error mapper.
- **Theme** is `next-themes` with the `class` strategy. The CSS variables
  live in [client/src/index.css](client/src/index.css). Don't add a second
  theming mechanism.
- **shadcn primitives** in [client/src/components/ui/](client/src/components/ui/) are the source of truth for
  buttons, dialogs, inputs, etc. Compose them; don't re-implement.
- **TipTap save** must produce both `ContentJson` *and* `ContentText`. The
  text projection is derived from the doc on save — don't store the raw HTML.
- **Search snippet rendering** is XSS-safe — use
  [client/src/lib/parseSnippet.ts](client/src/lib/parseSnippet.ts), never
  `dangerouslySetInnerHTML` for snippets.
- **Error mapping** per domain: `lib/authErrors.ts`, `lib/noteErrors.ts`,
  `lib/searchErrors.ts` — map server `code` → user-facing copy. Add new
  codes there, not in components.

### 5.3 Database

- 3 EF Core migrations are applied: `InitialCreate`, `TagFolderNameNocase`,
  `AddNotesFts`. Any schema change → `dotnet ef migrations add <Name>`, then
  verify the generated `Up` / `Down` before committing. **Do not edit a
  committed migration** — add a new one.
- `app.db` is gitignored. The dev DB lives next to the project on first run.

---

## 6. Common tasks (cheat sheet)

### 6.1 Add a new API endpoint

1. Add DTOs under `server/PersonalKnowledgeBase.Api/DTOs/<Area>/`.
2. Add a method to the relevant service (`IAuthService`, `INoteService`,
   `ITagService`, `IFolderService`, `ISearchService`) — controllers stay
   thin.
3. Add the controller action in the matching `*Controller.cs`.
4. Update `Program.cs` DI if you added a new service.
5. Restart backend; verify in Swagger (`http://localhost:5000/swagger`).
6. Add the corresponding TS module under `client/src/api/` and a TanStack
   Query hook under `client/src/hooks/`.
7. Run `npm run build && npm run lint` in `client/`.
8. Run the smoke test end-to-end.

### 6.2 Add a new shadcn primitive

The project pins **shadcn/ui (New York, Slate)**. The convention is to
copy-paste the component into `client/src/components/ui/<name>.tsx` and
adapt — do not add the shadcn CLI to the project. Existing 17 primitives
live in `client/src/components/ui/`; match their style.

### 6.3 Change the database schema

1. Edit the model in `server/.../Models/`.
2. Update relationships in `server/.../Data/AppDbContext.cs` if needed.
3. `dotnet ef migrations add <DescriptiveName>` (from
   `server/PersonalKnowledgeBase.Api/`).
4. **Inspect the generated `Up` and `Down`** — EF Core does not understand
   FTS5 or collations, so any such change is on you to add via raw SQL
   inside the migration.
5. `dotnet ef database update` to verify locally.
6. Document the change in the relevant `docs/PHASE*_PLAN.md` (or create a
   new phase plan).
7. Commit model + `AppDbContext.cs` + migration as one logical change.

### 6.4 Add or update a skill / persona

Skills live at `.github/skills/<skill-name>/SKILL.md`. Personas at
`.github/agents/<role>.agent.md`. Conventions are in
[§4](#4-skills-and-personas-in-this-repo) and the original
[`.claude/agents.md` patterns](https://docs.claude.com/en/docs/claude-code) —
keep the frontmatter (`name`, `description`) specific so the agent picks
the right one. Aim for SKILL.md under 500 lines; put detail in separate
files referenced one level deep.

### 6.5 Run the E2E smoke test

```powershell
# from repo root
pwsh scripts\smoke-test.ps1                  # keep the dev DB
pwsh scripts\smoke-test.ps1 -Reset           # delete app.db + re-migrate
pwsh scripts\smoke-test.ps1 -SkipBuild       # skip dotnet/npm build
# bash / WSL / macOS:
bash scripts/smoke-test.sh --reset
bash scripts/smoke-test.sh --skip-build
```

The script polls `/health` for ≤30 s, runs the canonical flow via
`playwright-cli`, then tears down. Full flow documented in
[docs/PHASE8_PLAN.md](docs/PHASE8_PLAN.md) §3.2.

---

## 7. Logging expectations

- **Backend** — `ILogger<T>` from DI inside request scopes; Serilog writes
  to console + `server/PersonalKnowledgeBase.Api/Logs/app-YYYYMMDD.log`
  (14-day rolling). Events to log: auth success/failure, note
  create/update/delete (with `userId` + `noteId`), search query +
  result count, full stack traces for errors, startup/shutdown.
- **Frontend** — [client/src/lib/logger.ts](client/src/lib/logger.ts) is the
  only logger. Levels: `info`, `warn`, `error`, `api`. **No PII.** Used in
  the axios interceptor, the auth flow, mutation success/error, catch
  blocks, and app mount.

---

## 8. Production-readiness checklist (what "done" means)

From [docs/PHASE8_PLAN.md](docs/PHASE8_PLAN.md) and the README §"Production deployment":

- [ ] `JwtSettings__Key` overridden via env var (64+ random chars, HS256)
- [ ] `CorsSettings__AllowedOrigins` restricted to the real domain(s)
- [ ] TLS terminated at a reverse proxy (nginx / Caddy / Cloudflare) in
      front of Kestrel
- [ ] `sqlite3 app.db ".backup …"` cron in place
- [ ] `/health` returns 200 on the deployed instance
- [ ] `npm run build` produces a clean `client/dist/`
- [ ] `dotnet publish` produces a self-contained backend artifact
- [ ] Smoke test passes against the deployed instance
- [ ] No `Important` findings open in the latest
      [docs/PHASE4_REVIEW.md](docs/PHASE4_REVIEW.md) / Phase 8 review
- [ ] No repeated 5xx or 401 in the last 7 days of `Logs/app-*.log`

---

## 9. Where to look next

| If you want to … | Read |
|---|---|
| Understand the project | [CONTEXT.md](CONTEXT.md) |
| Run the project | [README.md](README.md) §"Quick start" |
| See the full architecture | [docs/PLAN.md](docs/PLAN.md) |
| See what each phase delivered | [docs/PHASE1_PLAN.md](docs/PHASE1_PLAN.md) … [docs/PHASE8_PLAN.md](docs/PHASE8_PLAN.md) |
| See an example 5-axis review | [docs/PHASE4_REVIEW.md](docs/PHASE4_REVIEW.md) |
| Drive the E2E flow in a browser | [`.github/skills/playwright-cli/SKILL.md`](.github/skills/playwright-cli/SKILL.md) |
| See the full skill catalog | [`.github/skills/`](.github/skills/) |
| Ship a change | [`.github/skills/shipping-and-launch/SKILL.md`](.github/skills/shipping-and-launch/SKILL.md) |
| Review a change before merge | [`.github/skills/code-review-and-quality/SKILL.md`](.github/skills/code-review-and-quality/SKILL.md) |
| Debug a failing build / test | [`.github/skills/debugging-and-error-recovery/SKILL.md`](.github/skills/debugging-and-error-recovery/SKILL.md) |

---

*Keep this file honest. When you change a binding decision (a new
convention, a new dependency, a schema rule, a gotcha), update this file
in the same PR. Future-you and future-agents will thank you.*
