/**
 * Query and mutation hooks for folders. Like tags, folder mutations
 * are not optimistic — the create flow has its own dialog UI and the
 * user expects the new option to appear in the picker.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as foldersApi from '@/api/folders';
import type { ApiError } from '@/api/client';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { mapNoteError } from '@/lib/noteErrors';

export function useFolders(): UseQueryResult<foldersApi.FolderResponse[], ApiError> {
  return useQuery<foldersApi.FolderResponse[], ApiError>({
    queryKey: ['folders'],
    queryFn: () => foldersApi.listFolders(),
  });
}

export function useCreateFolder(): UseMutationResult<
  foldersApi.FolderResponse,
  ApiError,
  foldersApi.CreateFolderRequest
> {
  const qc = useQueryClient();
  return useMutation<foldersApi.FolderResponse, ApiError, foldersApi.CreateFolderRequest>({
    mutationFn: (req) => {
      logger.info('folder_create_attempt');
      return foldersApi.createFolder(req);
    },
    onSuccess: () => {
      logger.info('folder_create_succeeded');
      toast.success('Folder created.');
    },
    onError: (err) => {
      const mapped = mapNoteError(err, null, 'folder_create_failed');
      if (mapped.message) toast.error(mapped.message);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useDeleteFolder(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => {
      logger.info('folder_delete_attempt', { id });
      return foldersApi.deleteFolder(id);
    },
    onSuccess: (_data, id) => {
      logger.info('folder_delete_succeeded', { id });
      toast.success('Folder deleted.');
    },
    onError: (err) => {
      const mapped = mapNoteError(err, null, 'folder_delete_failed');
      if (mapped.message) toast.error(mapped.message);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['folders'] });
      // Backend sets folderId=NULL on the cascade; invalidate so the
      // unfiled count + per-note folderName refresh.
      void qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
