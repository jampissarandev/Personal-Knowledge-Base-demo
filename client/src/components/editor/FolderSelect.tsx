/**
 * Single-select folder picker. Renders a shadcn `Select` with an
 * "Unfiled" sentinel plus every folder from the cache, sorted by name.
 */
import { Folder as FolderIcon, FolderOpen } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFolders } from '@/hooks/folders';

export const UNFILED = '__unfiled__';

export interface FolderSelectProps {
  value: string | null | undefined;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  /** Optional id for label association. */
  id?: string;
  /** Visible label, used for accessibility. */
  label?: string;
}

export function FolderSelect({ value, onChange, disabled, id, label }: FolderSelectProps) {
  const { data: folders = [] } = useFolders();

  // The shadcn `Select` value is a string; we use a sentinel for the
  // unfiled case so the type stays simple. `null` is what we pass up.
  const internalValue = value === null || value === undefined ? UNFILED : value;

  return (
    <Select
      value={internalValue}
      onValueChange={(v) => onChange(v === UNFILED ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={label ?? 'Folder'}>
        <SelectValue placeholder="Choose folder…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNFILED}>
          <span className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            Unfiled
          </span>
        </SelectItem>
        {folders.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            <span className="flex items-center gap-2">
              <FolderIcon className="h-4 w-4 text-muted-foreground" />
              {f.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
