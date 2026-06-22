import { api } from './client';
import type { TagRef } from './types';

/** Mirrors backend `DTOs/Tags/TagResponse.cs`. */
export interface TagResponse extends TagRef {
  createdAt: string;
}

/** Mirrors backend `DTOs/Tags/CreateTagRequest.cs`. */
export interface CreateTagRequest {
  name: string;
}

export async function listTags(): Promise<TagResponse[]> {
  const { data } = await api.get<TagResponse[]>('/tags');
  return data;
}

export async function createTag(req: CreateTagRequest): Promise<TagResponse> {
  const { data } = await api.post<TagResponse>('/tags', req);
  return data;
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete<void>(`/tags/${id}`);
}
