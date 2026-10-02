import {
  LayoutDashboard,
  Inbox,
  ClipboardList,
  MessageCircle,
  Users,
  Building2,
  FolderKanban,
  Layers,
  FileText,
  Bell,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export type AdminNavGroup = "Overview" | "Pipeline" | "Directory" | "Workspace";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: AdminNavGroup;
  /** Omitted = visible to every signed-in role. */
  roles?: Role[];
  /** Extra search terms for the command palette. */
  keywords?: string;
}

export const adminNavGroups: AdminNavGroup[] = ["Overview", "Pipeline", "Directory", "Workspace"];

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/master-admin", icon: LayoutDashboard, group: "Overview", keywords: "home overview kpi" },
  { label: "Analytics", href: "/master-admin/analytics", icon: BarChart3, group: "Overview", roles: ["MASTER_ADMIN", "ADMIN"], keywords: "reports charts stats" },
  { label: "Leads", href: "/master-admin/leads", icon: Inbox, group: "Pipeline", keywords: "enquiries requirements" },
  { label: "WhatsApp Inbox", href: "/master-admin/whatsapp", icon: MessageCircle, group: "Pipeline", keywords: "chat messages bot faq" },
  { label: "Work Management", href: "/master-admin/work", icon: ClipboardList, group: "Pipeline", keywords: "tasks assignments" },
  { label: "Clients", href: "/master-admin/clients", icon: Building2, group: "Directory", keywords: "customers companies" },
  { label: "Projects", href: "/master-admin/projects", icon: FolderKanban, group: "Directory" },
  { label: "Employees", href: "/master-admin/employees", icon: Users, group: "Directory", keywords: "team staff" },
  { label: "Services", href: "/master-admin/services", icon: Layers, group: "Directory" },
  { label: "Files & Reports", href: "/master-admin/files", icon: FileText, group: "Workspace", keywords: "uploads documents" },
  { label: "Notifications", href: "/master-admin/notifications", icon: Bell, group: "Workspace", keywords: "alerts" },
  { label: "Settings", href: "/master-admin/settings", icon: Settings, group: "Workspace", roles: ["MASTER_ADMIN"], keywords: "config whatsapp ai" },
];

/** Main sections pinned to the mobile bottom tab bar (plus a "Menu" tab). */
export const mobileTabHrefs = ["/master-admin", "/master-admin/leads", "/master-admin/whatsapp", "/master-admin/work"];

export function navItemsForRole(role?: Role): AdminNavItem[] {
  return adminNavItems.filter((item) => !item.roles || !role || item.roles.includes(role));
}

export function isNavActive(item: AdminNavItem, pathname: string): boolean {
  return item.href === "/master-admin" ? pathname === item.href : pathname.startsWith(item.href);
}

export function getPageTitle(pathname: string): string {
  if (pathname === "/master-admin") return "Dashboard";
  if (pathname.includes("/leads/")) return "Lead Details";
  if (pathname.includes("/work/")) return "Work Details";
  if (pathname.includes("/employees/")) return "Employee Profile";
  if (pathname.includes("/clients/")) return "Client Profile";
  if (pathname.includes("/projects/")) return "Project Details";
  const match = adminNavItems.find((i) => i.href !== "/master-admin" && pathname.startsWith(i.href));
  if (match) return match.label;
  return "Master Admin";
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

/** Admin › Section › Detail. The last crumb has no href (current page). */
export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ label: "Admin", href: "/master-admin" }];
  if (pathname === "/master-admin") return [...crumbs, { label: "Dashboard" }];

  const section = adminNavItems.find((i) => i.href !== "/master-admin" && pathname.startsWith(i.href));
  if (!section) return [...crumbs, { label: getPageTitle(pathname) }];

  if (pathname === section.href) return [...crumbs, { label: section.label }];
  return [...crumbs, { label: section.label, href: section.href }, { label: getPageTitle(pathname) }];
}
