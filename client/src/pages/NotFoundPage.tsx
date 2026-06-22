import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage(): React.ReactElement {
  return (
    <section
      aria-labelledby="notfound-heading"
      className="mx-auto flex max-w-md flex-col items-start gap-4 py-16"
    >
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1
        id="notfound-heading"
        className="text-2xl font-semibold tracking-tight"
      >
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground">
        The page you were looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </section>
  );
}
