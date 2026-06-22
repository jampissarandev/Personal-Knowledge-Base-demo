import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

/**
 * Toggles between `light` and `dark`. `system` is preserved by going
 * back to whatever the OS says on the next render.
 */
export function ThemeToggle(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const next = isDark ? 'light' : 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
    >
      <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
