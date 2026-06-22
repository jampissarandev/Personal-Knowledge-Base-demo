import { api } from './client';

/** Mirrors backend `DTOs/Folders/FolderResponse.cs`. */
export interface FolderResponse {
  id: string;
  name: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors backend `DTOs/Folders/CreateFolderRequest.cs`. */
export interface CreateFolderRequest {
  name: string;
}

export async function listFolders(): Promise<FolderResponse[]> {
  const { data } = await api.get<FolderResponse[]>('/folders');
  return data;
}

export async function createFolder(
  req: CreateFolderRequest,
): Promise<FolderResponse> {
  const { data } = await api.post<FolderResponse>('/folders', req);
  return data;
}

export async function deleteFolder(id: string): Promise<void> {
  await api.delete<void>(`/folders/${id}`);
}
