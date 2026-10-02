import type { Client, Lead, Project, Work } from "@/lib/types";
import { http, ApiError } from "../http";

export async function getClients(): Promise<Client[]> {
  return http.get<Client[]>("/clients?limit=100");
}

export async function getClient(id: string): Promise<Client | undefined> {
  try {
    return await http.get<Client>(`/clients/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

/**
 * The backend's client detail endpoint returns the client plus everything
 * linked to it in one round trip, so the client profile page does not need
 * to fetch leads/works/projects separately or filter them client-side.
 */
export interface ClientDetail extends Client {
  leads: Lead[];
  works: Work[];
  projects: Project[];
  conversationId: string | null;
}

export async function getClientDetail(id: string): Promise<ClientDetail | undefined> {
  try {
    return await http.get<ClientDetail>(`/clients/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export interface CreateClientInput {
  name: string;
  company?: string;
  phone: string;
  email?: string;
}

export async function createClient(data: CreateClientInput): Promise<Client> {
  return http.post<Client>("/clients", data);
}
