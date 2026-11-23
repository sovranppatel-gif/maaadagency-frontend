import type { AdminUser, WhatsAppApiConfig } from "@/lib/types";

// NOTE: these are placeholder / masked values for UI development only.
// Real credentials must never be hardcoded — at runtime this should be
// replaced by a call to the backend, which reads from environment
// variables: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID,
// WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN.
export const whatsappConfig: WhatsAppApiConfig = {
  businessAccountId: "•••• •••• 4821",
  phoneNumberId: "•••• •••• 1097",
  accessToken: "••••••••••••••••••••••••••••••••",
  webhookVerifyToken: "••••••••••••••",
  webhookUrl: "https://www.maaadagency.com/api/whatsapp/webhook",
  autoLeadCreationEnabled: false,
  connected: true,
};

export const currentAdmin: AdminUser = {
  id: "admin-1",
  name: "Sovran Patel",
  email: "sovranpatel@gmail.com",
  role: "MASTER_ADMIN",
  avatarColor: "#C5161D",
};
