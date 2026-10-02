"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center">
        <span className={destructive ? "flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red" : "flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"}>
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-base font-bold text-neutral-900">{title}</h3>
        <p className="mt-1.5 text-sm text-neutral-500">{description}</p>
        <div className="mt-6 flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={
              destructive
                ? "flex-1 rounded-xl bg-brand-red py-2.5 text-sm font-bold text-white hover:bg-brand-red-dark"
                : "flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
