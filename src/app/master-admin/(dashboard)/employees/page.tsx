"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Clock3, UserMinus, Search } from "lucide-react";
import { StatCard } from "@/components/master-admin/StatCard";
import { EmployeeCard } from "@/components/master-admin/EmployeeCard";
import { AssignmentModal } from "@/components/master-admin/AssignmentModal";
import { Card } from "@/components/master-admin/ui/Card";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { getEmployees } from "@/lib/api/employees";
import type { Employee } from "@/lib/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] = useState<Employee | null>(null);
  const { push } = useToast();

  useEffect(() => {
    getEmployees().then(setEmployees);
  }, []);

  const filtered = employees.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())
  );

  const available = employees.filter((e) => e.availability === "Available").length;
  const busy = employees.filter((e) => e.availability === "Busy").length;
  const onLeave = employees.filter((e) => e.availability === "On Leave").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Total Employees" value={employees.length} tone="red" index={0} />
        <StatCard icon={UserCheck} label="Available" value={available} index={1} />
        <StatCard icon={Clock3} label="Busy" value={busy} index={2} />
        <StatCard icon={UserMinus} label="On Leave" value={onLeave} index={3} />
      </div>

      <Card padded={false} className="p-4 sm:p-5">
        <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2.5 sm:max-w-sm">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((emp, i) => (
          <EmployeeCard key={emp.id} employee={emp} index={i} onAssign={setAssignTarget} />
        ))}
      </div>

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
