"use client";
import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, ArrowUpRight, ArrowDownRight, FileText, Plus, RotateCcw, Tag, Boxes, History,
} from "lucide-react";
import { api } from "@/services/api";
import type { ProductChange } from "@/lib/types";
import { faNumber, faToman, faRelative } from "@/lib/persian";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  limit?: number;
}

const FILTERS = [
  { key: "همه", label: "همه" },
  { key: "قیمت", label: "قیمت" },
  { key: "پیش‌فاکتور", label: "پیش‌فاکتور" },
  { key: "موجودی", label: "موجودی" },
  { key: "ایجاد", label: "ایجاد محصول" },
  { key: "لغو", label: "لغو سند" },
];

export function ChangesDrawer({ open, onOpenChange, limit = 60 }: Props) {
  const [items, setItems] = useState<ProductChange[]>([]);
  const [filter, setFilter] = useState("همه");
  const [pending, startTransition] = useTransition();
  const setBadge = useStore((s) => s.setChangesBadge);
  const recentIds = useStore((s) => s.recentChangeIds);
  const refreshTick = useStore((s) => s.refreshTick);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      api.listChanges({ field: filter, limit })
        .then((r) => {
          if (cancelled) return;
          setItems(r.items);
          setBadge(0);
        })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [filter, limit, refreshTick, setBadge]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col" dir="rtl">
        <SheetHeader className="px-5 py-4 border-b border-border bg-gradient-to-l from-brand-dark to-brand text-white">
          <SheetTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-amber" />
            تغییرات اخیر
          </SheetTitle>
          <SheetDescription className="text-white/80 text-xs">
            تاریخچه کامل تراکنش‌ها: تغییر قیمت، رزرو پیش‌فاکتور، فروش قطعی، ایجاد و لغو سند.
          </SheetDescription>
        </SheetHeader>

        {/* Filter chips */}
        <div className="border-b border-border p-3 bg-secondary/40">
          <div className="flex flex-wrap gap-1.5">
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
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scroll-slim p-3 space-y-2">
          {pending && items.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8">در حال بارگذاری…</div>
          )}
          {!pending && items.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8">رویدادی ثبت نشده است.</div>
          )}
          <AnimatePresence initial={false}>
            {items.map((c) => (
              <ChangeRow key={c.id} change={c} isNew={recentIds.includes(c.id)} />
            ))}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ChangeRow({ change, isNew }: { change: ProductChange; isNew: boolean }) {
  const meta = describe(change);
  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, x: -20, scale: 0.96 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={cn(
        "rounded-xl border bg-white p-3 flex gap-3",
        meta.tone === "up" && "border-emerald-200",
        meta.tone === "down" && "border-rose-200",
        meta.tone === "neutral" && "border-border",
        isNew && "ring-2 ring-amber/40",
      )}
    >
      <div className={cn("grid place-items-center w-9 h-9 rounded-lg shrink-0", meta.iconBg)}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-brand-dark">{meta.label}</span>
          <span className="text-[10px] text-muted-foreground font-num">
            {faRelative(new Date(change.created_at))}
          </span>
        </div>
        {change.product_name && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {change.product_name}
            {change.product_id && <span className="font-num opacity-70"> · {change.product_id}</span>}
          </div>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
          {change.old_value !== null && (
            <span className="font-num px-1.5 py-0.5 rounded bg-secondary text-muted-foreground line-through">
              {change.old_value}
            </span>
          )}
          {change.old_value !== null && <ArrowUpRight className="w-3 h-3 text-muted-foreground rotate-90" />}
          {change.new_value !== null && (
            <span className={cn("font-num px-1.5 py-0.5 rounded font-bold", meta.valueBg, meta.valueColor)}>
              {change.new_value}
            </span>
          )}
          {change.delta !== 0 && (
            <span className={cn("font-num text-[10px] font-bold mr-auto", change.delta > 0 ? "text-emerald-600" : "text-rose-600")}>
              {change.delta > 0 ? "+" : ""}{faNumber(change.delta)}
            </span>
          )}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          توسط: {change.admin}
        </div>
      </div>
    </motion.div>
  );
}

function describe(c: ProductChange): {
  label: string;
  tone: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
  valueBg: string;
  valueColor: string;
} {
  const f = c.field;
  if (f.includes("قیمت")) {
    const up = c.delta > 0;
    return {
      label: "تغییر قیمت",
      tone: up ? "up" : "down",
      icon: up ? <ArrowUpRight className="w-4 h-4 text-rose-600" /> : <ArrowDownRight className="w-4 h-4 text-emerald-600" />,
      iconBg: up ? "bg-rose-50" : "bg-emerald-50",
      valueBg: up ? "bg-rose-50" : "bg-emerald-50",
      valueColor: up ? "text-rose-600" : "text-emerald-600",
    };
  }
  if (f.includes("پیش‌فاکتور")) {
    return {
      label: "رزرو در پیش‌فاکتور",
      tone: "neutral",
      icon: <FileText className="w-4 h-4 text-amber-700" />,
      iconBg: "bg-amber-50",
      valueBg: "bg-amber-50",
      valueColor: "text-amber-700",
    };
  }
  if (f.includes("فروش")) {
    return {
      label: "فروش قطعی",
      tone: "down",
      icon: <ArrowDownRight className="w-4 h-4 text-rose-600" />,
      iconBg: "bg-rose-50",
      valueBg: "bg-rose-50",
      valueColor: "text-rose-600",
    };
  }
  if (f.includes("ایجاد")) {
    return {
      label: "ایجاد محصول",
      tone: "up",
      icon: <Plus className="w-4 h-4 text-emerald-600" />,
      iconBg: "bg-emerald-50",
      valueBg: "bg-emerald-50",
      valueColor: "text-emerald-700",
    };
  }
  if (f.includes("لغو")) {
    return {
      label: "لغو سند",
      tone: "neutral",
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
      tone: up ? "up" : "down",
      icon: <Boxes className={cn("w-4 h-4", up ? "text-emerald-600" : "text-rose-600")} />,
      iconBg: up ? "bg-emerald-50" : "bg-rose-50",
      valueBg: up ? "bg-emerald-50" : "bg-rose-50",
      valueColor: up ? "text-emerald-700" : "text-rose-600",
    };
  }
  return {
    label: c.field,
    tone: "neutral",
    icon: <Tag className="w-4 h-4 text-brand" />,
    iconBg: "bg-lavender",
    valueBg: "bg-lavender",
    valueColor: "text-brand-dark",
  };
}

export { Bell, X, faToman };
