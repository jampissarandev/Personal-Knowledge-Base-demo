/**
 * Dashboard — the 3-pane notes workspace. On desktop (`lg:`) it
 * renders a left rail (folder/tag sidebar), a middle note list, and
 * a right detail/editor pane. On smaller screens, the sidebar moves
 * into a hamburger-triggered sheet; the right pane is route-driven
 * (`/notes/:id`).
 */
import { Outlet } from 'react-router-dom';
import { NoteList } from '@/components/notes/NoteList';
import { FolderSidebar } from '@/components/layout/FolderSidebar';

export function DashboardPage() {
  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[256px_320px_1fr]">
      <aside className="hidden border-r bg-muted/30 lg:block">
        <FolderSidebar />
      </aside>
      <div className="border-r">
        <NoteList />
      </div>
      <main className="overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
