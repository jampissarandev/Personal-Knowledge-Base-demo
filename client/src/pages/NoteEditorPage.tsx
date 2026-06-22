/**
 * Note editor — handles both `create` (no id) and `edit` (id in URL)
 * modes. RHF + zod for the title + folder + tag + pin fields; the
 * TipTap editor manages the content separately (the editor's JSON is
 * written into the form via `setValue` on each `onUpdate`).
 *
 * Save handler: `useCreateNote` or `useUpdateNote`. The save button
 * shows a spinner while submitting. Keyboard shortcuts:
 *   - Cmd/Ctrl + S → save
 *   - Cmd/Ctrl + Enter → save
 *
 * Cancel with dirty form opens `<DiscardChangesDialog>`.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Save, Pin } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { TagInput } from '@/components/editor/TagInput';
import { FolderSelect } from '@/components/editor/FolderSelect';
import { DiscardChangesDialog } from '@/components/notes/DiscardChangesDialog';
import { useNote, useCreateNote, useUpdateNote } from '@/hooks/notes';
import { useTogglePin } from '@/hooks/notes';
import { stripHtml } from '@/lib/stripHtml';
import { ApiError } from '@/api/client';
import { toast } from '@/lib/toast';
import { mapNoteError, type ErrorMappingForm } from '@/lib/noteErrors';
import { cn } from '@/lib/utils';

const EMPTY_DOC = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer.'),
  folderId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  contentJson: z.string().min(1, 'Content is required.'),
  contentText: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function NoteEditorPage({ mode }: { mode: 'create' | 'edit' }): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editorRef = useRef<Editor | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

  // Edit-only: load the note.
  const noteQuery = useNote(mode === 'edit' ? id : undefined);
  const note = noteQuery.data;

  const create = useCreateNote();
  const update = useUpdateNote(id ?? '');
  const togglePin = useTogglePin();

  // For create mode, the search results page navigates to
  // `/notes/new?title=<q>` so the user can start a new note with a
  // pre-filled title. Read the param once and seed the form.
  const initialTitle = mode === 'create' ? (searchParams.get('title') ?? '') : '';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialTitle,
      folderId: null,
      tagIds: [],
      isPinned: false,
      contentJson: EMPTY_DOC,
      contentText: '',
    },
  });

  // For edit mode, populate the form once the note loads.
  const [hydrated, setHydrated] = useState(mode === 'create');
  useEffect(() => {
    if (mode === 'edit' && note && !hydrated) {
      form.reset({
        title: note.title,
        folderId: note.folderId,
        tagIds: note.tags.map((t) => t.id),
        isPinned: note.isPinned,
        contentJson: note.contentJson,
        contentText: note.contentText,
      });
      setHydrated(true);
    }
  }, [mode, note, hydrated, form]);

  const initialValuesRef = useRef<FormValues | null>(null);
  useEffect(() => {
    if (mode === 'edit' && note && initialValuesRef.current === null) {
      initialValuesRef.current = {
        title: note.title,
        folderId: note.folderId,
        tagIds: note.tags.map((t) => t.id),
        isPinned: note.isPinned,
        contentJson: note.contentJson,
        contentText: note.contentText,
      };
    }
  }, [mode, note]);

  const isDirty = form.formState.isDirty;
  const isSubmitting = create.isPending || update.isPending;

  // Keyboard shortcuts: Cmd/Ctrl + S, Cmd/Ctrl + Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        void form.handleSubmit(handleSave)();
      } else if (mod && e.key === 'Enter') {
        e.preventDefault();
        void form.handleSubmit(handleSave)();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isSubmitting]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      pendingNavRef.current = () => {
        if (mode === 'edit' && id) navigate(`/notes/${id}`);
        else navigate('/');
      };
      setDiscardOpen(true);
      return;
    }
    if (mode === 'edit' && id) navigate(`/notes/${id}`);
    else navigate('/');
  }, [isDirty, mode, id, navigate]);

  const handleSave = async (values: FormValues) => {
    if (!values.title.trim()) {
      form.setError('title', { type: 'manual', message: 'Title is required.' });
      return;
    }
    const html = editorRef.current?.getHTML() ?? '';
    const contentText =
      (editorRef.current?.getText() ?? '').trim() || stripHtml(html);

    try {
      if (mode === 'create') {
        const created = await create.mutateAsync({
          title: values.title.trim(),
          contentJson: values.contentJson,
          contentText,
          folderId: values.folderId ?? null,
          isPinned: values.isPinned ?? false,
          tagIds: values.tagIds ?? [],
        });
        // Toast is fired by the mutation's onSuccess in `useCreateNote`.
        navigate(`/notes/${created.id}`, { replace: true });
      } else {
        const updated = await update.mutateAsync({
          title: values.title.trim(),
          contentJson: values.contentJson,
          contentText,
          folderId: values.folderId ?? null,
          isPinned: values.isPinned ?? false,
          tagIds: values.tagIds ?? [],
        });
        // Toast is fired by the mutation's onSuccess in `useUpdateNote`.
        navigate(`/notes/${updated.id}`, { replace: true });
      }
    } catch (err) {
      // The hook already surfaces toasts; show a fallback for non-ApiError throws.
      if (!(err instanceof ApiError)) {
        const mapped = mapNoteError(err, form as unknown as ErrorMappingForm<FormValues>, 'note_save_failed');
        if (mapped.message) toast.error(mapped.message);
      }
    }
  };

  if (mode === 'edit' && noteQuery.isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (mode === 'edit' && noteQuery.isError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          {noteQuery.error instanceof ApiError
            ? noteQuery.error.message
            : 'Failed to load note.'}
        </p>
        <Button asChild className="mt-3" variant="outline" size="sm">
          <Link to="/">Back to notes</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            aria-label="Cancel"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Cancel
          </Button>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-1 space-y-0">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Untitled"
                    className={cn(
                      'h-auto border-0 px-2 text-2xl font-semibold shadow-none focus-visible:ring-0',
                    )}
                    aria-label="Note title"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage className="px-2" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPinned"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Button
                    type="button"
                    variant={field.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      field.onChange(!field.value);
                      if (mode === 'edit' && id) {
                        togglePin.mutate(id);
                      }
                    }}
                    disabled={isSubmitting}
                    aria-label={field.value ? 'Unpin' : 'Pin'}
                    aria-pressed={!!field.value}
                  >
                    <Pin className="mr-1 h-3.5 w-3.5" />
                    {field.value ? 'Pinned' : 'Pin'}
                  </Button>
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1 h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="overflow-hidden rounded-md border">
              <EditorToolbar editor={editorRef.current} />
              <RichTextEditor
                editable={!isSubmitting}
                initialContent={form.watch('contentJson') || EMPTY_DOC}
                onChange={(json) => {
                  form.setValue('contentJson', json, { shouldDirty: true });
                  // Mirror plain text into the form for the save payload.
                  const text = editorRef.current?.getText() ?? '';
                  form.setValue('contentText', text, { shouldDirty: true });
                }}
                editorRef={editorRef}
                minHeight="40vh"
              />
            </div>

            <Card className="bg-muted/40">
              <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="folderId"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Folder
                      </label>
                      <FormControl>
                        <FolderSelect
                          value={field.value ?? null}
                          onChange={(v) => field.onChange(v)}
                          disabled={isSubmitting}
                          label="Folder"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tagIds"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Tags
                      </label>
                      <FormControl>
                        <TagInput
                          value={field.value ?? []}
                          onChange={(v) => field.onChange(v)}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <DiscardChangesDialog
          open={discardOpen}
          onOpenChange={(o) => {
            setDiscardOpen(o);
            if (!o) pendingNavRef.current = null;
          }}
          onDiscard={() => {
            const fn = pendingNavRef.current;
            setDiscardOpen(false);
            pendingNavRef.current = null;
            fn?.();
          }}
        />
      </form>
    </Form>
  );
}
