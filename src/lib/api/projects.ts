import type { Project } from "@/lib/types";
import { http, ApiError } from "../http";

export async function getProjects(): Promise<Project[]> {
  return http.get<Project[]>("/projects?limit=100");
}

export async function getProject(id: string): Promise<Project | undefined> {
  try {
    return await http.get<Project>(`/projects/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export interface CreateProjectInput {
  name: string;
  clientId: string;
  services?: string[];
  teamIds?: string[];
  deadline: string;
  status?: Project["status"];
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  return http.post<Project>("/projects", data);
}

export async function addProjectTask(id: string, title: string, assigneeId?: string): Promise<Project> {
  return http.post<Project>(`/projects/${id}/tasks`, { title, assigneeId });
}

export async function toggleProjectTask(id: string, taskId: string, done: boolean): Promise<Project> {
  return http.patch<Project>(`/projects/${id}/tasks/${taskId}`, { done });
}

export async function addProjectComment(id: string, message: string): Promise<Project> {
  return http.post<Project>(`/projects/${id}/comments`, { message });
}
