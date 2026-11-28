"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { EmployeePortalShell } from "@/components/employee/EmployeePortalShell";

export default function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/employee/login");
    else if (!loading && user?.role !== "EMPLOYEE") router.replace("/master-admin");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "EMPLOYEE") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
        Checking employee access…
      </div>
    );
  }

  return <EmployeePortalShell>{children}</EmployeePortalShell>;
}
