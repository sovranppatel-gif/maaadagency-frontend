import type { ServiceItem } from "@/lib/types";
import { http, ApiError } from "../http";

export async function getServices(): Promise<ServiceItem[]> {
  return http.get<ServiceItem[]>("/services");
}

export async function toggleServiceStatus(id: string): Promise<ServiceItem | undefined> {
  try {
    return await http.post<ServiceItem>(`/services/${id}/toggle`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function createService(data: Partial<ServiceItem>): Promise<ServiceItem> {
  return http.post<ServiceItem>("/services", data);
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    const res = await http.del<{ deleted: boolean }>(`/services/${id}`);
    return Boolean(res?.deleted);
  } catch (err) {
    // The backend refuses to delete a service still referenced by leads
    // (400) — surface that to the caller instead of silently reporting ok.
    throw err instanceof ApiError ? err : new Error("Could not delete service");
  }
}
