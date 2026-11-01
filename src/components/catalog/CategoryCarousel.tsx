"use client";
import { motion } from "framer-motion";
import {
  ToyBrick, PencilRuler, Headphones, Baby, Gamepad2, LayoutGrid,
} from "lucide-react";
import type { Category } from "@/lib/types";
import { faNumber } from "@/lib/persian";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "اسباب‌بازی": ToyBrick,
  "لوازم تحریر": PencilRuler,
  "الکترونیک": Headphones,
  "کودک و نوزاد": Baby,
  "بازی فکری": Gamepad2,
};

interface Props {
  categories: Category[];
  selected: string;
  onSelect: (name: string) => void;
}

export function CategoryCarousel({ categories, selected, onSelect }: Props) {
  const all = [{ id: "ALL", name: "همه", product_count: undefined, status: "فعال", created_at: undefined }, ...categories];
  const total = categories.reduce((s, c) => s + (c.product_count ?? 0), 0);

  return (
    <div className="overflow-x-auto scroll-slim -mx-3 px-3 pb-1">
      <div className="flex gap-2 min-w-min">
        {/* All */}
        <Pill
          active={selected === "همه"}
          onClick={() => onSelect("همه")}
          icon={<LayoutGrid className="w-4 h-4" />}
          title="همه موارد"
          count={total}
        />
        {all.slice(1).map((c) => {
          const Icon = ICONS[c.name] ?? ToyBrick;
          return (
            <Pill
              key={c.id}
              active={selected === c.name}
              onClick={() => onSelect(c.name)}
              icon={<Icon className="w-4 h-4" />}
              title={c.name}
              count={c.product_count ?? 0}
            />
          );
        })}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  icon,
  title,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-bold transition-colors ${
        active
          ? "bg-brand text-white border-brand shadow-md shadow-brand/25"
          : "bg-white text-brand-dark border-border hover:border-brand/40 hover:bg-secondary/60"
      }`}
    >
      <span className={active ? "text-white" : "text-brand"}>{icon}</span>
      <span>{title}</span>
      <span
        className={`font-num text-[11px] px-1.5 py-0.5 rounded-md ${
          active ? "bg-white/20 text-white" : "bg-secondary text-brand-dark"
        }`}
      >
        {faNumber(count)}
      </span>
    </motion.button>
  );
}
