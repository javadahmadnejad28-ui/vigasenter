"use client";
import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, FileSignature, XCircle, Eye, History, Loader2,
} from "lucide-react";
import { api } from "@/services/api";
import type { Invoice } from "@/lib/types";
import { faToman, faNumber, formatJalaliDateTime, formatJalaliShort } from "@/lib/persian";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

type Tab = "all" | "proforma" | "invoice" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "proforma", label: "پیش‌فاکتورها" },
  { key: "invoice", label: "فاکتورهای نهایی" },
  { key: "cancelled", label: "لغو شده" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function MyInvoicesDrawer({ open, onOpenChange }: Props) {
  const [items, setItems] = useState<Invoice[]>([]);
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("all");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const refreshTick = useStore((s) => s.refreshTick);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    startTransition(() => {
      api.listInvoices()
        .then((r) => { if (!cancelled) setItems(r); })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [open, refreshTick]);

  const countFor = (t: Tab) => items.filter((inv) =>
    t === "all" ? true
    : t === "cancelled" ? inv.status === "لغو شده"
    : t === "proforma" ? inv.type === "پیش‌فاکتور" && inv.status === "فعال"
    : inv.type === "فاکتور" && inv.status === "فعال",
  ).length;

  const filtered = items.filter((inv) => {
    if (tab === "all") return true;
    if (tab === "cancelled") return inv.status === "لغو شده";
    if (tab === "proforma") return inv.type === "پیش‌فاکتور" && inv.status === "فعال";
    return inv.type === "فاکتور" && inv.status === "فعال";
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-full sm:max-w-2xl p-0 flex flex-col" dir="rtl">
          <SheetHeader className="px-4 sm:px-5 py-4 border-b border-border bg-gradient-to-l from-brand-dark to-brand text-white shrink-0">
            <SheetTitle className="flex items-center gap-2 text-white">
              <History className="w-5 h-5 text-amber" />
              فاکتورهای من
            </SheetTitle>
            <SheetDescription className="text-white/80 text-xs">
              لیست کامل اسناد صادر شده. برای مشاهده جزئیات یا چاپ، روی هر سند کلیک کنید.
            </SheetDescription>
          </SheetHeader>

          {/* Tabs — horizontal scrollable on mobile */}
          <div className="border-b border-border p-2 sm:p-3 bg-secondary/40 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto scroll-slim">
              {TABS.map((t) => {
                const active = tab === t.key;
                const count = countFor(t.key);
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap shrink-0",
                      active
                        ? "bg-brand text-white border-brand"
                        : "bg-white text-brand-dark border-border hover:border-brand/40",
                    )}
                  >
                    {t.label}
                    <span className={cn("font-num text-[10px] px-1.5 py-0.5 rounded-md", active ? "bg-white/20" : "bg-secondary")}>
                      {faNumber(count)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto scroll-slim p-2 sm:p-3">
            {pending && items.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand" /> در حال بارگذاری…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                سندی در این دسته یافت نشد.
              </div>
            ) : (
              <AnimatePresence initial={false}>
                <motion.div layout className="space-y-1.5">
                  {filtered.map((inv) => (
                    <InvoiceRow key={inv.invoice_no} inv={inv} onPreview={() => setPreview(inv)} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ReceiptModal invoice={preview} onClose={() => setPreview(null)} />
    </>
  );
}

function InvoiceRow({ inv, onPreview }: { inv: Invoice; onPreview: () => void }) {
  const isProforma = inv.type === "پیش‌فاکتور";
  const isCancelled = inv.status === "لغو شده";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onPreview}
      className={cn(
        "w-full rounded-xl border bg-white p-3 flex items-center gap-3 hover:shadow-md hover:border-brand/30 transition-all text-right",
        isCancelled ? "border-rose-200 bg-rose-50/30"
        : isProforma ? "border-amber/40"
        : "border-border",
      )}
    >
      {/* Icon */}
      <div className={cn(
        "grid place-items-center w-11 h-11 rounded-lg shrink-0",
        isCancelled ? "bg-rose-100 text-rose-600"
        : isProforma ? "bg-amber/20 text-amber-700"
        : "bg-brand/15 text-brand",
      )}>
        {isCancelled ? <XCircle className="w-5 h-5" /> : isProforma ? <FileText className="w-5 h-5" /> : <FileSignature className="w-5 h-5" />}
      </div>

      {/* Center: id + customer */}
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-num font-bold text-brand-dark text-sm">{inv.invoice_no}</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded-md text-[10px] font-bold",
            isCancelled ? "bg-rose-100 text-rose-700"
            : isProforma ? "bg-amber/20 text-amber-700"
            : "bg-brand/10 text-brand",
          )}>
            {isCancelled ? "لغو شده" : isProforma ? "پیش‌فاکتور" : "نهایی"}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {inv.customer_name}
          {inv.customer_phone && <span className="font-num"> · {inv.customer_phone}</span>}
        </div>
        <div className="text-[10px] text-muted-foreground font-num mt-0.5">
          {formatJalaliShort(new Date(inv.created_at))} · {faNumber(inv.items.length)} قلم
        </div>
      </div>

      {/* Right: amount + view */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="font-num font-extrabold text-brand-dark text-sm">{faNumber(inv.total)}</div>
        <div className="text-[10px] text-muted-foreground">تومان</div>
      </div>

      <div className="grid place-items-center w-8 h-8 rounded-md text-brand hover:bg-lavender shrink-0">
        <Eye className="w-4 h-4" />
      </div>
    </motion.button>
  );
}
