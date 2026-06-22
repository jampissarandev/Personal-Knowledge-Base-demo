import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * App chrome: sticky header + scrollable main. Phase 6: removed the
 * `container py-6` wrapper because the dashboard owns its own 3-pane
 * grid (full-bleed). Auth + 404 pages use a centered card and don't
 * care about the outer padding.
 */
export function Layout(): React.ReactElement {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <Outlet />
      </div>
    </TooltipProvider>
  );
}
