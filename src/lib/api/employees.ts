import type { Availability, Employee } from "@/lib/types";
import { http, ApiError } from "../http";

export async function getEmployees(): Promise<Employee[]> {
  return http.get<Employee[]>("/employees?limit=100");
}

export async function getEmployee(id: string): Promise<Employee | undefined> {
  try {
    return await http.get<Employee>(`/employees/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function updateEmployeeAvailability(id: string, availability: Availability): Promise<Employee | undefined> {
  try {
    return await http.patch<Employee>(`/employees/${id}`, { availability });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export interface CreateEmployeeInput {
  name: string;
  role: string;
  email: string;
  phone: string;
  availability?: Availability;
  skills?: string[];
}

export async function createEmployee(data: CreateEmployeeInput): Promise<Employee> {
  return http.post<Employee>("/employees", data);
}

export async function deactivateEmployee(id: string): Promise<Employee | undefined> {
  try {
    return await http.post<Employee>(`/employees/${id}/deactivate`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return undefined;
    throw err;
  }
}
