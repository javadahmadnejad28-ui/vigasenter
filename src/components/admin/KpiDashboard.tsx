"use client";
import { motion } from "framer-motion";
import { Package, CheckCircle2, FileClock, XCircle, Coins, TrendingUp } from "lucide-react";
import type { Kpis } from "@/lib/types";
import { faNumber, faTomanCompact } from "@/lib/persian";
import { cn } from "@/lib/utils";

interface Props {
  kpis: Kpis;
}

export function KpiDashboard({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Card
        title="کل محصولات"
        value={faNumber(kpis.totalProducts)}
        icon={<Package className="w-5 h-5" />}
        tone="brand"
      />
      <Card
        title="کالاهای قابل فروش"
        value={faNumber(kpis.sellableItems)}
        icon={<CheckCircle2 className="w-5 h-5" />}
        tone="up"
      />
      <Card
        title="پیش‌فاکتورهای باز"
        value={faNumber(kpis.openProformas)}
        icon={<FileClock className="w-5 h-5" />}
        tone="amber"
      />
      <Card
        title="ناموجودها"
        value={faNumber(kpis.outOfStock)}
        icon={<XCircle className="w-5 h-5" />}
        tone="down"
      />
      <Card
        title="ارزش ریالی کل انبار"
        value={faTomanCompact(kpis.inventoryValue)}
        icon={<Coins className="w-5 h-5" />}
        tone="brand"
        wide
      />
    </div>
  );
}

function Card({
  title,
  value,
  icon,
  tone,
  wide,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "brand" | "up" | "down" | "amber";
  wide?: boolean;
}) {
  const palette = {
    brand: { bg: "bg-white", accent: "text-brand", glow: "glow-brand", ring: "ring-brand/10" },
    up: { bg: "bg-white", accent: "text-emerald-600", glow: "", ring: "ring-emerald-100" },
    down: { bg: "bg-white", accent: "text-rose-600", glow: "glow-coral", ring: "ring-rose-100" },
    amber: { bg: "bg-white", accent: "text-amber-700", glow: "glow-amber", ring: "ring-amber-100" },
  }[tone];

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={cn(
        "relative rounded-2xl border border-border p-4 shadow-sm ring-4 ring-transparent hover:shadow-md transition",
        palette.bg,
        wide && "lg:col-span-1",
        palette.ring,
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("grid place-items-center w-9 h-9 rounded-lg bg-secondary/70", palette.accent, palette.glow)}>
          {icon}
        </span>
        <TrendingUp className={cn("w-4 h-4 opacity-50", palette.accent)} />
      </div>
      <div className="mt-3">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className={cn("font-num font-extrabold text-xl mt-0.5", palette.accent)}>{value}</div>
      </div>
    </motion.div>
  );
}
