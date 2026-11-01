"use client";
import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onDec: () => void;
  onInc: () => void;
  onRemove?: () => void;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({ value, onDec, onInc, onRemove, max, size = "md", className }: Props) {
  const dims = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const icon = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const incDisabled = max !== undefined && value >= max;
  const decDisabled = value <= 0;

  return (
    <div className={cn("inline-flex items-center rounded-xl border border-border bg-white overflow-hidden", className)}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onDec}
        disabled={decDisabled}
        aria-label="کاهش"
        className={cn(
          "grid place-items-center text-brand-dark hover:bg-secondary transition disabled:opacity-30 disabled:hover:bg-transparent",
          dims,
        )}
      >
        {value === 1 && onRemove ? <XThin className={icon} /> : <Minus className={icon} />}
      </motion.button>

      <span className="min-w-[2ch] text-center font-num font-bold text-brand-dark text-sm">
        {value}
      </span>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onInc}
        disabled={incDisabled}
        aria-label="افزایش"
        className={cn(
          "grid place-items-center text-white bg-brand hover:bg-brand-dark transition disabled:opacity-30 disabled:hover:bg-brand",
          dims,
        )}
      >
        <Plus className={icon} />
      </motion.button>
    </div>
  );
}

function XThin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  );
}
