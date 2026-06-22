/**
 * Tag multi-select with inline create. The popover lists every tag
 * with a checkbox; users can toggle them and (optionally) type a new
 * name + "Create" to add a brand-new tag without leaving the editor.
 *
 * The component is controlled: `value` is the current set of selected
 * tag ids, `onChange` fires with the new set. `onCreated` is called
 * with the freshly-created tag id when the user creates a new one
 * inline (so the editor can pre-select it).
 */
import { Check, Plus, Tag as TagIcon } from 'lucide-react';
import { useState, useId } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTags, useCreateTag } from '@/hooks/tags';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Disable the trigger + popover while a parent form is submitting. */
  disabled?: boolean;
  /** Called when an inline create succeeds (parent may want to pre-select). */
  onCreated?: (newTagId: string) => void;
}

export function TagInput({ value, onChange, disabled, onCreated }: TagInputProps) {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const formId = useId();

  const selected = new Set(value);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(Array.from(next));
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      const created = await createTag.mutateAsync({ name: trimmed });
      setNewName('');
      onCreated?.(created.id);
      onChange([...value, created.id]);
    } catch {
      // Error toast already surfaced by the hook.
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-9 justify-start gap-2 font-normal"
          aria-label="Edit tags"
        >
          <TagIcon className="h-4 w-4" />
          {value.length === 0 ? (
            <span className="text-muted-foreground">Add tags…</span>
          ) : (
            <span>
              {value.length} tag{value.length === 1 ? '' : 's'}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="max-h-64 overflow-y-auto p-2">
          {tags.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              No tags yet. Create one below.
            </p>
          ) : (
            tags.map((tag) => {
              const checked = selected.has(tag.id);
              return (
                <label
                  key={tag.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                    'hover:bg-accent',
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(tag.id)}
                    aria-label={`Toggle tag ${tag.name}`}
                  />
                  <span className="flex-1">{tag.name}</span>
                  {checked && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
                </label>
              );
            })
          )}
        </div>
        <div className="border-t p-2">
          <div className="flex items-center gap-2">
            <Input
              id={formId}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New tag name"
              className="h-8"
              disabled={createTag.isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleCreate();
                }
              }}
              maxLength={50}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void handleCreate()}
              disabled={!newName.trim() || createTag.isPending}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Create
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Display-only list of selected tags. Used by the note detail page to
 * render the tag chips below the title.
 */
export interface TagChipListProps {
  tags: { id: string; name: string }[];
  onClickTag?: (id: string) => void;
}

export function TagChipList({ tags, onClickTag }: TagChipListProps) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Badge
          key={t.id}
          variant="secondary"
          className={cn(
            'font-normal',
            onClickTag && 'cursor-pointer hover:bg-secondary/80',
          )}
          onClick={onClickTag ? () => onClickTag(t.id) : undefined}
        >
          {t.name}
        </Badge>
      ))}
    </div>
  );
}
