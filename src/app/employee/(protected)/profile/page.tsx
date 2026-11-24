"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, UserRound } from "lucide-react";
import { getEmployee } from "@/lib/api/employees";
import { http } from "@/lib/http";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format";
import type { EmployeeProfile } from "@/lib/types";

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3.5">
      <p className="text-[11px] font-semibold text-neutral-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-neutral-800">{value || "—"}</p>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!user?.employeeId) return;
    let active = true;
    getEmployee(user.employeeId)
      .then((result) => {
        if (!active) return;
        if (!result) setError("Your employee profile could not be found.");
        else setEmployee(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load your profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.employeeId]);

  async function submitPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("The new password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Use a new password with at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      await http.post("/auth/change-password", { currentPassword, newPassword });
      await logout();
      router.replace("/employee/login?passwordChanged=1");
    } catch (reason) {
      setPasswordError(reason instanceof Error ? reason.message : "Could not change your password.");
      setSaving(false);
    }
  }

  if (!user?.employeeId) {
    return <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No employee profile is linked to this account. Contact your Master Admin.</p>;
  }
  if (loading) return <div className="flex items-center justify-center gap-2 py-24 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…</div>;
  if (error || !employee) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error || "Profile unavailable."}</p>;

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-extrabold text-neutral-900">My Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">Your employee and account information.</p>
      </section>

      <section className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 border-b border-black/5 pb-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white"><UserRound className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-neutral-900">{employee.name}</h2>
            <p className="mt-0.5 text-sm text-neutral-500">{employee.code || "Employee"} · {employee.department || "Department not set"}</p>
          </div>
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${employee.isActive === false ? "bg-neutral-100 text-neutral-600" : "bg-emerald-100 text-emerald-800"}`}>
            {employee.isActive === false ? "Inactive" : "Active"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField label="Employee ID" value={employee.code} />
          <ProfileField label="Department" value={employee.department} />
          <ProfileField label="Designation" value={employee.role} />
          <ProfileField label="Mobile number" value={employee.phone} />
          <ProfileField label="Alternate phone" value={employee.alternatePhone} />
          <ProfileField label="Account email" value={user.email || employee.email} />
          <ProfileField label="Joining date" value={formatDate(employee.joinedAt)} />
          <ProfileField label="Employment type" value={employee.employmentType} />
          <ProfileField label="Employment status" value={employee.isActive === false ? "Inactive" : "Active"} />
          <ProfileField label="City" value={employee.city} />
          <ProfileField label="Address" value={employee.address} />
          <ProfileField label="Reporting manager" value={typeof employee.reportingManager === "string" ? employee.reportingManager : employee.reportingManager?.name} />
        </div>
        <p className="mt-4 text-xs text-neutral-400">For profile information changes, contact your Master Admin.</p>
      </section>

      <section className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-neutral-500" />
          <h2 className="text-base font-bold text-neutral-900">Change password</h2>
        </div>
        <p className="mt-1 text-sm text-neutral-500">Changing your password signs out all active sessions.</p>
        <form onSubmit={submitPasswordChange} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
            Current password
            <input required autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-900 outline-none focus:border-neutral-500" />
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            New password
            <input required minLength={8} autoComplete="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-900 outline-none focus:border-neutral-500" />
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Confirm new password
            <input required minLength={8} autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm font-normal text-neutral-900 outline-none focus:border-neutral-500" />
          </label>
          {passwordError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{passwordError}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Change password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
