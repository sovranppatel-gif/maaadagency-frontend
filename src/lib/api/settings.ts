import type { AdminUser, AiSettings, WhatsAppApiConfig } from "@/lib/types";
import { http } from "../http";

export async function getWhatsAppConfig(): Promise<WhatsAppApiConfig> {
  return http.get<WhatsAppApiConfig>("/settings/whatsapp");
}

export async function saveWhatsAppConfig(partial: Partial<WhatsAppApiConfig>): Promise<WhatsAppApiConfig> {
  // Access tokens and verify tokens are environment-managed on the backend
  // and never accepted from the client — only the non-secret fields below
  // are persisted. See server/src/controllers/settings.controller.js.
  const { businessAccountId, phoneNumberId, webhookUrl, autoLeadCreationEnabled } = partial;
  return http.patch<WhatsAppApiConfig>("/settings/whatsapp", {
    businessAccountId,
    phoneNumberId,
    webhookUrl,
    autoLeadCreationEnabled,
  });
}

export async function testWhatsAppConnection(to?: string): Promise<{ success: boolean; message: string }> {
  return http.post<{ success: boolean; message: string }>("/settings/whatsapp/test", to ? { to } : undefined);
}

export async function getCurrentAdmin(): Promise<AdminUser> {
  return http.get<AdminUser>("/auth/me");
}

export async function getAiSettings(): Promise<AiSettings> {
  return http.get<AiSettings>("/settings/ai");
}

export async function updateAiSettings(data: Partial<Pick<AiSettings, "enabled" | "confidenceThreshold" | "contextMessages">>): Promise<AiSettings> {
  return http.patch<AiSettings>("/settings/ai", data);
}
