/**
 * Query and mutation hooks for tags. Tag mutations are not optimistic
 * (the create flow has its own UI — a popover with a name input — and
 * the user expects a new option to appear in the picker).
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as tagsApi from '@/api/tags';
import type { ApiError } from '@/api/client';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { mapNoteError } from '@/lib/noteErrors';

export function useTags(): UseQueryResult<tagsApi.TagResponse[], ApiError> {
  return useQuery<tagsApi.TagResponse[], ApiError>({
    queryKey: ['tags'],
    queryFn: () => tagsApi.listTags(),
  });
}

export function useCreateTag(): UseMutationResult<
  tagsApi.TagResponse,
  ApiError,
  tagsApi.CreateTagRequest
> {
  const qc = useQueryClient();
  return useMutation<tagsApi.TagResponse, ApiError, tagsApi.CreateTagRequest>({
    mutationFn: (req) => {
      logger.info('tag_create_attempt');
      return tagsApi.createTag(req);
    },
    onSuccess: () => {
      logger.info('tag_create_succeeded');
      toast.success('Tag created.');
    },
    onError: (err) => {
      const mapped = mapNoteError(err, null, 'tag_create_failed');
      if (mapped.message) toast.error(mapped.message);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => {
      logger.info('tag_delete_attempt', { id });
      return tagsApi.deleteTag(id);
    },
    onSuccess: (_data, id) => {
      logger.info('tag_delete_succeeded', { id });
      toast.success('Tag deleted.');
    },
    onError: (err) => {
      const mapped = mapNoteError(err, null, 'tag_delete_failed');
      if (mapped.message) toast.error(mapped.message);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['tags'] });
      void qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
