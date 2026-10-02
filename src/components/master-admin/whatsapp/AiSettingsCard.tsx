"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getAiSettings, updateAiSettings } from "@/lib/api/settings";
import { Card, CardHeader } from "../ui/Card";
import { useToast } from "../ui/ToastProvider";
import type { AiSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Smart auto-reply status and toggle. AI settings are owner-level, so the
 * card simply stays hidden for accounts that cannot read them.
 */
export function AiSettingsCard() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    getAiSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  if (!settings) return null;

  const ready = settings.envEnabled && settings.providerSupported && settings.apiKeyConfigured;
  const live = ready && settings.enabled;

  async function save(patch: Partial<Pick<AiSettings, "enabled" | "confidenceThreshold">>) {
    setSaving(true);
    try {
      setSettings(await updateAiSettings(patch));
      push({ kind: "success", title: "AI settings saved" });
    } catch {
      push({ kind: "error", title: "Failed to save AI settings" });
    } finally {
      setSaving(false);
    }
  }

  let status = "Active: customers can reply in Hindi, English or Hinglish.";
  if (!settings.envEnabled) status = "Off on the server (AI_ENABLED=false). The rule-based bot is running.";
  else if (!settings.providerSupported) status = `Provider "${settings.provider}" is not supported.`;
  else if (!settings.apiKeyConfigured) status = "No AI API key configured on the server. The rule-based bot is running.";
  else if (!settings.enabled) status = "Paused. The rule-based bot is running.";

  return (
    <Card>
      <CardHeader
        title="Smart Auto-Reply (AI)"
        subtitle={status}
        action={
          <button
            type="button"
            disabled={!ready || saving}
            onClick={() => save({ enabled: !settings.enabled })}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              live ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {live ? "On" : "Off"}
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-600">
        <span>
          Model: <span className="font-semibold text-neutral-800">{settings.model}</span>
        </span>
        <label className="flex items-center gap-2">
          Confidence threshold
          <select
            value={settings.confidenceThreshold}
            disabled={!ready || saving}
            onChange={(e) => save({ confidenceThreshold: Number(e.target.value) })}
            className="rounded-lg border border-black/10 px-2 py-1 text-sm disabled:opacity-50"
          >
            {[0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9].map((v) => (
              <option key={v} value={v}>
                {v.toFixed(2)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Card>
  );
}
