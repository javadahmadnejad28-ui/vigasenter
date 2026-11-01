"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Tag, Boxes, Hash } from "lucide-react";
import type { Product } from "@/lib/types";
import { faToman, faNumber } from "@/lib/persian";
import { useStore } from "@/store/useStore";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { StockBadge } from "@/components/shared/StockBadge";

interface Props {
  products: Product[];
}

export function CatalogTable({ products }: Props) {
  return (
    <div className="hidden lg:block rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/70 text-brand-dark text-xs">
            <th className="text-right font-bold py-3 px-4 w-[42%]">کالا</th>
            <th className="text-right font-bold py-3 px-3 w-[12%]">دسته</th>
            <th className="text-center font-bold py-3 px-3 w-[20%]">
              <span className="inline-flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5" /> موجودی و پیش‌فاکتور
              </span>
            </th>
            <th className="text-right font-bold py-3 px-3 w-[13%]">
              <span className="inline-flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> قیمت واحد
              </span>
            </th>
            <th className="text-center font-bold py-3 px-3 w-[13%]">تعداد سفارش</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <TableRow key={p.id} product={p} even={idx % 2 === 1} />
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="py-12 text-center text-muted-foreground">
                هیچ کالایی با این فیلتر یافت نشد.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({ product, even }: { product: Product; even: boolean }) {
  const cart = useStore((s) => s.cart[product.id]?.quantity ?? 0);
  const addToCart = useStore((s) => s.addToCart);
  const decrement = useStore((s) => s.decrement);
  const available = Math.max(0, product.stock - product.reserved);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-t border-border ${even ? "bg-secondary/30" : "bg-white"} hover:bg-lavender/40 transition-colors`}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-lavender to-secondary text-brand-dark shrink-0">
            <Hash className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-brand-dark truncate">{product.name}</p>
            <p className="text-[11px] text-muted-foreground font-num">کد: {product.id}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-3">
        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-lavender text-brand-dark text-[11px] font-bold">
          {product.category}
        </span>
      </td>
      <td className="py-3 px-3 text-center">
        <StockBadge stock={product.stock} reserved={product.reserved} variant="compact" showBreakdown />
      </td>
      <td className="py-3 px-3">
        <div className="font-num text-base font-extrabold text-brand-dark">{faToman(product.price)}</div>
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-col items-center gap-1.5">
          <QuantityStepper
            value={cart}
            max={available}
            onDec={() => decrement(product.id)}
            onInc={() => addToCart(product, +1)}
            onRemove={() => useStore.getState().removeFromCart(product.id)}
          />
          <AnimatePresence>
            {cart > 0 && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[11px] text-brand font-num font-bold"
              >
                مجموع: {faNumber(cart * product.price)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </td>
    </motion.tr>
  );
}

export { Plus, Minus };
