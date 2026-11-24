// Centralized type definitions for the Master Admin dashboard.
// Mirrors the shape future MongoDB documents / API responses should take,
// so swapping the mock data layer (lib/mock-data, lib/api) for real HTTP
// calls requires no changes to components or pages.

export type Role = "MASTER_ADMIN" | "ADMIN" | "EMPLOYEE";

export type LeadSource = "WhatsApp" | "Website" | "Manual" | "Referral" | "Phone Call" | "Office Walk-in" | "Other";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type LeadStatus =
  | "New"
  | "Assigned"
  | "In Progress"
  | "Submitted"
  | "Changes Requested"
  | "Approved"
  | "Completed";

export type WorkStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "COMPLETED";

export type Availability = "Available" | "Busy" | "On Leave";
export type EmployeeDepartment =
  | "Sales"
  | "Graphic Design"
  | "Production"
  | "Installation"
  | "Accounts"
  | "Administration"
  | "Other";
export type EmploymentType = "Full Time" | "Part Time" | "Contract" | "Intern";

export type ProjectStatus = "Planning" | "Active" | "Review" | "Completed" | "On Hold";

export type MessageDirection = "inbound" | "outbound";

export type MessageType = "text" | "image" | "document" | "audio" | "template";

export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export interface Attachment {
  id: string;
  name: string;
  url?: string;
  type: "image" | "pdf" | "doc" | "zip" | "other";
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ActivityItem {
  id: string;
  label: string;
  description?: string;
  actor?: string;
  timestamp: string;
  icon?: string;
}

export interface Lead {
  id: string;
  code?: string;
  clientId: string;
  clientName: string;
  contactPersonName?: string;
  phone: string;
  alternatePhone?: string;
  company?: string;
  email?: string;
  service: string;
  requirement: string;
  description: string;
  quantitySizeDimensions?: string;
  internalRemarks?: string;
  referenceWebsite?: string;
  deadline?: string;
  enquiryDate?: string;
  budget?: string;
  source: LeadSource;
  priority: Priority;
  status: LeadStatus;
  assignedEmployeeId?: string;
  assignedDate?: string;
  followUpLimit?: number;
  followUpReviewRequired?: boolean;
  followUpsClosed?: boolean;
  attachments: Attachment[];
  activity: ActivityItem[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeReport {
  summary: string;
  files: Attachment[];
  screenshots: Attachment[];
  remarks: string;
  timeSpent: string;
  submittedAt: string;
}

export interface RevisionRequest {
  id: string;
  notes: string;
  priority: Priority;
  deadline?: string;
  requestedAt: string;
}

export interface Work {
  id: string;
  code?: string;
  leadId?: string;
  clientId: string;
  clientName: string;
  project?: { id: string; name: string; code?: string };
  employeeId?: string;
  title: string;
  description: string;
  service: string;
  priority: Priority;
  deadline: string;
  status: WorkStatus;
  progress: number;
  progressNote?: string;
  blockedReason?: string;
  attachments: Attachment[];
  employeeReport?: EmployeeReport;
  revisionHistory: RevisionRequest[];
  activity: ActivityItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  code?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  department?: EmployeeDepartment;
  employmentType?: EmploymentType;
  address?: string;
  city?: string;
  reportingManager?: string | { id: string; name: string; code?: string };
  isActive?: boolean;
  avatarColor: string;
  availability: Availability;
  activeWorks: number;
  completedWorks: number;
  pendingReview: number;
  skills: string[];
  joinedAt: string;
}

export interface EmployeeLeadSummary {
  id: string;
  code?: string;
  clientName: string;
  service: string;
  requirement: string;
  status: LeadStatus;
  priority: Priority;
  updatedAt: string;
}

export interface EmployeeProfile extends Employee {
  works?: Work[];
  leads?: EmployeeLeadSummary[];
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  avatarColor: string;
  totalLeads: number;
  activeProjects: number;
  completedProjects: number;
  lastContact: string;
  createdAt: string;
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  message: string;
  messageType: MessageType;
  mediaUrl?: string;
  mediaName?: string;
  timestamp: string;
  status: MessageStatus;
}

export type ConversationFilter = "All" | "Unread" | "New Leads" | "Assigned" | "Active" | "Completed";

export interface WhatsAppConversation {
  id: string;
  clientId: string;
  clientName: string;
  phone: string;
  avatarColor: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: ConversationFilter;
  online: boolean;
  lastSeen: string;
  assignedEmployeeId?: string;
  leadId?: string;
  /** Customer asked for a person; the bot is paused for this thread. */
  humanHandoff?: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
  assigneeId?: string;
}

export interface ProjectComment {
  id: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  services: string[];
  teamIds: string[];
  progress: number;
  deadline: string;
  status: ProjectStatus;
  tasks: ProjectTask[];
  files: Attachment[];
  comments: ProjectComment[];
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "Active" | "Disabled";
  leadsCount: number;
}

export type NotificationCategory = "Work" | "WhatsApp" | "System";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  read: boolean;
  timestamp: string;
  href?: string;
}

export interface BotOption {
  id: string;
  label: string;
}

export interface BotStep {
  id: string;
  order: number;
  title: string;
  message: string;
  options?: BotOption[];
  collectsField?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  active: boolean;
  order: number;
}

export interface AiSettings {
  envEnabled: boolean;
  enabled: boolean;
  confidenceThreshold: number;
  contextMessages: number;
  provider: string;
  providerSupported: boolean;
  model: string;
  apiKeyConfigured: boolean;
}

export interface WhatsAppApiConfig {
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
  webhookUrl: string;
  autoLeadCreationEnabled: boolean;
  connected: boolean;
}

export type FileCategory = "Client Files" | "Employee Reports" | "Project Files" | "Screenshots" | "Designs" | "Documents";

export interface FileRecord {
  id: string;
  name: string;
  type: "image" | "pdf" | "doc" | "zip" | "other";
  category: FileCategory;
  clientName?: string;
  projectName?: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  employeeId?: string;
}
