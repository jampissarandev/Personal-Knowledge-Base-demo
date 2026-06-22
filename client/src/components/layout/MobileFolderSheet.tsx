/**
 * Mobile sheet that wraps the `FolderSidebar` for screens below the
 * `lg:` breakpoint. Triggered by a hamburger in the header.
 */
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FolderSidebar } from './FolderSidebar';

export function MobileFolderSheet() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open folders and tags"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Folders and tags</SheetTitle>
        </SheetHeader>
        <FolderSidebar />
      </SheetContent>
    </Sheet>
  );
}
