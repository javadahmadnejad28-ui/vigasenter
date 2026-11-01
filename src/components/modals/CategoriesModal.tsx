"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X, ToyBrick, PencilRuler, Headphones, Baby, Gamepad2, LayoutGrid, Check } from "lucide-react";
import type { Category } from "@/lib/types";
import { faNumber } from "@/lib/persian";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "اسباب‌بازی": ToyBrick,
  "لوازم تحریر": PencilRuler,
  "الکترونیک": Headphones,
  "کودک و نوزاد": Baby,
  "بازی فکری": Gamepad2,
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: Category[];
  selected: string;
  onSelect: (name: string) => void;
}

export function CategoriesModal({ open, onOpenChange, categories, selected, onSelect }: Props) {
  const [q, setQ] = useState("");
  const total = useMemo(
    () => categories.reduce((s, c) => s + (c.product_count ?? 0), 0),
    [categories],
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return categories;
    return categories.filter((c) => c.name.includes(q.trim()));
  }, [categories, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" dir="rtl">
        <DialogTitle className="sr-only">انتخاب دسته‌بندی</DialogTitle>
        <DialogDescription className="sr-only">از بین دسته‌بندی‌ها انتخاب کنید</DialogDescription>

        <div className="p-5 bg-gradient-to-l from-brand-dark to-brand text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-amber" />
                دسته‌بندی‌ها
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                {faNumber(categories.length)} دسته · {faNumber(total)} کالا
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="grid place-items-center w-9 h-9 rounded-lg hover:bg-white/15"
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی دسته‌بندی…"
              className="w-full h-10 pr-10 pl-3 rounded-xl bg-white/10 border border-white/15 placeholder:text-white/60 text-white text-sm outline-none focus:bg-white/15 focus:border-amber"
            />
          </div>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto scroll-slim">
          {/* "All" tile */}
          <button
            onClick={() => { onSelect("همه"); onOpenChange(false); }}
            className="w-full mb-3 flex items-center gap-3 p-3 rounded-xl border bg-white hover:bg-lavender/50 transition-colors border-border"
          >
            <div className="grid place-items-center w-12 h-12 rounded-xl bg-brand text-white shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div className="flex-1 text-right">
              <div className="font-bold text-brand-dark">همه دسته‌ها</div>
              <div className="text-[11px] text-muted-foreground font-num">{faNumber(total)} کالا</div>
            </div>
            {selected === "همه" && <Check className="w-5 h-5 text-brand" />}
          </button>

          <div className="grid sm:grid-cols-2 gap-2">
            {filtered.map((c) => {
              const Icon = ICONS[c.name] ?? ToyBrick;
              const active = selected === c.name;
              return (
                <motion.button
                  key={c.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onSelect(c.name); onOpenChange(false); }}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-colors ${
                    active
                      ? "border-brand bg-lavender"
                      : "border-border bg-white hover:bg-lavender/40"
                  }`}
                >
                  <div className={`grid place-items-center w-12 h-12 rounded-xl shrink-0 ${active ? "bg-brand text-white" : "bg-secondary text-brand-dark"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold ${active ? "text-brand-dark" : "text-brand-dark"}`}>{c.name}</div>
                    <div className="text-[11px] text-muted-foreground font-num">{faNumber(c.product_count ?? 0)} کالا</div>
                  </div>
                  {active && <Check className="w-5 h-5 text-brand" />}
                </motion.button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-muted-foreground text-sm">
              دسته‌بندی با این نام یافت نشد.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
