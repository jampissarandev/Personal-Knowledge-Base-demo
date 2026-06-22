import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * `attribute="class"` toggles `class="dark"` on `<html>`, which is what
 * Tailwind's `darkMode: ['class']` reads. `defaultTheme="system"` respects
 * the OS preference on first visit; `enableSystem` is implied by it.
 */
export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
