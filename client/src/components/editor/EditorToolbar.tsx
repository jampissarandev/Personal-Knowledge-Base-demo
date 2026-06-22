/**
 * Sticky toolbar for the TipTap editor. Each button reflects the
 * editor's current selection state (`aria-pressed={isActive(...)}`).
 *
 * Keyboard shortcuts (Mod-B / Mod-I / Mod-K / etc.) are provided by
 * TipTap's `StarterKit` and the `Link` extension out of the box — the
 * toolbar is a UI affordance, not the only entry point.
 */
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton({ onClick, isActive, label, children, disabled }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      className={cn('h-8 w-8', isActive && 'bg-accent text-accent-foreground')}
    >
      {children}
    </Button>
  );
}

export interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return (
      <div
        className="flex items-center gap-1 border-b bg-muted/40 px-2 py-1"
        aria-hidden
      >
        <span className="text-xs text-muted-foreground">Loading toolbar…</span>
      </div>
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 border-b bg-muted/40 px-2 py-1"
    >
      <ToolbarButton
        label="Bold (Ctrl+B)"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic (Ctrl+I)"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        label="Heading 1"
        isActive={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        label="Bulleted list"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code block"
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        label="Link (Ctrl+K)"
        isActive={editor.isActive('link')}
        onClick={setLink}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
