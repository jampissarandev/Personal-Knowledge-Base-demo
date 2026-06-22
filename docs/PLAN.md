# Personal Knowledge Base — Project Plan

> Personal note-taking web application with authentication, rich-text editor, tagging, folders, search, and dark mode.

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TypeScript |
| **Routing** | React Router v6 |
| **State/Data** | TanStack Query (React Query) v5 |
| **UI** | Tailwind CSS + shadcn/ui |
| **Editor** | TipTap (Rich Text WYSIWYG) |
| **Backend** | ASP.NET Core 10 (LTS) Web API |
| **ORM** | EF Core 10 + SQLite |
| **Auth** | ASP.NET Core Identity + JWT Bearer |
| **Search** | SQLite FTS5 virtual table |
| **Logging** | Serilog (Backend) + Logger util (Frontend) |

### Extra Features
- 🌙 Dark mode (next-themes)
- 📌 Pin/Favorite notes
- 📁 Folders / Notebooks (in addition to tags)

---

## 2. Project Structure (Monorepo)

```
D:\Jam Project\PersonalKnowledgeBase\
├── docs/
│   └── PLAN.md
├── server/
│   ├── PersonalKnowledgeBase.Api/        # Web API project
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs         # /api/auth/register, /login
│   │   │   ├── NotesController.cs        # CRUD notes
│   │   │   ├── TagsController.cs         # CRUD tags
│   │   │   ├── FoldersController.cs      # CRUD folders
│   │   │   └── SearchController.cs       # /api/search?q=
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   └── SeedData.cs
│   │   ├── Models/
│   │   │   ├── ApplicationUser.cs
│   │   │   ├── Note.cs
│   │   │   ├── Tag.cs
│   │   │   ├── Folder.cs
│   │   │   └── NoteTag.cs
│   │   ├── DTOs/                         # Request/Response DTOs
│   │   ├── Services/
│   │   │   ├── AuthService.cs
│   │   │   ├── NoteService.cs
│   │   │   └── SearchService.cs
│   │   ├── Logs/                         # Serilog output (gitignored)
│   │   ├── Program.cs                    # DI + Identity + JWT + Serilog + Swagger
│   │   └── appsettings.json
│   └── PersonalKnowledgeBase.sln
├── client/
│   ├── src/
│   │   ├── api/                          # axios client + query hooks
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── notes.ts
│   │   │   ├── tags.ts
│   │   │   └── folders.ts
│   │   ├── components/
│   │   │   ├── ui/                       # shadcn primitives
│   │   │   ├── editor/RichTextEditor.tsx # TipTap
│   │   │   ├── NoteCard.tsx
│   │   │   ├── TagInput.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── Layout/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx         # list + folders
│   │   │   ├── NoteEditorPage.tsx        # create/edit
│   │   │   ├── NoteDetailPage.tsx
│   │   │   └── SearchPage.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── logger.ts
│   │   │   └── tokenStorage.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── .gitignore
└── README.md
```

---

## 3. Database Schema

```
┌──────────────┐       ┌──────────────┐
│ApplicationUser│       │    Folder    │
│──────────────│       │──────────────│
│ Id (PK)      │       │ Id (PK)      │
│ Email        │       │ Name         │
│ UserName     │       │ UserId (FK)  │
│ PasswordHash │       │ CreatedAt    │
└──────┬───────┘       └──────┬───────┘
       │                      │
       │   ┌──────────────┐   │
       │   │     Note     │◄──┘
       │   │──────────────│
       │   │ Id (PK)      │
       │   │ Title        │
       │   │ ContentJson  │ ◄── TipTap JSON
       │   │ ContentText  │ ◄── plain text (for FTS)
       │   │ IsPinned     │
       │   │ UserId (FK)  │
       │   │ FolderId (FK)│ (nullable)
       │   │ CreatedAt    │
       │   │ UpdatedAt    │
       └──►│              │
           └──────┬───────┘
                  │
              ┌───▼────┐
              │ NoteTag│
              │────────│
              │ NoteId │
              │ TagId  │
              └───┬────┘
                  │
              ┌───▼────┐
              │  Tag   │
              │────────│
              │ Id     │
              │ Name   │
              │ UserId │
              └────────┘

   ┌─────────────────────────┐
   │  notes_fts (FTS5)       │  ◄── virtual table for search
   │  title, content_text    │
   └─────────────────────────┘
```

---

## 4. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login → JWT token |
| GET | `/api/auth/me` | ✅ | Get current user info |
| GET | `/api/notes` | ✅ | List notes (filter: folderId, tagId, isPinned) |
| GET | `/api/notes/{id}` | ✅ | Get a single note |
| POST | `/api/notes` | ✅ | Create a note |
| PUT | `/api/notes/{id}` | ✅ | Update a note |
| DELETE | `/api/notes/{id}` | ✅ | Delete a note |
| PATCH | `/api/notes/{id}/pin` | ✅ | Toggle pin status |
| GET | `/api/tags` | ✅ | List user's tags |
| POST | `/api/tags` | ✅ | Create a tag |
| DELETE | `/api/tags/{id}` | ✅ | Delete a tag |
| GET | `/api/folders` | ✅ | List user's folders |
| POST | `/api/folders` | ✅ | Create a folder |
| DELETE | `/api/folders/{id}` | ✅ | Delete a folder (notes → no folder) |
| GET | `/api/search?q=...` | ✅ | Full-text search via FTS5 |

---

## 5. Logging Strategy

### Backend — Serilog

**NuGet packages:**
```xml
Serilog.AspNetCore
Serilog.Sinks.File
Serilog.Sinks.Console
```

**Configuration in `Program.cs`:**
```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        path: "Logs/app-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();
```

