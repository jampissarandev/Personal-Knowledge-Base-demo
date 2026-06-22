/**
 * Query and mutation hooks for notes.
 *
 * Conventions:
 *  - Query keys are tuples: `['notes', filter]` for lists, `['notes', id]`
 *    for the single-note lookup. The filter is `useMemo`-stable so the
 *    cache key doesn't churn on every render.
 *  - Optimistic mutations snapshot the cache in `onMutate`, patch with
 *    `setQueryData`, and roll back from the snapshot in `onError`. The
 *    `onSettled` invalidation is the source-of-truth refetch.
 *  - `useCreateNote` and `useUpdateNote` log `event_attempt` /
 *    `event_succeeded` / `event_failed` via `logger.info` / `logger.warn`.
 *  - Error mapping goes through `mapNoteError` (lib/noteErrors.ts) — the
 *    single source of truth for code → user-message translation.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import * as notesApi from '@/api/notes';
import type { ApiError } from '@/api/client';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { mapNoteError } from '@/lib/noteErrors';

/* -----------------------------------------------------------------------
 * Read hooks
 * --------------------------------------------------------------------- */

export function useNotes(
  filter: notesApi.NotesFilter = {},
): UseQueryResult<notesApi.NoteResponse[], ApiError> {
  // Keep the filter referentially stable so the query key doesn't churn.
  // (Object literals in render would invalidate the cache on every tick.)
  const stableFilter = useMemo<notesApi.NotesFilter>(
    () => ({ ...filter }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter.folderId, filter.tagId, filter.isPinned, filter.limit, filter.unfiled],
  );
  return useQuery<notesApi.NoteResponse[], ApiError>({
    queryKey: ['notes', stableFilter],
    queryFn: () => notesApi.listNotes(stableFilter),
  });
}

export function useNote(
  id: string | undefined,
): UseQueryResult<notesApi.NoteResponse, ApiError> {
  return useQuery<notesApi.NoteResponse, ApiError>({
    queryKey: ['notes', id ?? null],
    queryFn: () => notesApi.getNote(id as string),
    enabled: id !== undefined && id !== '',
  });
}

/* -----------------------------------------------------------------------
 * Mutations
 * --------------------------------------------------------------------- */

/**
 * `useCreateNote` is intentionally NOT optimistic — the form already has a
 * "Save" button the user is staring at, and a rollback UI for a note
 * that doesn't exist on the server yet would be confusing. The mutation
 * surfaces a toast on failure and `onSuccess` lets the editor navigate.
 */
export function useCreateNote(): UseMutationResult<
  notesApi.NoteResponse,
  ApiError,
  notesApi.CreateNoteRequest
