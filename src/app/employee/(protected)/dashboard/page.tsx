"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Inbox, Bell, PhoneCall, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getEmployee } from "@/lib/api/employees";
import type { EmployeeProfile } from "@/lib/types";

const placeholders = [
  { title: "My Leads", description: "Lead workspace is planned for Phase 3.", icon: Inbox },
  { title: "My Follow-ups", description: "Follow-up tools are planned for Phase 3.", icon: PhoneCall },
  { title: "My Tasks", description: "Task workspace is planned for Phase 3.", icon: ClipboardList },
  { title: "Notifications", description: "Employee notifications are planned for Phase 3.", icon: Bell },
];

export default function EmployeeDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user?.employeeId) return;
    let active = true;
    getEmployee(user.employeeId)
      .then((profile) => {
        if (!active) return;
        if (!profile) setLoadError("Employee profile not found. Contact your Master Admin.");
        else setEmployee(profile);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load employee profile.");
      });
    return () => {
      active = false;
    };
  }, [user?.employeeId]);

  const profileError = user?.employeeId
    ? loadError
    : "No employee profile is linked to this account. Contact your Master Admin.";

  async function handleLogout() {
    await logout();
    router.replace("/employee/login");
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">MAAAD Agency</p>
            <h1 className="text-lg font-extrabold text-neutral-900">Employee Portal</h1>
          </div>
          <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section className="rounded-2xl bg-neutral-900 p-6 text-white sm:p-8">
          <p className="text-sm text-neutral-300">Welcome back{employee?.name ? `, ${employee.name}` : ""}.</p>
          <h2 className="mt-1 text-2xl font-extrabold">Your workspace is ready</h2>
          {profileError ? (
            <p role="alert" className="mt-3 text-sm text-amber-200">{profileError}</p>
          ) : employee ? (
            <p className="mt-3 text-sm text-neutral-300">
              {employee.code ?? "Employee ID"}{employee.department ? ` · ${employee.department}` : ""} · {employee.role}
            </p>
          ) : (
            <p className="mt-3 text-sm text-neutral-400">Loading your employee profile…</p>
          )}
        </section>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {placeholders.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-sm font-bold text-neutral-900">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
              <span className="mt-4 inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500">Coming in Phase 3</span>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
