/**
 * Single import path for `sonner`'s toast helpers. Centralising the import
 * means a future swap to a different toast library (or a re-export wrapper
 * that adds app-specific defaults) is a one-file change.
 *
 * The actual `<Toaster />` is mounted once in `main.tsx`; consumers only
 * import the imperative helpers from here.
 */
export { toast } from 'sonner';
