/**
 * Pin toggle button. Uses `useTogglePin` for an optimistic cache
 * update; the click is also reflected synchronously (the hook's
 * `onMutate` runs before the network call).
 */
import { Pin, PinOff } from 'lucide-react';
import { useTogglePin } from '@/hooks/notes';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PinButtonProps {
  noteId: string;
  pinned: boolean;
  /** Render as an icon button (default) or an inline variant. */
  variant?: 'icon' | 'inline';
  className?: string;
  disabled?: boolean;
}

export function PinButton({
  noteId,
  pinned,
  variant = 'icon',
  className,
  disabled,
}: PinButtonProps) {
  const toggle = useTogglePin();

  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || toggle.isPending) return;
    toggle.mutate(noteId);
  };

  const Icon = pinned ? Pin : PinOff;
  const label = pinned ? 'Unpin note' : 'Pin note';

  if (variant === 'inline') {
    return (
      <Button
        type="button"
        variant={pinned ? 'default' : 'outline'}
        size="sm"
        onClick={handle}
        disabled={disabled || toggle.isPending}
        className={className}
        aria-label={label}
      >
        <Icon className="mr-1 h-3.5 w-3.5" />
        {pinned ? 'Pinned' : 'Pin'}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handle}
          disabled={disabled || toggle.isPending}
          className={cn(pinned && 'text-amber-500', className)}
          aria-label={label}
          aria-pressed={pinned}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
