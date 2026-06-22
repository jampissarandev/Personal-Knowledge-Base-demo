import { api } from './client';
import type { TagRef } from './types';

/**
 * Full note payload returned by every `/api/notes` endpoint. Mirrors the
 * backend `DTOs/Notes/NoteResponse.cs`. `contentJson` is a JSON-encoded
 * string (TipTap document) — clients should `JSON.parse` before feeding
 * to TipTap's `setContent`. `contentText` is the server's plain-text
 * projection (used for FTS5 + previews; the server is the source of truth).
 */
export interface NoteResponse {
  id: string;
  title: string;
  contentJson: string;
  contentText: string;
  folderId: string | null;
  folderName: string | null;
  isPinned: boolean;
  tags: TagRef[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  /** JSON-serialised TipTap document. The backend re-derives `contentText`. */
  contentJson: string;
  contentText: string;
  folderId?: string | null;
  isPinned?: boolean;
  tagIds?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  contentJson?: string;
  contentText?: string;
  folderId?: string | null;
  isPinned?: boolean;
  tagIds?: string[];
}

/**
 * Query string for `listNotes`. `folderId === null` filters to unfiled
 * notes; `folderId === undefined` omits the filter (returns all folders).
 * Same semantics for the backend `[FromQuery] Guid?` parameter.
 */
export interface NotesFilter {
  folderId?: string | null;
  tagId?: string;
  isPinned?: boolean;
  limit?: number;
}

function toQueryString(filter: NotesFilter): string {
  const params = new URLSearchParams();
  if (filter.folderId !== undefined) {
    params.set('folderId', filter.folderId === null ? '' : filter.folderId);
  }
  if (filter.tagId !== undefined) {
    params.set('tagId', filter.tagId);
  }
  if (filter.isPinned !== undefined) {
    params.set('isPinned', String(filter.isPinned));
  }
  if (filter.limit !== undefined) {
    params.set('limit', String(filter.limit));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listNotes(filter: NotesFilter = {}): Promise<NoteResponse[]> {
  const { data } = await api.get<NoteResponse[]>(`/notes${toQueryString(filter)}`);
  return data;
}

export async function getNote(id: string): Promise<NoteResponse> {
  const { data } = await api.get<NoteResponse>(`/notes/${id}`);
  return data;
}

export async function createNote(req: CreateNoteRequest): Promise<NoteResponse> {
  const { data } = await api.post<NoteResponse>('/notes', req);
  return data;
}

export async function updateNote(id: string, req: UpdateNoteRequest): Promise<NoteResponse> {
  const { data } = await api.put<NoteResponse>(`/notes/${id}`, req);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete<void>(`/notes/${id}`);
}

export async function togglePinNote(id: string): Promise<NoteResponse> {
  const { data } = await api.patch<NoteResponse>(`/notes/${id}/pin`);
  return data;
}
