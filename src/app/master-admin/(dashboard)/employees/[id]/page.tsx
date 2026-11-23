"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, CalendarDays, Pencil, UserCheck, UserX, MapPin, BriefcaseBusiness, KeyRound, Copy } from "lucide-react";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { Avatar } from "@/components/master-admin/ui/Avatar";
import { WorkTable } from "@/components/master-admin/WorkTable";
import { EmployeeFormModal } from "@/components/master-admin/EmployeeFormModal";
import {
  getEmployee,
  deactivateEmployee,
  updateEmployee,
  getEmployeeLoginAccess,
  createEmployeeLogin,
  resendEmployeeInvitation,
  initiateEmployeePasswordReset,
  setEmployeeLoginEnabled,
  type CreateEmployeeInput,
  type EmployeeLoginAccess,
  type OneTimeEmployeeLink,
} from "@/lib/api/employees";
import { useAuth } from "@/lib/auth-context";
import { useDirectory } from "@/lib/directory";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { formatDate } from "@/lib/format";
import type { Employee, EmployeeProfile } from "@/lib/types";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { employees, refresh: refreshDirectory } = useDirectory();
  const { push } = useToast();
  const [employee, setEmployee] = useState<EmployeeProfile | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessSnapshot, setAccessSnapshot] = useState<{ employeeId: string; access: EmployeeLoginAccess } | null>(null);
  const [accessError, setAccessError] = useState<{ employeeId: string; message: string } | null>(null);
  const [accessVersion, setAccessVersion] = useState(0);
  const [accessBusy, setAccessBusy] = useState(false);
  const [oneTimeLink, setOneTimeLink] = useState<OneTimeEmployeeLink | null>(null);
  const canManage = user?.role === "MASTER_ADMIN" || user?.role === "ADMIN";
  const canManageAccess = user?.role === "MASTER_ADMIN";

  useEffect(() => {
    let active = true;
    getEmployee(id)
      .then((data) => {
        if (active) setEmployee(data ?? null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        push({ kind: "error", title: "Could not load employee", description: error instanceof Error ? error.message : "Please try again." });
        setEmployee(null);
      });
    return () => {
      active = false;
    };
  }, [id, push]);

  useEffect(() => {
    if (!canManageAccess || !employee?.id) return;
    let active = true;
    getEmployeeLoginAccess(employee.id)
      .then((access) => {
        if (!active) return;
        setAccessSnapshot({ employeeId: employee.id, access });
        setAccessError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Please try again.";
        setAccessError({ employeeId: employee.id, message });
        push({ kind: "error", title: "Could not load employee account access", description: message });
      });
    return () => {
      active = false;
    };
  }, [canManageAccess, employee?.id, accessVersion, push]);

  if (employee === null) notFound();
  if (employee === undefined) return <div className="py-20 text-center text-sm text-neutral-400">Loading employee profile…</div>;

  const isActive = employee.isActive !== false;
  const employeeId = employee.id;
  const employeeName = employee.name;
  const accountAccess = accessSnapshot?.employeeId === employee.id ? accessSnapshot.access : null;
  const accountAccessError = accessError?.employeeId === employee.id ? accessError.message : null;
  const works = employee.works ?? [];
  const leads = employee.leads ?? [];
  const activeWorks = works.filter((work) => work.status === "IN_PROGRESS" || work.status === "ASSIGNED");
  const completedWorks = works.filter((work) => work.status === "COMPLETED" || work.status === "APPROVED");
  const reviewWorks = works.filter((work) => work.status === "SUBMITTED" || work.status === "CHANGES_REQUESTED");
  const managerReference = employee.reportingManager;
  const manager = typeof managerReference === "string"
    ? employees.find((item) => item.id === managerReference)
    : managerReference;
  const managerName = manager?.name ?? (typeof managerReference === "string" ? managerReference : undefined);

  async function saveProfile(data: CreateEmployeeInput) {
    if (!employee) return;
    const updated = await updateEmployee(employee.id, data);
    setEmployee((current) => current ? { ...current, ...updated } : current);
    setEditOpen(false);
    refreshDirectory();
    setAccessVersion((version) => version + 1);
    push({ kind: "success", title: "Employee updated", description: "Profile changes have been saved." });
  }

  async function toggleStatus() {
    if (!employee) return;
    if (isActive && !window.confirm(`Deactivate ${employee.name}? Existing lead and work assignments will be preserved.`)) return;
    setLoading(true);
    try {
      const updated: Employee | undefined = isActive
        ? await deactivateEmployee(employee.id)
        : await updateEmployee(employee.id, { isActive: true });
      if (updated) setEmployee((current) => current ? { ...current, ...updated } : current);
      refreshDirectory();
      setAccessVersion((version) => version + 1);
      push({ kind: "success", title: isActive ? "Employee deactivated" : "Employee activated", description: "Historical assignments remain linked." });
    } catch (error) {
      push({ kind: "error", title: "Could not update employee status", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function createAccessLink(action: (employeeId: string) => Promise<OneTimeEmployeeLink>, successTitle: string) {
    setAccessBusy(true);
    try {
      const result = await action(employeeId);
      setAccessSnapshot({ employeeId, access: result.access });
      setOneTimeLink(result);
      push({ kind: "success", title: successTitle, description: "The private one-time link is shown below." });
    } catch (error) {
      push({ kind: "error", title: "Could not generate access link", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setAccessBusy(false);
    }
  }

  async function toggleLoginAccess() {
    if (!accountAccess) return;
    const enabled = accountAccess.status !== "ACTIVE";
    if (!enabled && !window.confirm(`Disable login access for ${employeeName}? Existing sessions will be revoked.`)) return;
    setAccessBusy(true);
    try {
      const access = await setEmployeeLoginEnabled(employeeId, enabled);
      setAccessSnapshot({ employeeId, access });
      setOneTimeLink(null);
      push({ kind: "success", title: enabled ? "Employee login enabled" : "Employee login disabled" });
    } catch (error) {
      push({ kind: "error", title: "Could not update login access", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setAccessBusy(false);
    }
  }

  async function copySetupLink() {
    if (!oneTimeLink || typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${oneTimeLink.setupPath}`);
      push({ kind: "success", title: "Setup link copied", description: "Share it privately with the employee." });
    } catch (error) {
      push({ kind: "error", title: "Could not copy link", description: error instanceof Error ? error.message : "Select and copy the link manually." });
    }
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center lg:col-span-1">
          <Avatar name={employee.name} color={employee.avatarColor} size="lg" />
          <h2 className="mt-3 text-lg font-extrabold text-neutral-900">{employee.name}</h2>
          <p className="text-xs font-semibold text-neutral-400">{employee.code ?? "Employee ID unavailable"}</p>
          <p className="mt-1 text-sm text-neutral-500">{employee.role}{employee.department ? ` · ${employee.department}` : ""}</p>
          <div className={`mt-2 rounded-full px-2.5 py-1 text-xs font-bold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
            {isActive ? "Active" : "Inactive"}
          </div>
          <div className="mt-5 w-full space-y-3 border-t border-black/6 pt-4 text-left text-sm">
            <p className="flex items-center gap-2 break-all text-neutral-600">
              <Mail className="h-4 w-4 shrink-0 text-neutral-400" /> {employee.email}
            </p>
            <p className="flex items-center gap-2 text-neutral-600">
              <Phone className="h-4 w-4 shrink-0 text-neutral-400" /> {employee.phone}
            </p>
            {employee.alternatePhone && <p className="flex items-center gap-2 text-neutral-600"><Phone className="h-4 w-4 shrink-0 text-neutral-400" /> {employee.alternatePhone} (alternate)</p>}
            <p className="flex items-center gap-2 text-neutral-600">
              <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" /> Joined {formatDate(employee.joinedAt)}
            </p>
            {employee.employmentType && <p className="flex items-center gap-2 text-neutral-600"><BriefcaseBusiness className="h-4 w-4 shrink-0 text-neutral-400" /> {employee.employmentType}</p>}
            {(employee.city || employee.address) && <p className="flex items-start gap-2 text-neutral-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" /> {[employee.address, employee.city].filter(Boolean).join(", ")}</p>}
            {managerName && <p className="flex items-center gap-2 text-neutral-600"><UserCheck className="h-4 w-4 shrink-0 text-neutral-400" /> Reports to {managerName}</p>}
          </div>
          {canManage && (
            <div className="mt-5 flex w-full flex-col gap-2 border-t border-black/6 pt-4 sm:flex-row">
              <button type="button" onClick={() => setEditOpen(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 px-3 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button type="button" onClick={toggleStatus} disabled={loading} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold disabled:opacity-50 ${isActive ? "bg-red-50 text-brand-red hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                {isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          )}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{employee.activeWorks}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Active Work</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{employee.pendingReview}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Pending Review</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{employee.completedWorks}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Completed</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{leads.length}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Assigned Leads</p>
            </Card>
          </div>

          {canManageAccess && (
            <Card>
              <CardHeader title="Account Access" subtitle="Employee credentials are managed separately from the employee profile." />
              {!accountAccess ? (
                accountAccessError ? (
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <p role="alert" className="text-sm text-red-700">Could not load account status: {accountAccessError}</p>
                    <button
                      type="button"
                      onClick={() => setAccessVersion((version) => version + 1)}
                      className="shrink-0 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">Loading account status…</p>
                )
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-800">
                        {accountAccess.status === "NO_LOGIN" && "No Login"}
                        {accountAccess.status === "INVITATION_PENDING" && `Invitation Pending${accountAccess.invitationExpired ? " · Expired" : ""}`}
                        {accountAccess.status === "ACTIVE" && "Active"}
                        {accountAccess.status === "DISABLED" && "Disabled"}
                      </p>
                      <p className="mt-1 break-all text-sm text-neutral-500">Login email: {accountAccess.loginEmail}</p>
                      {accountAccess.lastLoginAt && <p className="mt-1 text-xs text-neutral-400">Last login: {new Date(accountAccess.lastLoginAt).toLocaleString()}</p>}
                    </div>
                    <KeyRound className="h-5 w-5 shrink-0 text-neutral-400" />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {accountAccess.status === "NO_LOGIN" && (
                      <button
                        type="button"
                        disabled={!isActive || accessBusy}
                        onClick={() => createAccessLink(createEmployeeLogin, "Employee login created")}
                        className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Create Login Account
                      </button>
                    )}
                    {accountAccess.status === "INVITATION_PENDING" && (
                      <button
                        type="button"
                        disabled={!isActive || accessBusy}
                        onClick={() => createAccessLink(resendEmployeeInvitation, "Setup invitation renewed")}
                        className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Resend Setup Invitation
                      </button>
                    )}
                    {(accountAccess.status === "ACTIVE" || accountAccess.status === "DISABLED") && (
                      <button
                        type="button"
                        disabled={!isActive || accessBusy}
                        onClick={() => createAccessLink(initiateEmployeePasswordReset, "Password reset initiated")}
                        className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Initiate Password Reset
                      </button>
                    )}
                    {(accountAccess.status === "ACTIVE" || accountAccess.status === "DISABLED") && (
                      <button
                        type="button"
                        disabled={accessBusy || (!isActive && accountAccess.status === "DISABLED")}
                        onClick={toggleLoginAccess}
                        className={`rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50 ${accountAccess.status === "ACTIVE" ? "border border-red-200 text-brand-red hover:bg-red-50" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                      >
                        {accountAccess.status === "ACTIVE" ? "Disable Login" : "Enable Login"}
                      </button>
                    )}
                  </div>
                  {!isActive && <p className="text-xs text-amber-700">Employee profile is inactive. Login cannot be enabled until the profile is reactivated.</p>}

                  {oneTimeLink && (
                    <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                      <p className="text-sm font-bold text-amber-900">Private one-time link</p>
                      <p className="text-xs text-amber-900">{oneTimeLink.warning} Expires {new Date(oneTimeLink.expiresAt).toLocaleString()}.</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          readOnly
                          aria-label="One-time account setup link"
                          value={typeof window === "undefined" ? oneTimeLink.setupPath : `${window.location.origin}${oneTimeLink.setupPath}`}
                          onFocus={(event) => event.currentTarget.select()}
                          className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-neutral-700"
                        />
                        <button type="button" onClick={copySetupLink} className="flex items-center justify-center gap-2 rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white">
                          <Copy className="h-3.5 w-3.5" /> Copy link
                        </button>
                        <button type="button" onClick={() => setOneTimeLink(null)} aria-label="Dismiss setup link" className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-neutral-400">No email delivery is configured; share setup/reset links privately. Passwords and stored tokens are never displayed.</p>
                </div>
              )}
            </Card>
          )}

          <Card>
            <CardHeader title="Workload Summary" subtitle="Assignment history and current work status" />
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-red-50 p-3"><p className="text-xl font-bold text-brand-red">{activeWorks.length}</p><p className="text-xs text-neutral-500">Active</p></div>
              <div className="rounded-xl bg-amber-50 p-3"><p className="text-xl font-bold text-amber-700">{reviewWorks.length}</p><p className="text-xs text-neutral-500">In Review</p></div>
              <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xl font-bold text-emerald-700">{completedWorks.length}</p><p className="text-xs text-neutral-500">Completed</p></div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Assigned Leads" subtitle="Leads currently linked to this employee" />
            {leads.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">No leads assigned.</p>
            ) : (
              <div className="divide-y divide-black/5">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-800">{lead.clientName} <span className="text-xs font-normal text-neutral-400">{lead.code}</span></p>
                      <p className="truncate text-xs text-neutral-500">{lead.service} · {lead.requirement}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-neutral-500">{lead.status}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Assigned Work" />
            {works.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-400">No work assigned to this employee yet.</p>
            ) : (
              <WorkTable works={works} />
            )}
          </Card>
        </div>
      </div>

      {editOpen && (
        <EmployeeFormModal
          key={employee.id}
          open
          employee={employee}
          onClose={() => setEditOpen(false)}
          onSave={saveProfile}
        />
      )}
    </div>
  );
}
