/**
 * Default content for the dashboard's right pane when no note is
 * selected. Shows a "Select a note or create a new one" hint + a
 * "New note" button.
 */
import { FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function DashboardEmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <FileText className="h-12 w-12 text-muted-foreground" aria-hidden />
      <h2 className="text-lg font-medium">Select a note</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Pick a note from the list, or create a new one to get started.
      </p>
      <Button onClick={() => navigate('/notes/new')}>
        <Plus className="mr-1 h-4 w-4" />
        New note
      </Button>
    </div>
  );
}