**Log file location:**
```
server/PersonalKnowledgeBase.Api/Logs/app-20260619.log
```

**Events to log:**
- 🔐 Auth: register / login success + failure
- 📝 CRUD: note create / update / delete (with userId, noteId)
- 🔍 Search: query keyword + result count
- ⚠️ Errors: full stack trace + request path
- 🚀 Startup / shutdown

### Frontend — Logger utility

**File:** `client/src/lib/logger.ts`
```ts
export const logger = {
  info: (msg: string, meta?: object) => console.info(`[INFO] ${msg}`, meta),
  warn: (msg: string, meta?: object) => console.warn(`[WARN] ${msg}`, meta),
  error: (msg: string, err?: unknown, meta?: object) =>
    console.error(`[ERROR] ${msg}`, err, meta),
  api: (method: string, url: string, status?: number) =>
    console.log(`[API] ${method} ${url} → ${status ?? "pending"}`),
};
```

**Usage locations:**
- 🛡️ axios interceptor (request/response)
- 🔐 Auth flow (login/register result)
- 📝 Note operations (success/error)
- 🐛 Catch blocks (unexpected errors)
- 🚀 App mount (initialization)

---

## 6. Configuration

| Service | Port | URL |
|---------|------|-----|
| API (Kestrel) | 5000 | `http://localhost:5000` |
| Client (Vite) | 5173 | `http://localhost:5173` |
| Swagger UI | 5000 | `http://localhost:5000/swagger` |

**CORS:** Allow origin `http://localhost:5173`

**JWT expiry:** 7 days (configurable)

---

## 7. Security Checklist

- ✅ Password hashing via ASP.NET Identity (PBKDF2)
- ✅ JWT signing key in `appsettings.Development.json` (not committed in production)
- ✅ HTTPS redirect enabled in production
- ✅ CORS policy restricted to client origin
- ✅ Authorization filter on all protected controllers
- ✅ User-scoped queries (notes belong to owner only)
- ✅ Rate limiting on auth endpoints (optional enhancement)
- ✅ `Logs/` directory in `.gitignore`

---

## 8. Implementation Roadmap

### Phase 1 — Backend Foundation
1. Create .NET 10 Web API project + EF Core + SQLite
2. Configure Identity + JWT in `Program.cs`
3. Create domain models + `AppDbContext` + first migration
4. Implement `AuthController` (register + login)
5. Add Serilog (file + console)
6. Verify with Swagger

### Phase 2 — Notes / Tags / Folders CRUD
7. Implement `NotesController` (CRUD + pin)
8. Implement `TagsController` + `FoldersController`
9. DTOs + mapping (Mapster / manual)
10. Validation with DataAnnotations
11. Test all endpoints via Swagger

### Phase 3 — Search
12. Enable SQLite FTS5 in connection string
13. Create virtual table `notes_fts` + sync triggers
14. Implement `SearchController` with `MATCH` query

### Phase 4 — Frontend Foundation
15. Vite + React + TS + Tailwind + shadcn/ui init
16. Set up React Router + Layout + ThemeProvider
17. Create axios client + token interceptor + logger
18. Auth context + protected routes

### Phase 5 — Auth Pages
19. Login page + Register page
20. Form validation + error handling
21. Redirect after login

### Phase 6 — Notes UI
22. Dashboard: pinned + recent + folder sidebar
23. NoteEditor page with TipTap + tag input + folder select + pin toggle
24. Note detail view
25. CRUD via TanStack Query with optimistic updates

### Phase 7 — Search + Polish
26. Search bar in header (debounced)
27. Search results page
28. Dark mode toggle + shadcn theme config
29. Loading / empty / error states + toast notifications

### Phase 8 — Verification
30. Build production + run both services
31. End-to-end manual test of all features
32. Review log files for any errors

---

## 9. Key NuGet Packages (Backend)

```xml
Microsoft.AspNetCore.Identity.EntityFrameworkCore
Microsoft.EntityFrameworkCore.Sqlite
Microsoft.EntityFrameworkCore.Tools
Microsoft.AspNetCore.Authentication.JwtBearer
Swashbuckle.AspNetCore
Serilog.AspNetCore
Serilog.Sinks.File
Serilog.Sinks.Console
Mapster
```

## 10. Key npm Packages (Frontend)

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "@tanstack/react-query": "^5",
    "axios": "^1.x",
    "@tiptap/react": "^2",
    "@tiptap/starter-kit": "^2",
    "@tiptap/extension-link": "^2",
    "next-themes": "^0.3",
    "sonner": "^1.x",
    "lucide-react": "^0.x",
    "class-variance-authority": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "vite": "^5",
    "typescript": "^5",
    "tailwindcss": "^3",
    "@types/react": "^18",
    "@types/node": "^20"
  }
}
```

---

## 11. Trade-offs & Notes

1. **FTS5 sync** — Write raw SQL in migrations for the virtual table + triggers (EF Core can't generate FTS5 schema natively).
2. **ContentText vs ContentJson** — Store both: JSON for editor render, plain text for FTS5 indexing.
3. **CORS in dev** — Vite (5173) → API (5000) needs CORS policy.
4. **JWT expiry** — 7 days, refresh token optional.
5. **.NET 10** — Current LTS as of late 2025; verify SDK installed via `dotnet --version` before starting.
6. **Single SQLite file** — Easy local dev; switch to PostgreSQL for production multi-user scale.

---

## 12. Out of Scope (Future Enhancements)

- 🖼️ Image / file attachments in notes
- 🤝 Note sharing / collaboration
- 📱 Mobile app (React Native)
- 🔄 Real-time sync via SignalR
- 📊 Note analytics / word count
- 🔌 Browser extension for clipping
- 🌐 Internationalization (i18n)
