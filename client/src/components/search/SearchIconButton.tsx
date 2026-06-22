/**
 * Mobile-only search icon button. Opens a `<Sheet>` containing the
 * full search experience (input + result list). Visible only below
 * the `md:` breakpoint.
 */
import { Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MobileSearchSheet } from './MobileSearchSheet';

export function SearchIconButton(): React.ReactElement {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open search"
        >
          <SearchIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Search</SheetTitle>
        </SheetHeader>
        <MobileSearchSheet />
      </SheetContent>
    </Sheet>
  );
}
