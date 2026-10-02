"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { createFaq, deleteFaq, getFaqs, updateFaq } from "@/lib/api/whatsapp";
import { Card, CardHeader } from "../ui/Card";
import { useToast } from "../ui/ToastProvider";
import type { Faq } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FaqPanel() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [adding, setAdding] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    getFaqs()
      .then(setFaqs)
      .catch(() => push({ kind: "error", title: "Failed to load FAQs" }))
      .finally(() => setLoading(false));
  }, [push]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setAdding(true);
    try {
      const faq = await createFaq({
        question: question.trim(),
        answer: answer.trim(),
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      });
      setFaqs((prev) => [...prev, faq]);
      setQuestion("");
      setAnswer("");
      setKeywords("");
      push({ kind: "success", title: "FAQ added" });
    } catch {
      push({ kind: "error", title: "Failed to add FAQ" });
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(faq: Faq) {
    try {
      const updated = await updateFaq(faq.id, { active: !faq.active });
      setFaqs((prev) => prev.map((f) => (f.id === faq.id ? updated : f)));
    } catch {
      push({ kind: "error", title: "Failed to update FAQ" });
    }
  }

  async function handleDelete(id: string) {
    const prev = faqs;
    setFaqs((cur) => cur.filter((f) => f.id !== id));
    try {
      await deleteFaq(id);
      push({ kind: "success", title: "FAQ removed" });
    } catch {
      setFaqs(prev);
      push({ kind: "error", title: "Failed to remove FAQ" });
    }
  }

  const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-brand-red focus:outline-none";

  return (
    <Card>
      <CardHeader
        title="Bot FAQs"
        subtitle="When a customer asks a question mid-flow, the smart bot sends one of these answers word for word, then repeats its current question."
      />
      <form onSubmit={handleAdd} className="mb-4 grid gap-2 rounded-xl bg-neutral-50 p-3">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question, e.g. Where is your office?" className={inputClass} />
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer the bot will send" rows={2} className={inputClass} />
        <div className="flex gap-2">
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords, comma separated (optional)" className={inputClass} />
          <button
            type="submit"
            disabled={adding || !question.trim() || !answer.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add FAQ
          </button>
        </div>
      </form>
      <div className="space-y-3">
        {loading && <p className="py-6 text-center text-sm text-neutral-400">Loading FAQs…</p>}
        {!loading && faqs.length === 0 && <p className="py-6 text-center text-sm text-neutral-400">No FAQs yet.</p>}
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className={cn("group flex items-start gap-3 rounded-xl border border-black/6 p-3.5 hover:border-black/12", !faq.active && "opacity-60")}
          >
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-neutral-800">{faq.question}</p>
              <p className="mt-1 text-sm text-neutral-600">{faq.answer}</p>
              {faq.keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {faq.keywords.map((k) => (
                    <span key={k} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => handleToggle(faq)}
                className="rounded-lg px-2 py-1 text-xs font-bold text-neutral-500 hover:bg-neutral-100"
              >
                {faq.active ? "Active" : "Inactive"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(faq.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-brand-red group-hover:opacity-100"
                aria-label="Delete FAQ"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
