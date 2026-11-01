"use client";
import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, FileSignature, XCircle, RefreshCw, Eye, Ban, ListFilter, Loader2,
} from "lucide-react";
import type { Invoice } from "@/lib/types";
import { api } from "@/services/api";
import { faToman, faNumber, formatJalaliDateTime, formatJalaliShort } from "@/lib/persian";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReceiptModal } from "@/components/modals/ReceiptModal";

type TabKey = "همه" | "فاکتور" | "پیش‌فاکتور" | "لغو";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "همه", label: "همه", icon: ListFilter },
  { key: "فاکتور", label: "فاکتورهای قطعی", icon: FileSignature },
  { key: "پیش‌فاکتور", label: "پیش‌فاکتورها", icon: FileText },
  { key: "لغو", label: "لغو شده", icon: XCircle },
];

export function InvoiceCenter() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<TabKey>("همه");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const refreshTick = useStore((s) => s.refreshTick);
  const triggerRefresh = useStore((s) => s.triggerRefresh);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      api.listInvoices()
        .then((r) => { if (!cancelled) setItems(r); })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [refreshTick]);

  const filtered = items.filter((inv) => {
    if (tab === "همه") return true;
    if (tab === "لغو") return inv.status === "لغو شده";
    return inv.type === tab && inv.status === "فعال";
  });

  async function convert(inv: Invoice) {
    try {
      await api.convertInvoice(inv.invoice_no);
      useStore.getState().pushRecentChange(Date.now());
      triggerRefresh();
      toast.success(`پیش‌فاکتور ${inv.invoice_no} به فاکتور نهایی تبدیل شد`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function cancel(inv: Invoice) {
    try {
      await api.cancelInvoice(inv.invoice_no);
      useStore.getState().pushRecentChange(Date.now());
      triggerRefresh();
      toast.success(`سند ${inv.invoice_no} لغو و موجودی بازگردانده شد`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white overflow-hidden">
      <header className="flex items-center gap-2 p-4 border-b border-border">
        <FileSignature className="w-5 h-5 text-brand" />
        <h2 className="font-extrabold text-brand-dark">مرکز فاکتورها و پیش‌فاکتورها</h2>
        <span className="text-xs text-muted-foreground">({faNumber(items.length)} سند)</span>
      </header>

      {/* Tabs — horizontal scrollable on mobile */}
      <div className="border-b border-border p-2 sm:p-3 bg-secondary/40">
        <div className="flex gap-1.5 overflow-x-auto scroll-slim">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            const count = items.filter((inv) =>
              t.key === "همه" ? true
              : t.key === "لغو" ? inv.status === "لغو شده"
              : inv.type === t.key && inv.status === "فعال",
            ).length;
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
                <Icon className="w-3.5 h-3.5" />
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
      <div className="p-2 sm:p-3">
        {pending && filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand" /> در حال بارگذاری…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">سندی در این دسته یافت نشد.</div>
        ) : (
          <AnimatePresence initial={false}>
            <motion.div layout className="space-y-1.5">
              {filtered.map((inv) => (
                <InvoiceRow
                  key={inv.invoice_no}
                  inv={inv}
                  onPreview={() => setPreview(inv)}
                  onConvert={() => convert(inv)}
                  onCancel={() => cancel(inv)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <ReceiptModal invoice={preview} onClose={() => setPreview(null)} />
    </section>
  );
}

function InvoiceRow({
  inv,
  onPreview,
  onConvert,
  onCancel,
}: {
  inv: Invoice;
  onPreview: () => void;
  onConvert: () => void;
  onCancel: () => void;
}) {
  const isProforma = inv.type === "پیش‌فاکتور";
  const isCancelled = inv.status === "لغو شده";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "rounded-xl border bg-white p-2.5 sm:p-3 transition-all",
        isCancelled ? "border-rose-200 bg-rose-50/30"
        : isProforma ? "border-amber/40"
        : "border-border",
      )}
    >
      {/* Row 1 — header info */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Icon */}
        <div className={cn(
          "grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg shrink-0",
          isCancelled ? "bg-rose-100 text-rose-600"
          : isProforma ? "bg-amber/20 text-amber-700"
          : "bg-brand/15 text-brand",
        )}>
          {isCancelled ? <XCircle className="w-5 h-5" /> : isProforma ? <FileText className="w-5 h-5" /> : <FileSignature className="w-5 h-5" />}
        </div>

        {/* Center: id + customer */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-num font-bold text-brand-dark text-xs sm:text-sm">{inv.invoice_no}</span>
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
          <div className="text-[10px] text-muted-foreground font-num mt-0.5 hidden sm:block">
            {formatJalaliDateTime(new Date(inv.created_at))} · فروشنده: {inv.seller}
          </div>
          <div className="text-[10px] text-muted-foreground font-num mt-0.5 sm:hidden">
            {formatJalaliShort(new Date(inv.created_at))}
          </div>
        </div>

        {/* Right: amount + view */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <div className="font-num font-extrabold text-brand-dark text-xs sm:text-sm">{faNumber(inv.total)}</div>
          <div className="text-[10px] text-muted-foreground">تومان</div>
        </div>

        <button
          onClick={onPreview}
          className="grid place-items-center w-8 h-8 rounded-md text-brand hover:bg-lavender shrink-0"
          aria-label="مشاهده رسید"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2 — actions (only if proforma or active) */}
      {!isCancelled && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
          <div className="text-[10px] text-muted-foreground flex-1 text-right truncate">
            {faNumber(inv.items.length)} قلم کالا
          </div>
          {isProforma && (
            <Button
              size="sm"
              onClick={onConvert}
              className="h-8 gap-1 bg-brand hover:bg-brand-dark text-xs px-3"
            >
              <RefreshCw className="w-3.5 h-3.5" /> نهایی کردن
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="h-8 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs px-3"
          >
            <Ban className="w-3.5 h-3.5" /> لغو
          </Button>
        </div>
      )}
    </motion.div>
  );
}
