"use client";
import { motion } from "framer-motion";
import { Tag, Hash } from "lucide-react";
import type { Product } from "@/lib/types";
import { faToman, faNumber } from "@/lib/persian";
import { useStore } from "@/store/useStore";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { StockBadge } from "@/components/shared/StockBadge";

interface Props {
  products: Product[];
}

export function CatalogCards({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        هیچ کالایی با این فیلتر یافت نشد.
      </div>
    );
  }
  return (
    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
      {products.map((p) => (
        <Card key={p.id} product={p} />
      ))}
    </div>
  );
}

function Card({ product }: { product: Product }) {
  const cart = useStore((s) => s.cart[product.id]?.quantity ?? 0);
  const addToCart = useStore((s) => s.addToCart);
  const decrement = useStore((s) => s.decrement);
  const available = Math.max(0, product.stock - product.reserved);

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.99 }}
      className="rounded-2xl bg-white border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid place-items-center w-10 h-10 rounded-lg bg-gradient-to-br from-lavender to-secondary text-brand-dark shrink-0">
              <Hash className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-brand-dark text-sm leading-snug line-clamp-2">{product.name}</p>
              <p className="text-[10px] text-muted-foreground font-num mt-0.5">کد: {product.id}</p>
            </div>
          </div>
          <StockBadge stock={product.stock} reserved={product.reserved} variant="compact" />
        </div>

        {available <= 3 && available > 0 && (
          <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-amber text-white text-[10px] font-bold">
            آخرین {faNumber(available)} عدد
          </span>
        )}

        <div className="mt-3 flex items-end justify-between gap-2 pt-2 border-t border-border">
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Tag className="w-3 h-3" /> {product.category}
            </div>
            <div className="font-num text-base font-extrabold text-brand-dark leading-tight">
              {faToman(product.price)}
            </div>
          </div>

          {available > 0 ? (
            <QuantityStepper
              size="sm"
              value={cart}
              max={available}
              onDec={() => decrement(product.id)}
              onInc={() => addToCart(product, +1)}
              onRemove={() => useStore.getState().removeFromCart(product.id)}
            />
          ) : (
            <span className="px-3 py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold">ناموجود</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
