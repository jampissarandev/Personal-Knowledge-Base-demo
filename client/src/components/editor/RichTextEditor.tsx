/**
 * TipTap rich-text editor wrapper.
 *
 * Two modes:
 *  - `editable={true}`  — used by the note editor (new + edit routes).
 *  - `editable={false}` — used by the read-only detail view.
 *
 * SSR safety: `useEditor` returns `null` on the first render. The
 * component renders a Skeleton in that case and the real editor mounts
 * on the second paint. This avoids React 18 strict-mode double-mount
 * warnings AND keeps the layout stable while TipTap initialises.
 *
 * XSS: TipTap renders its own DOM via the ProseMirror schema — no
 * `dangerouslySetInnerHTML` is used. The HTML produced by `getHTML()`
 * is never injected into the page; it is only used inside TipTap's
 * own managed DOM via the `<EditorContent>` mount.
 */
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface RichTextEditorProps {
  /** When `true`, the editor accepts input. `false` renders read-only. */
  editable: boolean;
  /**
   * Initial content. Either a JSON-encoded TipTap document string
   * (the wire shape used by the backend) or a plain string (treated
   * as the starting document text). `undefined` / empty starts empty.
   */
  initialContent?: string;
  /** Called on every editor update. `json` is the JSON-stringified doc. */
  onChange?: (json: string) => void;
  /** Optional className for the outer container. */
  className?: string;
  /** Minimum height for the content area (e.g. '60vh'). */
  minHeight?: string;
  /** Optional ref so the parent can read the editor instance. */
  editorRef?: React.MutableRefObject<Editor | null>;
}

function parseInitial(content: string | undefined): object | string {
  if (!content) return '';
  try {
    const parsed: unknown = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && 'type' in parsed) {
      return parsed as object;
    }
  } catch {
    // Fall through — treat as plain text.
  }
  return content;
}

export function RichTextEditor({
  editable,
  initialContent,
  onChange,
  className,
  minHeight = '60vh',
  editorRef,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Defaults are fine: Paragraph, Bold, Italic, Strike, Code,
        // CodeBlock, Heading, BulletList, OrderedList, ListItem,
        // Blockquote, HardBreak, HorizontalRule, History, Document, Text.
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
    ],
    editable,
    content: parseInitial(initialContent),
    onUpdate: ({ editor: ed }) => {
      onChange?.(JSON.stringify(ed.getJSON()));
    },
    // Avoid SSR mismatches: render the editor only on the client.
    immediatelyRender: false,
  });

  // Expose the editor instance to the parent for shortcut handlers and
  // dirty-state tracking.
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // React to `editable` changes (e.g. detail page never changes it, but
  // the parent could swap a `readOnly` prop without remounting).
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  if (!editor) {
    return <Skeleton className={cn('w-full', className)} style={{ minHeight }} />;
  }

  return (
    <div
      className={cn(
        'prose prose-sm sm:prose-base dark:prose-invert max-w-none',
        'rounded-md border border-input bg-background',
        'focus-within:ring-1 focus-within:ring-ring',
        className,
      )}
      style={{ minHeight }}
    >
      <EditorContent
        editor={editor}
        className="p-4 outline-none"
        aria-label={editable ? 'Note content' : 'Note content (read-only)'}
      />
    </div>
  );
}
