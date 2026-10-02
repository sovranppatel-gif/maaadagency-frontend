import type { AppNotification } from "@/lib/types";

export const notifications: AppNotification[] = [
  { id: "n1", title: "New WhatsApp lead received", description: "ABC Agency asked about UI/UX Design for an e-commerce homepage.", category: "WhatsApp", read: false, timestamp: "2026-09-14T10:42:00", href: "/master-admin/leads/LD-1042" },
  { id: "n2", title: "Rahul submitted work", description: "Navratri collection landing page — first draft ready for review.", category: "Work", read: false, timestamp: "2026-09-14T09:40:00", href: "/master-admin/work/WK-2191" },
  { id: "n3", title: "Revision requested", description: "Kapoor Builders asked for a color change on the hoarding creative.", category: "Work", read: false, timestamp: "2026-09-12T10:00:00", href: "/master-admin/work/WK-2200" },
  { id: "n4", title: "Deadline approaching", description: "Malhotra Motors — Diwali Campaign is due in 2 days.", category: "System", read: false, timestamp: "2026-09-13T09:00:00", href: "/master-admin/work" },
  { id: "n5", title: "New client message", description: "Bansal Jewellers: \"When can we expect the first draft?\"", category: "WhatsApp", read: true, timestamp: "2026-09-14T08:05:00", href: "/master-admin/whatsapp" },
  { id: "n6", title: "Employee completed task", description: "Ankita Rao marked Health Camp Pamphlets as completed.", category: "Work", read: true, timestamp: "2026-09-08T09:00:00", href: "/master-admin/work/WK-2192" },
  { id: "n7", title: "New WhatsApp lead received", description: "XYZ Pvt Ltd is interested in a 5-page corporate website.", category: "WhatsApp", read: true, timestamp: "2026-09-14T08:40:00", href: "/master-admin/leads/LD-1041" },
  { id: "n8", title: "Work approved", description: "Instagram Growth Campaign for ABC Agency was approved.", category: "Work", read: true, timestamp: "2026-09-11T09:00:00", href: "/master-admin/work/WK-2195" },
  { id: "n9", title: "System backup completed", description: "Nightly database backup finished successfully.", category: "System", read: true, timestamp: "2026-09-14T02:00:00" },
  { id: "n10", title: "New employee onboarded", description: "Manoj Tiwari joined as Backend Developer.", category: "System", read: true, timestamp: "2026-09-01T09:00:00" },
];
