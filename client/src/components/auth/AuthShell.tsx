import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AuthShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Centered card layout for the auth pages. The route tree
 * (`routes/router.tsx`) keeps the header so the theme toggle still
 * works on `/login` and `/register`; this shell just frames the
 * form on a tinted surface.
 */
export function AuthShell({
  title,
  description,
  children,
}: AuthShellProps): React.ReactElement {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description !== undefined && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  );
}
