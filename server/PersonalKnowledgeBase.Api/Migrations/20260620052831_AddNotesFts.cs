using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalKnowledgeBase.Api.Migrations
{
    /// <summary>
    /// Adds the FTS5-backed full-text search index for the Notes table.
    ///
    /// Design (deviates from <c>docs/PHASE3_PLAN.md</c> §3 — see §8.3 for the rationale):
    /// <list type="bullet">
    ///   <item>Regular FTS5 virtual table (no <c>content=</c> option). The plan's
    ///         <c>content='Notes'</c> (external content) was rejected because it
    ///         disallows the simple INSERT used in the AI trigger and backfill.
    ///         Contentless (<c>content=''</c>) was rejected because the FTS5
    ///         <c>snippet()</c> auxiliary function is unavailable on contentless
    ///         tables, breaking the response contract.</item>
    ///   <item>The phrase-token limit (<c>FTS5_MAX_PHRASE = 12</c>) is a
    ///         compile-time constant in SQLite — there is no runtime <c>phrase=</c>
    ///         FTS5 option. The service-layer guard in
    ///         <c>SearchService.SearchAsync</c> (<c>EnforceFtsPhraseTokenLimit</c>)
    ///         rejects queries with more than 12 whitespace-separated tokens
    ///         before they reach the FTS5 engine, returning a clean 400 instead
    ///         of a sanitized 500. See <c>PHASE3_PLAN.md</c> §9 R1.</item>
    ///   <item>The AD/AU sync triggers use plain <c>DELETE FROM notes_fts WHERE rowid = …</c>
    ///         + a fresh INSERT, not the FTS5 <c>'delete'</c> command. The <c>'delete'</c>
    ///         command is only valid against contentless / external-content tables
    ///         and raises <c>SQL logic error</c> on a regular FTS5 table, which
    ///         surfaced as 500s on PUT/DELETE during Step A.</item>
    ///   <item>The backfill is idempotent within a single migration run because
    ///         <c>notes_fts</c> is empty when this migration executes. EF migrations
    ///         history prevents re-runs, so no further guards are needed.</item>
    /// </list>
    /// </summary>
    public partial class AddNotesFts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE VIRTUAL TABLE notes_fts USING fts5(
                    title,
                    content_text,
                    tokenize='porter unicode61'
                );
            ");

            migrationBuilder.Sql(@"
                INSERT INTO notes_fts(rowid, title, content_text)
                    SELECT rowid, Title, ContentText FROM Notes;
            ");

            migrationBuilder.Sql(@"
                CREATE TRIGGER notes_fts_ai AFTER INSERT ON Notes BEGIN
                    INSERT INTO notes_fts(rowid, title, content_text)
                    VALUES (new.rowid, new.Title, new.ContentText);
                END;
            ");

            migrationBuilder.Sql(@"
                CREATE TRIGGER notes_fts_ad AFTER DELETE ON Notes BEGIN
                    DELETE FROM notes_fts WHERE rowid = old.rowid;
                END;
            ");

            migrationBuilder.Sql(@"
                CREATE TRIGGER notes_fts_au AFTER UPDATE ON Notes BEGIN
                    DELETE FROM notes_fts WHERE rowid = old.rowid;
                    INSERT INTO notes_fts(rowid, title, content_text)
                    VALUES (new.rowid, new.Title, new.ContentText);
                END;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS notes_fts_au;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS notes_fts_ad;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS notes_fts_ai;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS notes_fts;");
        }
    }
}

