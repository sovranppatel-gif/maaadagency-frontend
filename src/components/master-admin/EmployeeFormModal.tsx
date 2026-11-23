"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useDirectory } from "@/lib/directory";
import { useToast } from "./ui/ToastProvider";
import { Modal } from "./ui/Modal";
import type { CreateEmployeeInput } from "@/lib/api/employees";
import type { Employee, EmployeeDepartment, EmploymentType } from "@/lib/types";

const departments: EmployeeDepartment[] = [
  "Sales",
  "Graphic Design",
  "Production",
  "Installation",
  "Accounts",
  "Administration",
  "Other",
];
const employmentTypes: EmploymentType[] = ["Full Time", "Part Time", "Contract", "Intern"];

function dateInput(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function managerId(employee?: Employee) {
  const manager = employee?.reportingManager;
  if (typeof manager === "string") return manager;
  return manager?.id ?? "";
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500";

export function EmployeeFormModal({
  open,
  employee,
  onClose,
  onSave,
}: {
  open: boolean;
  employee?: Employee;
  onClose: () => void;
  onSave: (data: CreateEmployeeInput) => Promise<void>;
}) {
  const { employees } = useDirectory();
  const { push } = useToast();
  const [values, setValues] = useState<CreateEmployeeInput>(() => ({
    name: employee?.name ?? "",
    role: employee?.role ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    alternatePhone: employee?.alternatePhone ?? "",
    department: employee?.department,
    employmentType: employee?.employmentType,
    address: employee?.address ?? "",
    city: employee?.city ?? "",
    reportingManager: managerId(employee),
    joinedAt: dateInput(employee?.joinedAt),
    isActive: employee?.isActive !== false,
  }));
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof CreateEmployeeInput>(key: K, value: CreateEmployeeInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave({
        ...values,
        name: values.name.trim(),
        role: values.role.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        alternatePhone: values.alternatePhone?.trim() || undefined,
        address: values.address?.trim() || undefined,
        city: values.city?.trim() || undefined,
        reportingManager: values.reportingManager || undefined,
        joinedAt: values.joinedAt || undefined,
      });
    } catch (error) {
      push({
        kind: "error",
        title: `Could not ${employee ? "update" : "create"} employee`,
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? "Edit Employee" : "Add Employee"}
      description="Add the employee's contact and job details. Email is required by the existing employee record."
      size="lg"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="employee-name">Full name *</label>
            <input id="employee-name" required minLength={2} maxLength={160} value={values.name} onChange={(e) => update("name", e.target.value)} className={inputClass} autoComplete="name" />
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-phone">Mobile number *</label>
            <input id="employee-phone" type="tel" required minLength={6} maxLength={30} value={values.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} autoComplete="tel" />
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-email">Email address *</label>
            <input id="employee-email" type="email" required maxLength={254} value={values.email} onChange={(e) => update("email", e.target.value)} className={inputClass} autoComplete="email" />
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-alternate-phone">Alternate phone</label>
            <input id="employee-alternate-phone" type="tel" maxLength={30} value={values.alternatePhone} onChange={(e) => update("alternatePhone", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-department">Department</label>
            <select id="employee-department" value={values.department ?? ""} onChange={(e) => update("department", (e.target.value || undefined) as EmployeeDepartment | undefined)} className={inputClass}>
              <option value="">Select department</option>
              {departments.map((department) => <option key={department}>{department}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-designation">Designation *</label>
            <input id="employee-designation" required minLength={2} maxLength={120} value={values.role} onChange={(e) => update("role", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-joined-at">Joining date</label>
            <input id="employee-joined-at" type="date" value={values.joinedAt} onChange={(e) => update("joinedAt", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-employment-type">Employment type</label>
            <select id="employee-employment-type" value={values.employmentType ?? ""} onChange={(e) => update("employmentType", (e.target.value || undefined) as EmploymentType | undefined)} className={inputClass}>
              <option value="">Select type</option>
              {employmentTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-manager">Reporting manager</label>
            <select id="employee-manager" value={values.reportingManager} onChange={(e) => update("reportingManager", e.target.value)} className={inputClass}>
              <option value="">No manager</option>
              {employees.filter((item) => item.id !== employee?.id).map((manager) => (
                <option key={manager.id} value={manager.id}>{manager.name}{manager.code ? ` (${manager.code})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-status">Account status</label>
            <select id="employee-status" value={values.isActive === false ? "Inactive" : "Active"} onChange={(e) => update("isActive", e.target.value === "Active")} className={inputClass}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="employee-city">City</label>
            <input id="employee-city" maxLength={120} value={values.city} onChange={(e) => update("city", e.target.value)} className={inputClass} autoComplete="address-level2" />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="employee-address">Address</label>
          <textarea id="employee-address" rows={2} maxLength={300} value={values.address} onChange={(e) => update("address", e.target.value)} className={`${inputClass} resize-y`} autoComplete="street-address" />
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-black/6 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="flex items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {employee ? "Save Changes" : "Add Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
