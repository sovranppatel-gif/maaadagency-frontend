"use client";

import Link from "next/link";
import { Mail, Phone, UserPlus, Pencil, UserX } from "lucide-react";
import type { Employee } from "@/lib/types";
import { Avatar } from "./ui/Avatar";
import { StatusBadge } from "./ui/StatusBadge";
import { RowMenu } from "./ui/RowMenu";

export function EmployeeCard({ employee, onAssign, index = 0 }: { employee: Employee; onAssign?: (e: Employee) => void; index?: number }) {
  return (
    <div
      className="group rounded-2xl border border-black/6 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} color={employee.avatarColor} size="lg" />
          <div>
            <Link href={`/master-admin/employees/${employee.id}`} className="text-sm font-bold text-neutral-900 hover:text-brand-red">
              {employee.name}
            </Link>
            <p className="text-xs text-neutral-500">{employee.role}</p>
            <div className="mt-1.5">
              <StatusBadge status={employee.availability} />
            </div>
          </div>
        </div>
        <RowMenu
          actions={[
            { label: "Assign Work", icon: UserPlus, onClick: () => onAssign?.(employee) },
            { label: "Edit Profile", icon: Pencil, onClick: () => {} },
            { label: "Deactivate", icon: UserX, destructive: true, onClick: () => {} },
          ]}
        />
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-neutral-500">
        <p className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" /> {employee.email}
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5" /> {employee.phone}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-black/6 pt-3 text-center">
        <div>
          <p className="text-base font-extrabold text-neutral-900">{employee.activeWorks}</p>
          <p className="text-[10px] font-semibold uppercase text-neutral-400">Active</p>
        </div>
        <div>
          <p className="text-base font-extrabold text-neutral-900">{employee.completedWorks}</p>
          <p className="text-[10px] font-semibold uppercase text-neutral-400">Done</p>
        </div>
        <div>
          <p className="text-base font-extrabold text-neutral-900">{employee.pendingReview}</p>
          <p className="text-[10px] font-semibold uppercase text-neutral-400">Review</p>
        </div>
      </div>
    </div>
  );
}
