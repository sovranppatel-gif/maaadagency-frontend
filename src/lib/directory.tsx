"use client";

// Small shared cache for entities that many unrelated components need to
// join against by id (assigned employee name in a table row, client in a
// dropdown, service name in a filter). Fetched once when the dashboard
// mounts instead of every component re-fetching the same short list.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Client, Employee, ServiceItem } from "./types";
import { getEmployees } from "./api/employees";
import { getClients } from "./api/clients";
import { getServices } from "./api/services";

interface DirectoryValue {
  employees: Employee[];
  clients: Client[];
  services: ServiceItem[];
  loading: boolean;
  employeeById: (id?: string) => Employee | undefined;
  clientById: (id?: string) => Client | undefined;
  refresh: () => void;
}

const DirectoryContext = createContext<DirectoryValue | null>(null);

export function useDirectory() {
  const ctx = useContext(DirectoryContext);
  if (!ctx) throw new Error("useDirectory must be used within DirectoryProvider");
  return ctx;
}

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getEmployees(), getClients(), getServices()])
      .then(([e, c, s]) => {
        if (cancelled) return;
        setEmployees(e);
        setClients(c);
        setServices(s);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const value = useMemo<DirectoryValue>(
    () => ({
      employees,
      clients,
      services,
      loading,
      employeeById: (id) => employees.find((e) => e.id === id),
      clientById: (id) => clients.find((c) => c.id === id),
      refresh: () => {
        setLoading(true);
        setVersion((v) => v + 1);
      },
    }),
    [employees, clients, services, loading]
  );

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>;
}
