"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { GripVertical, ListPlus, MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { createBotStep, deleteBotStep, getBotSteps } from "@/lib/api/whatsapp";
import { Card, CardHeader } from "../ui/Card";
import { useToast } from "../ui/ToastProvider";
import type { BotStep } from "@/lib/types";

export function BotFlowPanel() {
  const [steps, setSteps] = useState<BotStep[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    getBotSteps()
      .then(setSteps)
      .catch(() => push({ kind: "error", title: "Failed to load bot flow" }))
      .finally(() => setLoading(false));
  }, [push]);

  async function handleDelete(id: string) {
    const prev = steps;
    setSteps((cur) => cur.filter((s) => s.id !== id));
    try {
      await deleteBotStep(id);
      push({ kind: "success", title: "Step removed" });
    } catch {
      setSteps(prev);
      push({ kind: "error", title: "Failed to remove step" });
    }
  }

  async function handleAdd() {
    try {
      const step = await createBotStep({
        order: steps.length + 1,
        title: "New Step",
        message: "Enter the bot message for this step...",
      });
      setSteps((prev) => [...prev, step]);
      push({ kind: "success", title: "Step added", description: "Edit it to configure the message and options." });
    } catch {
      push({ kind: "error", title: "Failed to add step" });
    }
  }

  return (
    <Card>
      <CardHeader
        title="WhatsApp Bot Flow"
        subtitle="This flow runs automatically before a lead reaches your inbox."
        action={
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white hover:scale-[1.02] transition-transform"
          >
            <ListPlus className="h-3.5 w-3.5" />
            Add Step
          </button>
        }
      />
      <div className="space-y-3">
        {loading && <p className="py-6 text-center text-sm text-neutral-400">Loading bot flow…</p>}
        {!loading && steps.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-400">No steps configured yet.</p>
        )}
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="group flex items-start gap-3 rounded-xl border border-black/6 p-3.5 hover:border-black/12"
          >
            <GripVertical className="mt-1 h-4 w-4 shrink-0 cursor-grab text-neutral-300" />
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-500">
              {step.order}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-3.5 w-3.5 text-brand-red" />
                <p className="text-sm font-bold text-neutral-800">{step.title}</p>
                {step.collectsField && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                    collects: {step.collectsField}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-600">{step.message}</p>
              {step.options && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.options.map((o) => (
                    <span key={o.id} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                      {o.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => push({ kind: "info", title: "Edit step", description: "Step editor coming soon." })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Edit step"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(step.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-brand-red"
                aria-label="Delete step"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
