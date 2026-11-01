"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { faNumber, faToman } from "@/lib/persian";
import { Button } from "@/components/ui/button";

interface Props {
  onOpenInvoice: () => void;
}

export function CartBar({ onOpenInvoice }: Props) {
  const count = useStore((s) => s.cartCount());
  const totalQty = useStore((s) => s.cartTotalQty());
  const total = useStore((s) => s.cartTotalAmount());
  const clearCart = useStore((s) => s.clearCart);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="fixed bottom-4 inset-x-0 z-30 px-3 sm:px-6 no-print"
        >
          <div className="mx-auto max-w-3xl rounded-2xl bg-brand-dark text-white shadow-2xl shadow-brand-dark/30 overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              {/* Counter */}
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-white/15">
                <ShoppingCart className="w-5 h-5 text-amber" />
                <span className="absolute mt-7 text-[9px] text-amber font-bold">
                  {faNumber(count)}
                </span>
              </div>

              {/* Totals */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/70 leading-tight">
                  {faNumber(totalQty)} عدد از {faNumber(count)} کالا
                </div>
                <div className="font-num font-extrabold text-base leading-tight">
                  {faToman(total)}
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={clearCart}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-10 gap-1.5"
                aria-label="خالی کردن سبد"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">خالی کردن</span>
              </Button>

              <Button
                onClick={onOpenInvoice}
                className="bg-amber hover:bg-amber/90 text-brand-dark font-extrabold rounded-xl h-10 px-5 gap-1.5"
              >
                <span>صدور فاکتور</span>
                <X className="w-4 h-4 rotate-45" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
