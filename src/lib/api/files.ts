import type { FileCategory, FileRecord } from "@/lib/types";
import { http, toQueryString } from "../http";

export async function getFiles(category: FileCategory | "All" = "All", search = ""): Promise<FileRecord[]> {
  const qs = toQueryString({ category, search, limit: 100 });
  return http.get<FileRecord[]>(`/files${qs}`);
}

export async function uploadFiles(
  files: File[],
  meta: { category?: FileCategory; clientId?: string; projectId?: string; workId?: string } = {}
): Promise<FileRecord[]> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  if (meta.category) form.append("category", meta.category);
  if (meta.clientId) form.append("clientId", meta.clientId);
  if (meta.projectId) form.append("projectId", meta.projectId);
  if (meta.workId) form.append("workId", meta.workId);
  return http.post<FileRecord[]>("/files", form);
}

export async function deleteFile(id: string): Promise<boolean> {
  const res = await http.del<{ deleted: boolean }>(`/files/${id}`);
  return Boolean(res?.deleted);
}
