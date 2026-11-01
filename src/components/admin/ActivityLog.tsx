"use client";
import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ArrowUpRight, ArrowDownRight, FileText, Plus, RotateCcw, Tag, Boxes, Loader2 } from "lucide-react";
import { api } from "@/services/api";
import type { ProductChange } from "@/lib/types";
import { faNumber, faRelative } from "@/lib/persian";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "همه", label: "همه" },
  { key: "قیمت", label: "قیمت" },
  { key: "پیش‌فاکتور", label: "پیش‌فاکتور" },
  { key: "موجودی", label: "موجودی" },
  { key: "ایجاد", label: "ایجاد محصول" },
  { key: "لغو", label: "لغو سند" },
];

export function ActivityLog() {
  const [items, setItems] = useState<ProductChange[]>([]);
  const [filter, setFilter] = useState("همه");
  const [pending, startTransition] = useTransition();
  const refreshTick = useStore((s) => s.refreshTick);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      api.listChanges({ field: filter, limit: 100 })
        .then((r) => { if (!cancelled) setItems(r.items); })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [filter, refreshTick]);

  return (
    <section className="rounded-2xl border border-border bg-white overflow-hidden">
      <header className="flex items-center gap-2 p-4 border-b border-border">
        <History className="w-5 h-5 text-brand" />
        <h2 className="font-extrabold text-brand-dark">تاریخچه تغییرات</h2>
        <span className="text-xs text-muted-foreground">({faNumber(items.length)} رویداد)</span>
      </header>

      <div className="border-b border-border p-3 bg-secondary/40 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
              filter === f.key
                ? "bg-brand text-white border-brand"
                : "bg-white text-brand-dark border-border hover:border-brand/40",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="max-h-[520px] overflow-y-auto scroll-slim p-3 space-y-2">
        {pending && items.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> در حال بارگذاری…
          </div>
        )}
        {!pending && items.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">رویدادی ثبت نشده است.</div>
        )}
        <AnimatePresence initial={false}>
          {items.map((c) => (
            <Row key={c.id} c={c} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Row({ c }: { c: ProductChange }) {
  const meta = describe(c);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border bg-white p-3 flex gap-3",
        meta.tone === "up" && "border-emerald-100",
        meta.tone === "down" && "border-rose-100",
        meta.tone === "neutral" && "border-border",
      )}
    >
      <div className={cn("grid place-items-center w-9 h-9 rounded-lg shrink-0", meta.iconBg)}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-brand-dark">{meta.label}</span>
          <span className="text-[10px] text-muted-foreground font-num">
            {faRelative(new Date(c.created_at))}
          </span>
        </div>
        {c.product_name && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {c.product_name}
            {c.product_id && <span className="font-num opacity-70"> · {c.product_id}</span>}
          </div>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
          {c.old_value !== null && (
            <span className="font-num px-1.5 py-0.5 rounded bg-secondary text-muted-foreground line-through">
              {c.old_value}
            </span>
          )}
          {c.old_value !== null && <ArrowUpRight className="w-3 h-3 text-muted-foreground rotate-90" />}
          {c.new_value !== null && (
            <span className={cn("font-num px-1.5 py-0.5 rounded font-bold", meta.valueBg, meta.valueColor)}>
              {c.new_value}
            </span>
          )}
          {c.delta !== 0 && (
            <span className={cn("font-num text-[10px] font-bold mr-auto", c.delta > 0 ? "text-emerald-600" : "text-rose-600")}>
              {c.delta > 0 ? "+" : ""}{faNumber(c.delta)}
            </span>
          )}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">توسط: {c.admin}</div>
      </div>
    </motion.div>
  );
}

function describe(c: ProductChange) {
  const f = c.field;
  if (f.includes("قیمت")) {
    const up = c.delta > 0;
    return {
      label: "تغییر قیمت",
      tone: up ? "up" : "down" as const,
      icon: up ? <ArrowUpRight className="w-4 h-4 text-rose-600" /> : <ArrowDownRight className="w-4 h-4 text-emerald-600" />,
      iconBg: up ? "bg-rose-50" : "bg-emerald-50",
      valueBg: up ? "bg-rose-50" : "bg-emerald-50",
      valueColor: up ? "text-rose-600" : "text-emerald-600",
    };
  }
  if (f.includes("پیش‌فاکتور")) {
    return {
      label: "رزرو در پیش‌فاکتور",
      tone: "neutral" as const,
      icon: <FileText className="w-4 h-4 text-amber-700" />,
      iconBg: "bg-amber-50",
      valueBg: "bg-amber-50",
      valueColor: "text-amber-700",
    };
  }
  if (f.includes("فروش")) {
    return {
      label: "فروش قطعی",
      tone: "down" as const,
      icon: <ArrowDownRight className="w-4 h-4 text-rose-600" />,
      iconBg: "bg-rose-50",
      valueBg: "bg-rose-50",
      valueColor: "text-rose-600",
    };
  }
  if (f.includes("ایجاد")) {
    return {
      label: "ایجاد محصول",
      tone: "up" as const,
      icon: <Plus className="w-4 h-4 text-emerald-600" />,
      iconBg: "bg-emerald-50",
      valueBg: "bg-emerald-50",
      valueColor: "text-emerald-700",
    };
  }
  if (f.includes("لغو")) {
    return {
      label: "لغو سند",
      tone: "neutral" as const,
      icon: <RotateCcw className="w-4 h-4 text-brand" />,
      iconBg: "bg-lavender",
      valueBg: "bg-lavender",
      valueColor: "text-brand-dark",
    };
  }
  if (f.includes("موجودی")) {
    const up = c.delta > 0;
    return {
      label: "تغییر موجودی",
      tone: up ? "up" : "down" as const,
      icon: <Boxes className={cn("w-4 h-4", up ? "text-emerald-600" : "text-rose-600")} />,
      iconBg: up ? "bg-emerald-50" : "bg-rose-50",
      valueBg: up ? "bg-emerald-50" : "bg-rose-50",
      valueColor: up ? "text-emerald-700" : "text-rose-600",
    };
  }
  return {
    label: c.field,
    tone: "neutral" as const,
    icon: <Tag className="w-4 h-4 text-brand" />,
    iconBg: "bg-lavender",
    valueBg: "bg-lavender",
    valueColor: "text-brand-dark",
  };
}