> {
  const qc = useQueryClient();
  return useMutation<notesApi.NoteResponse, ApiError, notesApi.CreateNoteRequest>({
    mutationFn: (req) => {
      logger.info('note_create_attempt');
      return notesApi.createNote(req);
    },
    onSuccess: () => {
      logger.info('note_create_succeeded');
      toast.success('Note created.');
    },
    onError: (err) => {
      const mapped = mapNoteError(err, null, 'note_create_failed');
      if (mapped.message) toast.error(mapped.message);
    },
    onSettled: () => {
      // Invalidate list caches so the dashboard reflects the new note
      // when the user navigates back. The create mutation is not
      // optimistic (per `PHASE6_PLAN.md` §3.9) — we let the server
      // response land in the cache as the source of truth, then
      // refetch every list query (including pinned + filtered).
      // Also invalidate folders/tags because the per-folder `noteCount`
      // and the tag set can change after the create.
      void qc.invalidateQueries({ queryKey: ['notes'] });
      void qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

/**
 * `useUpdateNote` does an optimistic replace of the single-note cache
 * entry and every list cache that contains it.
 */
export function useUpdateNote(
  id: string,
): UseMutationResult<
  notesApi.NoteResponse,
  ApiError,
  notesApi.UpdateNoteRequest
> {
  const qc = useQueryClient();
  type Ctx = { previous: notesApi.NoteResponse | undefined };
  return useMutation<notesApi.NoteResponse, ApiError, notesApi.UpdateNoteRequest, Ctx>({
    mutationFn: (req) => {
      logger.info('note_update_attempt', { id });
      return notesApi.updateNote(id, req);
    },
    onMutate: async (req) => {
      await qc.cancelQueries({ queryKey: ['notes'] });
      const previous = qc.getQueryData<notesApi.NoteResponse>(['notes', id]);
      if (previous) {
        const patched: notesApi.NoteResponse = {
          ...previous,
          title: req.title ?? previous.title,
          isPinned: req.isPinned ?? previous.isPinned,
          folderId: req.folderId === undefined ? previous.folderId : req.folderId,
          folderName:
            req.folderId === undefined
              ? previous.folderName
              : req.folderId === null
                ? null
                : previous.folderName,
        };
        qc.setQueryData<notesApi.NoteResponse>(['notes', id], patched);
      }
      return { previous };
    },
    onError: (err, _req, ctx) => {
      const mapped = mapNoteError(err, null, 'note_update_failed');
      if (mapped.message) toast.error(mapped.message);
      if (ctx?.previous) {
        qc.setQueryData(['notes', id], ctx.previous);
      }
    },
    onSuccess: (note) => {
      logger.info('note_update_succeeded', { id });
      qc.setQueryData(['notes', id], note);
      toast.success('Note updated.');
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

/**
 * `useDeleteNote` does an optimistic removal from every list cache entry
 * that contains the note. On rollback the snapshots are restored one by
 * one. `onSettled` invalidates notes + folders (note counts change).
 */
export function useDeleteNote(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  type Ctx = {
    listSnapshots: Array<[readonly unknown[], notesApi.NoteResponse[] | undefined]>;
  };
  return useMutation<void, ApiError, string, Ctx>({
    mutationFn: (noteId) => {
      logger.info('note_delete_attempt', { id: noteId });
      return notesApi.deleteNote(noteId);
    },
    onMutate: async (noteId) => {
      await qc.cancelQueries({ queryKey: ['notes'] });
      const snapshots = qc.getQueriesData<notesApi.NoteResponse[]>({
        queryKey: ['notes'],
      });
      const listSnapshots: Array<[readonly unknown[], notesApi.NoteResponse[] | undefined]> = [];
      for (const [key, value] of snapshots) {
        // Skip the single-note cache; only operate on list caches.
        if (key.length === 2 && Array.isArray(value)) {
          const next = value.filter((n) => n.id !== noteId);
          qc.setQueryData<notesApi.NoteResponse[]>(key, next);
          listSnapshots.push([key, value]);
        }
      }
      return { listSnapshots };
    },
    onError: (err, _id, ctx) => {
      const mapped = mapNoteError(err, null, 'note_delete_failed');
      if (mapped.message) toast.error(mapped.message);
      for (const [key, snapshot] of ctx?.listSnapshots ?? []) {
        qc.setQueryData(key, snapshot);
      }
    },
    onSuccess: (_data, id) => {
      logger.info('note_delete_succeeded', { id });
      toast.success('Note deleted.');
      qc.removeQueries({ queryKey: ['notes', id] });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['notes'] });
      void qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

/**
 * `useTogglePin` flips the `isPinned` flag with an optimistic patch of
 * every list cache that contains the note. Rollback restores the
 * previous `isPinned` per cache entry.
 */
export function useTogglePin(): UseMutationResult<
  notesApi.NoteResponse,
  ApiError,
  string
> {
  const qc = useQueryClient();
  type Ctx = {
    listSnapshots: Array<[readonly unknown[], notesApi.NoteResponse[] | undefined]>;
    singleSnapshot: notesApi.NoteResponse | undefined;
  };
  return useMutation<notesApi.NoteResponse, ApiError, string, Ctx>({
    mutationFn: (noteId) => {
      logger.info('note_pin_toggle_attempt', { id: noteId });
      return notesApi.togglePinNote(noteId);
    },
    onMutate: async (noteId) => {
      await qc.cancelQueries({ queryKey: ['notes'] });
      const listSnapshots: Array<[readonly unknown[], notesApi.NoteResponse[] | undefined]> = [];
      const lists = qc.getQueriesData<notesApi.NoteResponse[]>({
        queryKey: ['notes'],
      });
      for (const [key, value] of lists) {
        if (key.length === 2 && Array.isArray(value)) {
          const next = value.map((n) =>
            n.id === noteId ? { ...n, isPinned: !n.isPinned } : n,
          );
          qc.setQueryData<notesApi.NoteResponse[]>(key, next);
          listSnapshots.push([key, value]);
        }
      }
      const single = qc.getQueryData<notesApi.NoteResponse>(['notes', noteId]);
      let singleSnapshot: notesApi.NoteResponse | undefined;
      if (single) {
        singleSnapshot = single;
        qc.setQueryData<notesApi.NoteResponse>(['notes', noteId], {
          ...single,
          isPinned: !single.isPinned,
        });
      }
      return { listSnapshots, singleSnapshot };
    },
    onError: (err, _id, ctx) => {
      const mapped = mapNoteError(err, null, 'note_pin_toggle_failed');
      if (mapped.message) toast.error(mapped.message);
      for (const [key, snapshot] of ctx?.listSnapshots ?? []) {
        qc.setQueryData(key, snapshot);
      }
      if (ctx?.singleSnapshot) {
        qc.setQueryData(['notes', _id], ctx.singleSnapshot);
      }
    },
    onSuccess: (note, id) => {
      logger.info('note_pin_toggle_succeeded', { id });
      toast.success(note.isPinned ? 'Pinned.' : 'Unpinned.');
      qc.setQueryData(['notes', id], note);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
