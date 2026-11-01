"use client";
import { cn } from "@/lib/utils";
import { faNumber } from "@/lib/persian";

interface Props {
  stock: number;
  reserved: number;
  variant?: "chip" | "compact" | "full";
  /** When true, the compact variant also shows the full breakdown */
  showBreakdown?: boolean;
}

export function StockBadge({ stock, reserved, variant = "chip", showBreakdown = true }: Props) {
  const available = Math.max(0, stock - reserved);
  let tone: "in" | "low" | "out";
  if (stock <= 0) tone = "out";
  else if (available <= 3) tone = "low";
  else tone = "in";

  const palette = {
    in: "bg-emerald-50 text-emerald-700 border-emerald-200",
    low: "bg-amber-50 text-amber-700 border-amber-200",
    out: "bg-rose-50 text-rose-700 border-rose-200",
  } as const;

  const labels = {
    in: "موجود",
    low: "موجودی محدود",
    out: "ناموجود",
  } as const;

  const hasProforma = reserved > 0;

  if (variant === "compact") {
    return (
      <div className="inline-flex flex-col items-center gap-0.5">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border", palette[tone])}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          {labels[tone]}
        </span>
        {showBreakdown && (
          <div className="font-num text-[10px] text-muted-foreground flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 leading-tight">
            <span>کل: <b className="text-brand-dark">{faNumber(stock)}</b></span>
            {hasProforma && (
              <>
                <span className="text-amber">|</span>
                <span>پیش‌فاکتور: <b className="text-amber-700">{faNumber(reserved)}</b></span>
              </>
            )}
            <span className="text-amber">|</span>
            <span>قابل فروش: <b className="text-emerald-700">{faNumber(available)}</b></span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("inline-flex flex-col gap-1 px-3 py-2 rounded-xl border", palette[tone])}>
        <span className="font-bold text-xs">{labels[tone]}</span>
        <div className="font-num text-[11px] space-y-0.5 leading-tight">
          <div>موجودی کل: <b className="opacity-90">{faNumber(stock)}</b></div>
          {hasProforma && (
            <div className="text-amber-700">پیش‌فاکتور: <b>{faNumber(reserved)}</b></div>
          )}
          <div className="text-emerald-700 font-bold">قابل فروش: {faNumber(available)}</div>
        </div>
      </div>
    );
  }

  // default chip
  return (
    <div className={cn("inline-flex flex-col gap-0.5 px-3 py-1.5 rounded-xl border text-xs", palette[tone])}>
      <span className="font-bold">{labels[tone]}</span>
      <span className="font-num text-[11px] opacity-80">
        موجود: {faNumber(available)} / کل: {faNumber(stock)}
        {reserved > 0 && <> · پیش‌فاکتور: {faNumber(reserved)}</>}
      </span>
    </div>
  );
}
