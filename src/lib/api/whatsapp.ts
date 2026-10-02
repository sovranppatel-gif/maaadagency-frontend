import type { BotStep, ConversationFilter, Faq, WhatsAppConversation, WhatsAppMessage } from "@/lib/types";
import { http, toQueryString, ApiError } from "../http";

export async function getConversations(filter: ConversationFilter = "All", search = ""): Promise<WhatsAppConversation[]> {
  const qs = toQueryString({ filter, search, limit: 100 });
  return http.get<WhatsAppConversation[]>(`/whatsapp/conversations${qs}`);
}

export async function getConversation(id: string): Promise<WhatsAppConversation | undefined> {
  try {
    return await http.get<WhatsAppConversation>(`/whatsapp/conversations/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function getMessages(conversationId: string): Promise<WhatsAppMessage[]> {
  return http.get<WhatsAppMessage[]>(`/whatsapp/conversations/${conversationId}/messages?limit=100`);
}

export async function sendMessage(conversationId: string, text: string): Promise<WhatsAppMessage> {
  return http.post<WhatsAppMessage>("/whatsapp/send", { conversationId, message: text });
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await http.post(`/whatsapp/conversations/${conversationId}/read`);
}

export interface WhatsAppStatus {
  connected: boolean;
  dryRun: boolean;
  apiVersion: string;
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  return http.get<WhatsAppStatus>("/whatsapp/status");
}

/* ── Bot flow ─────────────────────────────────────────────────────────── */

export async function getBotSteps(): Promise<BotStep[]> {
  return http.get<BotStep[]>("/whatsapp/bot-flow");
}

export async function createBotStep(data: Partial<BotStep>): Promise<BotStep> {
  return http.post<BotStep>("/whatsapp/bot-flow", data);
}

export async function updateBotStep(id: string, data: Partial<BotStep>): Promise<BotStep> {
  return http.patch<BotStep>(`/whatsapp/bot-flow/${id}`, data);
}

export async function deleteBotStep(id: string): Promise<boolean> {
  const res = await http.del<{ deleted: boolean }>(`/whatsapp/bot-flow/${id}`);
  return Boolean(res?.deleted);
}

export async function reorderBotSteps(ids: string[]): Promise<BotStep[]> {
  return http.patch<BotStep[]>("/whatsapp/bot-flow/reorder", { ids });
}

/* ── FAQs (answers the smart bot may send) ────────────────────────────── */

export async function getFaqs(): Promise<Faq[]> {
  return http.get<Faq[]>("/whatsapp/faqs");
}

export async function createFaq(data: Partial<Faq>): Promise<Faq> {
  return http.post<Faq>("/whatsapp/faqs", data);
}

export async function updateFaq(id: string, data: Partial<Faq>): Promise<Faq> {
  return http.put<Faq>(`/whatsapp/faqs/${id}`, data);
}

export async function deleteFaq(id: string): Promise<boolean> {
  const res = await http.del<{ deleted: boolean }>(`/whatsapp/faqs/${id}`);
  return Boolean(res?.deleted);
}
