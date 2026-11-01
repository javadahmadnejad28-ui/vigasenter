"use client";
import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, XCircle, LayoutList, ArrowDownWideNarrow, ArrowUpWideNarrow,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type StockFilter = "all" | "in" | "low" | "out";
export type SortKey = "default" | "cheap" | "expensive" | "stock";

const PILLS: { key: StockFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "all", label: "همه موارد", icon: LayoutList },
  { key: "in", label: "موجود در انبار", icon: CheckCircle2 },
  { key: "low", label: "موجودی محدود", icon: AlertTriangle },
  { key: "out", label: "ناموجود", icon: XCircle },
];

interface Props {
  stock: StockFilter;
  setStock: (v: StockFilter) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
}

export function FilterBar({ stock, setStock, sort, setSort }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Stock pills */}
      <div className="flex flex-wrap gap-2">
        {PILLS.map((p) => {
          const active = stock === p.key;
          const Icon = p.icon;
          return (
            <motion.button
              key={p.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => setStock(p.key)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-brand-dark text-white border-brand-dark"
                  : "bg-white text-brand-dark border-border hover:border-brand/40"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-amber" : "text-brand"}`} />
              {p.label}
            </motion.button>
          );
        })}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-xs text-muted-foreground">مرتب‌سازی:</span>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[180px] h-9 rounded-xl bg-white border-border text-xs font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">
              <span className="flex items-center gap-2">
                <LayoutList className="w-3.5 h-3.5" /> پیش‌فرض (موجودها اول)
              </span>
            </SelectItem>
            <SelectItem value="cheap">
              <span className="flex items-center gap-2">
                <ArrowDownWideNarrow className="w-3.5 h-3.5" /> ارزان‌ترین
              </span>
            </SelectItem>
            <SelectItem value="expensive">
              <span className="flex items-center gap-2">
                <ArrowUpWideNarrow className="w-3.5 h-3.5" /> گران‌ترین
              </span>
            </SelectItem>
            <SelectItem value="stock">
              <span className="flex items-center gap-2">
                <LayoutList className="w-3.5 h-3.5" /> بیشترین موجودی
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
