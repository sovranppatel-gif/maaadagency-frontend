"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  MessageCircle,
  Bell,
  Users,
  Inbox,
  ClipboardList,
  Layers,
  ShieldCheck,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Loader2,
  Check,
} from "lucide-react";
import { Card, CardHeader } from "@/components/master-admin/ui/Card";
import { useToast } from "@/components/master-admin/ui/ToastProvider";
import { getWhatsAppConfig, saveWhatsAppConfig, testWhatsAppConnection } from "@/lib/api/settings";
import type { WhatsAppApiConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

const sections = [
  { id: "general", label: "General Settings", icon: SlidersHorizontal },
  { id: "whatsapp", label: "WhatsApp API", icon: MessageCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "employees", label: "Employees", icon: Users },
  { id: "leads", label: "Lead Settings", icon: Inbox },
  { id: "work", label: "Work Status", icon: ClipboardList },
  { id: "services", label: "Services", icon: Layers },
  { id: "security", label: "Security", icon: ShieldCheck },
];

function MaskedField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 pr-10 text-sm text-neutral-800 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          aria-label={visible ? "Hide value" : "Show value"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function WhatsAppSettings() {
  const [config, setConfig] = useState<WhatsAppApiConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    getWhatsAppConfig().then(setConfig);
  }, []);

  if (!config) return <div className="py-10 text-center text-sm text-neutral-400">Loading configuration…</div>;

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await saveWhatsAppConfig(config);
    setSaving(false);
    push({ kind: "success", title: "Configuration saved", description: "WhatsApp API settings updated." });
  }

  async function handleTest() {
    setTesting(true);
    const res = await testWhatsAppConnection();
    setTesting(false);
    push({ kind: res.success ? "success" : "error", title: res.success ? "Connection successful" : "Connection failed", description: res.message });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/6 bg-neutral-50 p-4">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", config.connected ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-brand-red")}>
            {config.connected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-bold text-neutral-900">Connection Status</p>
            <p className={cn("text-xs font-semibold", config.connected ? "text-emerald-600" : "text-brand-red")}>
              {config.connected ? "Connected" : "Disconnected"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-white disabled:opacity-60"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Test Connection
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Credentials shown here are masked placeholders for UI development. Real credentials are never hardcoded —
        production values are read from environment variables (<code className="font-mono">WHATSAPP_PHONE_NUMBER_ID</code>,{" "}
        <code className="font-mono">WHATSAPP_BUSINESS_ACCOUNT_ID</code>, <code className="font-mono">WHATSAPP_ACCESS_TOKEN</code>,{" "}
        <code className="font-mono">WHATSAPP_VERIFY_TOKEN</code>) on the backend.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MaskedField label="WhatsApp Business Account ID" value={config.businessAccountId} onChange={(v) => setConfig({ ...config, businessAccountId: v })} />
        <MaskedField label="Phone Number ID" value={config.phoneNumberId} onChange={(v) => setConfig({ ...config, phoneNumberId: v })} />
        <MaskedField label="Access Token" value={config.accessToken} onChange={(v) => setConfig({ ...config, accessToken: v })} />
        <MaskedField label="Webhook Verify Token" value={config.webhookVerifyToken} onChange={(v) => setConfig({ ...config, webhookVerifyToken: v })} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">Webhook URL</label>
        <input
          readOnly
          value={config.webhookUrl}
          className="w-full rounded-xl border border-black/10 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-500 outline-none"
        />
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" /> Webhook verified and reachable
        </p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Configuration
      </button>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  const { push } = useToast();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/10 py-16 text-center">
      <p className="text-sm font-semibold text-neutral-500">{label} configuration</p>
      <p className="max-w-xs text-xs text-neutral-400">This section is ready to be wired up once the backend is connected.</p>
      <button
        type="button"
        onClick={() => push({ kind: "info", title: `${label} settings`, description: "Coming soon." })}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
      >
        Configure
      </button>
    </div>
  );
}

function SettingsInner() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState(searchParams.get("tab") || "general");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors",
              active === s.id ? "bg-brand-red text-white" : "text-neutral-500 hover:bg-neutral-100"
            )}
          >
            <s.icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{s.label}</span>
          </button>
        ))}
      </nav>

      <Card>
        <CardHeader title={sections.find((s) => s.id === active)?.label || ""} />
        {active === "whatsapp" && <WhatsAppSettings />}
        {active !== "whatsapp" && <Placeholder label={sections.find((s) => s.id === active)?.label || ""} />}
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-neutral-400">Loading…</div>}>
      <SettingsInner />
    </Suspense>
  );
}
