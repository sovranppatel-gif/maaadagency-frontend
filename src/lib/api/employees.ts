import type { Availability, Employee, EmployeeProfile } from "@/lib/types";
import { http, ApiError, toQueryString } from "../http";

export interface EmployeeListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface EmployeeListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "Active" | "Inactive" | "All";
  department?: string;
}

export interface EmployeeListResult {
  employees: Employee[];
  meta: EmployeeListMeta;
}

export type EmployeeLoginStatus = "NO_LOGIN" | "INVITATION_PENDING" | "ACTIVE" | "DISABLED";

export interface EmployeeLoginAccess {
  status: EmployeeLoginStatus;
  loginEmail: string;
  lastLoginAt: string | null;
  invitationExpiresAt?: string | null;
  invitationExpired?: boolean;
}

export interface OneTimeEmployeeLink {
  access: EmployeeLoginAccess;
  setupPath: string;
  expiresAt: string;
  warning: string;
}

export async function getEmployees(): Promise<Employee[]> {
  return http.get<Employee[]>("/employees?limit=100");
}

export async function getEmployeesPage(filters: EmployeeListFilters = {}): Promise<EmployeeListResult> {
  const response = await http.get<{ data: Employee[]; meta: EmployeeListMeta }>(
    `/employees${toQueryString({ ...filters })}`,
    { withMeta: true }
  );
  return { employees: response.data, meta: response.meta };
}

export async function getEmployeeStats(): Promise<{ total: number; available: number; busy: number; onLeave: number }> {
  return http.get("/employees/stats");
}

export async function getEmployee(id: string): Promise<EmployeeProfile | undefined> {
  try {
    return await http.get<EmployeeProfile>(`/employees/${id}`);
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
  alternatePhone?: string;
  department?: string;
  employmentType?: string;
  address?: string;
  city?: string;
  reportingManager?: string;
  joinedAt?: string;
  isActive?: boolean;
  availability?: Availability;
  skills?: string[];
}

export async function createEmployee(data: CreateEmployeeInput): Promise<Employee> {
  return http.post<Employee>("/employees", data);
}

export async function updateEmployee(id: string, data: Partial<CreateEmployeeInput>): Promise<Employee> {
  return http.patch<Employee>(`/employees/${id}`, data);
}

export async function deactivateEmployee(id: string): Promise<Employee | undefined> {
  return http.post<Employee>(`/employees/${id}/deactivate`);
}

export async function getEmployeeLoginAccess(id: string): Promise<EmployeeLoginAccess> {
  return http.get<EmployeeLoginAccess>(`/employees/${id}/access`);
}

export async function createEmployeeLogin(id: string): Promise<OneTimeEmployeeLink> {
  return http.post<OneTimeEmployeeLink>(`/employees/${id}/access`);
}

export async function resendEmployeeInvitation(id: string): Promise<OneTimeEmployeeLink> {
  return http.post<OneTimeEmployeeLink>(`/employees/${id}/access/invitation`);
}

export async function initiateEmployeePasswordReset(id: string): Promise<OneTimeEmployeeLink> {
  return http.post<OneTimeEmployeeLink>(`/employees/${id}/access/reset`);
}

export async function setEmployeeLoginEnabled(id: string, enabled: boolean): Promise<EmployeeLoginAccess> {
  return http.patch<EmployeeLoginAccess>(`/employees/${id}/access`, { enabled });
}
