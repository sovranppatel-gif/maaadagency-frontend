"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Users, UserCheck, Clock3, UserMinus, ChevronLeft, ChevronRight } from "lucide-react";
import { StatCard } from "@/components/master-admin/StatCard";
import { EmployeeCard } from "@/components/master-admin/EmployeeCard";
import { EmployeeFormModal } from "@/components/master-admin/EmployeeFormModal";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { Card } from "@/components/master-admin/ui/Card";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { useAuth } from "@/lib/auth-context";
import { useDirectory } from "@/lib/directory";
import {
  createEmployee,
  deactivateEmployee,
  getEmployeeStats,
  getEmployeesPage,
  updateEmployee,
  type CreateEmployeeInput,
} from "@/lib/api/employees";
import type { Employee } from "@/lib/types";

const pageSize = 12;

export default function EmployeesPage() {
  const { user } = useAuth();
  const { refresh: refreshDirectory } = useDirectory();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState({ total: 0, available: 0, busy: 0, onLeave: 0 });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive" | "All">("Active");
  const [department, setDepartment] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [assignTarget, setAssignTarget] = useState<Employee | null>(null);
  const { push } = useToast();
  const canManage = user?.role === "MASTER_ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    getEmployeesPage({ page, limit: pageSize, search: search.trim(), status, department })
      .then(({ employees: result, meta: resultMeta }) => {
        if (!active) return;
        setEmployees(result);
        setMeta({ page: resultMeta.page, totalPages: resultMeta.totalPages, total: resultMeta.total });
      })
      .catch((error: unknown) => {
        if (active) push({ kind: "error", title: "Could not load employees", description: error instanceof Error ? error.message : "Please try again." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    getEmployeeStats().then(setStats).catch((error: unknown) => {
      if (active) push({ kind: "error", title: "Could not load employee summary", description: error instanceof Error ? error.message : "Please try again." });
    });

    return () => {
      active = false;
    };
  }, [canManage, page, search, status, department, version, push]);

  function reload() {
    setLoading(true);
    setPage(1);
    setVersion((current) => current + 1);
    refreshDirectory();
  }

  async function saveNewEmployee(data: CreateEmployeeInput) {
    await createEmployee(data);
    setAddOpen(false);
    setPage(1);
    reload();
    push({ kind: "success", title: "Employee added", description: "The employee is now in the directory." });
  }

  async function saveEmployee(employee: Employee, data: CreateEmployeeInput) {
    await updateEmployee(employee.id, data);
    setEditTarget(null);
    reload();
    push({ kind: "success", title: "Employee updated", description: "Changes have been saved." });
  }

  async function toggleStatus(employee: Employee) {
    const active = employee.isActive !== false;
    if (active && !window.confirm(`Deactivate ${employee.name}? Existing lead and work assignments will be preserved.`)) return;
    try {
      if (active) {
        await deactivateEmployee(employee.id);
      } else {
        await updateEmployee(employee.id, { isActive: true });
      }
      reload();
      push({ kind: "success", title: active ? "Employee deactivated" : "Employee activated", description: "Historical assignments remain linked." });
    } catch (error) {
      push({ kind: "error", title: "Could not update employee status", description: error instanceof Error ? error.message : "Please try again." });
    }
  }

  if (!canManage) {
    return (
      <Card>
        <h2 className="text-base font-bold text-neutral-900">Employee directory</h2>
        <p className="mt-2 text-sm text-neutral-500">This directory is available to Admin and Master Admin accounts.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Active Employees" value={stats.total} tone="red" index={0} />
        <StatCard icon={UserCheck} label="Available" value={stats.available} index={1} />
        <StatCard icon={Clock3} label="Busy" value={stats.busy} index={2} />
        <StatCard icon={UserMinus} label="On Leave" value={stats.onLeave} index={3} />
      </div>

      <Card padded={false} className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5 sm:min-w-64">
              <Search className="h-4 w-4 shrink-0 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => {
                  setLoading(true);
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Search name, ID, email or phone..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
              />
            </div>
            <select
              value={department}
              onChange={(event) => {
                setLoading(true);
                setPage(1);
                setDepartment(event.target.value);
              }}
              aria-label="Filter by department"
              className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none focus:border-brand-red"
            >
              <option value="All">All departments</option>
              {["Sales", "Graphic Design", "Production", "Installation", "Accounts", "Administration", "Other"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select
              value={status}
              onChange={(event) => {
                setLoading(true);
                setPage(1);
                setStatus(event.target.value as "Active" | "Inactive" | "All");
              }}
              aria-label="Filter by account status"
              className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none focus:border-brand-red"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="All">All statuses</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-2xl bg-neutral-100" />)}
        </div>
      ) : employees.length === 0 ? (
        <Card className="py-12 text-center">
          <Users className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm font-semibold text-neutral-700">No employees found</p>
          <p className="mt-1 text-xs text-neutral-400">{search ? "Try another search or filter." : "Add an employee to start building the directory."}</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {employees.map((employee, index) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                index={index}
                onAssign={setAssignTarget}
                onEdit={setEditTarget}
                onToggleStatus={toggleStatus}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Showing {employees.length} of {meta.total} employees · Page {meta.page} of {meta.totalPages}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => { setLoading(true); setPage((current) => current - 1); }}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages || loading}
                onClick={() => { setLoading(true); setPage((current) => current + 1); }}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {addOpen && <EmployeeFormModal open onClose={() => setAddOpen(false)} onSave={saveNewEmployee} />}
      {editTarget && (
        <EmployeeFormModal
          key={editTarget.id}
          open
          employee={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(data) => saveEmployee(editTarget, data)}
        />
      )}
      <AssignmentModal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title="Assign New Work"
        description={assignTarget ? `Create work assigned directly to ${assignTarget.name}.` : undefined}
        onAssign={async () => {
          push({ kind: "info", title: "Use Work Management", description: "Create work from the Work Management page and select this employee." });
        }}
      />
    </div>
  );
}
