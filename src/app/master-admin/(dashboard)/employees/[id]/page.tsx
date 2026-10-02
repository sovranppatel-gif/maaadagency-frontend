"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, CalendarDays } from "lucide-react";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { Avatar } from "@/components/master-admin/ui/Avatar";
import { StatusBadge } from "@/components/master-admin/ui/StatusBadge";
import { WorkTable } from "@/components/master-admin/WorkTable";
import { DonutChart } from "@/components/master-admin/charts/DonutChart";
import { getEmployee } from "@/lib/api/employees";
import { getWorks } from "@/lib/api/works";
import { formatDate } from "@/lib/format";
import type { Employee, Work } from "@/lib/types";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null | undefined>(undefined);
  const [employeeWorks, setEmployeeWorks] = useState<Work[]>([]);

  useEffect(() => {
    getEmployee(id).then((data) => setEmployee(data ?? null));
    getWorks({ employeeId: id }).then(setEmployeeWorks);
  }, [id]);

  if (employee === null) notFound();
  if (employee === undefined) return <div className="py-20 text-center text-sm text-neutral-400">Loading…</div>;

  const active = employeeWorks.filter((w) => w.status === "IN_PROGRESS" || w.status === "ASSIGNED");
  const completed = employeeWorks.filter((w) => w.status === "COMPLETED");
  const review = employeeWorks.filter((w) => w.status === "SUBMITTED" || w.status === "CHANGES_REQUESTED");

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
          <p className="text-sm text-neutral-500">{employee.role}</p>
          <div className="mt-2">
            <StatusBadge status={employee.availability} />
          </div>
          <div className="mt-5 w-full space-y-2 border-t border-black/6 pt-4 text-left text-sm">
            <p className="flex items-center gap-2 text-neutral-600">
              <Mail className="h-4 w-4 text-neutral-400" /> {employee.email}
            </p>
            <p className="flex items-center gap-2 text-neutral-600">
              <Phone className="h-4 w-4 text-neutral-400" /> {employee.phone}
            </p>
            <p className="flex items-center gap-2 text-neutral-600">
              <CalendarDays className="h-4 w-4 text-neutral-400" /> Joined {formatDate(employee.joinedAt)}
            </p>
          </div>
          <div className="mt-4 flex w-full flex-wrap gap-1.5">
            {employee.skills.map((s) => (
              <span key={s} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                {s}
              </span>
            ))}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{employee.activeWorks}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Active Work</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{employee.completedWorks}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Completed</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-neutral-900">{employee.pendingReview}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">Pending Review</p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Work Distribution" subtitle="Current workload snapshot" />
            <DonutChart
              data={[
                { label: "Active", value: active.length || 1, color: "#C5161D" },
                { label: "In Review", value: review.length, color: "#f59e0b" },
                { label: "Completed", value: completed.length, color: "#10b981" },
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Assigned Tasks" />
            {employeeWorks.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-400">No work assigned to this employee yet.</p>
            ) : (
              <WorkTable works={employeeWorks} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
