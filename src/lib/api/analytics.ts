import { http } from "../http";

export interface DashboardSummary {
  totalLeads: number;
  newLeads: number;
  activeWork: number;
  pendingReview: number;
  completed: number;
  employees: number;
  whatsappChats: number;
  messagesToday: number;
  unreadMessages: number;
  leadsByStatus: Record<string, number>;
  worksByStatus: Record<string, number>;
}

export interface ChartDatum {
  label: string;
  value: number;
}

export interface AnalyticsData {
  leadsByService: ChartDatum[];
  leadsBySource: ChartDatum[];
  workByStatus: ChartDatum[];
  employeePerformance: ChartDatum[];
  monthlyLeads: ChartDatum[];
  monthlyCompleted: ChartDatum[];
  totals: {
    totalLeads: number;
    totalClients: number;
    conversionRate: number;
    avgCompletionDays: number;
  };
}

export interface WeeklyWhatsAppDatum extends ChartDatum {
  inbound: number;
  outbound: number;
}

export const getDashboardSummary = () => http.get<DashboardSummary>("/analytics/dashboard");
export const getAnalytics = () => http.get<AnalyticsData>("/analytics");
export const getWhatsAppWeeklyAnalytics = () => http.get<WeeklyWhatsAppDatum[]>("/analytics/whatsapp");
