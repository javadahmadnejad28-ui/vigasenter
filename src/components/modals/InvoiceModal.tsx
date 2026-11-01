"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, BadgeCheck, FileText, FileSignature, Loader2, X,
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { api } from "@/services/api";
import { faToman, faNumber } from "@/lib/persian";
import type { Invoice } from "@/lib/types";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onIssued: (inv: Invoice) => void;
}

export function InvoiceModal({ open, onClose, onIssued }: Props) {
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const decrement = useStore((s) => s.decrement);
  const clearCart = useStore((s) => s.clearCart);
  const triggerRefresh = useStore((s) => s.triggerRefresh);

  const lines = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.product.price, 0), [lines]);
  const totalQty = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [seller, setSeller] = useState("");
  const [busy, setBusy] = useState<null | "proforma" | "final">(null);

  async function issue(type: "پیش‌فاکتور" | "فاکتور") {
    if (!name.trim()) { toast.error("نام مشتری الزامی است"); return; }
    if (lines.length === 0) { toast.error("سبد خرید خالی است"); return; }
    setBusy(type === "پیش‌فاکتور" ? "proforma" : "final");
    try {
      const inv = await api.createInvoice({
        type,
        customer_name: name.trim(),
        customer_phone: phone.trim() || undefined,
        seller: seller.trim() || undefined,
        items: lines.map((l) => ({
          id: l.product.id,
          name: l.product.name,
          price: l.product.price,
          quantity: l.quantity,
        })),
      });
      toast.success(
        type === "پیش‌فاکتور"
          ? `پیش‌فاکتور ${inv.invoice_no} صادر شد و موجودی رزرو گردید.`
          : `فاکتور نهایی ${inv.invoice_no} صادر شد و موجودی کسر شد.`,
      );
      clearCart();
      setName(""); setPhone(""); setSeller("");
      triggerRefresh();
      onIssued(inv);
    } catch (e) {
      toast.error((e as Error).message || "صدور سند با خطا مواجه شد");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden gap-0 max-h-[95vh] sm:max-h-[90vh]" dir="rtl">
        <DialogTitle className="sr-only">صدور سند فروش</DialogTitle>
        <DialogDescription className="sr-only">
          اطلاعات مشتری و فهرست کالاها را تأیید کنید. پیش‌فاکتور موجودی را رزرو می‌کند؛ فاکتور نهایی موجودی فیزیکی را کسر می‌کند.
        </DialogDescription>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
          {/* RIGHT pane (in RTL): Customer + Totals + Actions */}
          <aside className="bg-gradient-to-bl from-brand-dark via-brand to-brand text-white p-4 sm:p-6 flex flex-col overflow-y-auto scroll-slim">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-amber shrink-0" />
              <h2 className="text-lg font-extrabold">صدور سند فروش</h2>
            </div>
            <p className="text-white/70 text-xs mb-4 leading-relaxed">
              اطلاعات مشتری را وارد و فهرست کالاها را تأیید کنید.
            </p>

            <div className="space-y-3 flex-1">
              <Field label="نام و نام خانوادگی" required icon={<User className="w-3.5 h-3.5" />}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: آرش رضایی"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 focus:bg-white/15 focus:border-amber"
                />
              </Field>
              <Field label="شماره تماس" icon={<Phone className="w-3.5 h-3.5" />}>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 focus:bg-white/15 focus:border-amber font-num"
                  inputMode="tel"
                  dir="ltr"
                />
              </Field>
              <Field label="نام فروشنده" icon={<BadgeCheck className="w-3.5 h-3.5" />}>
                <Input
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  placeholder="فروشنده"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 focus:bg-white/15 focus:border-amber"
                />
              </Field>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">تعداد کالا</span>
                <span className="font-num font-bold">{faNumber(totalQty)} عدد</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">تعداد قلم</span>
                <span className="font-num font-bold">{faNumber(lines.length)} قلم</span>
              </div>
              <div className="flex items-end justify-between pt-2 border-t border-white/20">
                <span className="text-white/80 text-sm">مبلغ کل</span>
                <div className="text-left">
                  <div className="font-num font-extrabold text-2xl text-amber leading-none">
                    {faNumber(total)}
                  </div>
                  <div className="text-[10px] text-white/60 mt-0.5">تومان</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-2">
              <Button
                onClick={() => issue("پیش‌فاکتور")}
                disabled={busy !== null || lines.length === 0}
                className="h-12 bg-amber hover:bg-amber/90 text-brand-dark font-extrabold gap-2 text-sm rounded-xl w-full"
              >
                {busy === "proforma" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                <span className="text-center flex-1">صدور پیش‌فاکتور (رزرو انبار)</span>
              </Button>
              <Button
                onClick={() => issue("فاکتور")}
                disabled={busy !== null || lines.length === 0}
                className="h-12 bg-white hover:bg-white/90 text-brand-dark font-extrabold gap-2 text-sm rounded-xl w-full"
              >
                {busy === "final" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
                <span className="text-center flex-1">صدور فاکتور نهایی</span>
              </Button>
              <button
                onClick={onClose}
                className="h-10 text-white/70 hover:text-white text-xs flex items-center justify-center gap-1.5 mt-1"
              >
                <ArrowRight className="w-3.5 h-3.5" /> بازگشت و ادامه خرید
              </button>
            </div>
          </aside>

          {/* LEFT pane (in RTL): Cart items */}
          <section className="bg-white flex flex-col min-h-0 min-w-0">
            <header className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-secondary/30 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingCart className="w-5 h-5 text-brand shrink-0" />
                <h3 className="font-extrabold text-brand-dark truncate">خلاصه سفارش</h3>
                {lines.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand text-xs font-bold font-num shrink-0">
                    {faNumber(lines.length)} قلم
                  </span>
                )}
              </div>
              {lines.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearCart}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5 h-8 text-xs shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">خالی کردن</span>
                </Button>
              )}
            </header>

            <div className="flex-1 overflow-y-auto scroll-slim p-2 sm:p-3">
              <AnimatePresence initial={false}>
                {lines.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 sm:py-16 text-center"
                  >
                    <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-bold text-brand-dark mb-1">سبد خرید خالی است</p>
                    <p className="text-xs text-muted-foreground">برای صدور فاکتور، ابتدا کالاها را انتخاب کنید.</p>
                  </motion.div>
                ) : (
                  <motion.div layout className="space-y-2">
                    {lines.map((l) => (
                      <CartLineItem
                        key={l.product.id}
                        line={l}
                        onDec={() => decrement(l.product.id)}
                        onInc={() => addToCart(l.product, +1)}
                        onRemove={() => useStore.getState().removeFromCart(l.product.id)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {lines.length > 0 && (
              <footer className="border-t border-border p-3 sm:p-4 bg-secondary/40 shrink-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">جمع کل اقلام</span>
                  <span className="font-num font-extrabold text-brand-dark text-base sm:text-lg">{faToman(total)}</span>
                </div>
              </footer>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CartLineItem({
  line,
  onDec,
  onInc,
  onRemove,
}: {
  line: { product: { id: string; name: string; price: number; category?: string }; quantity: number };
  onDec: () => void;
  onInc: () => void;
  onRemove: () => void;
}) {
  const p = line.product;
  const qty = line.quantity;
  const subtotal = qty * p.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="rounded-xl border border-border bg-white p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:border-brand/30 transition-colors"
    >
      <div className="grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-lavender to-secondary text-brand-dark shrink-0">
        <span className="font-num text-xs font-extrabold">{faNumber(qty)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-brand-dark text-xs sm:text-sm leading-snug truncate">{p.name}</p>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
          <span className="font-num">{faNumber(p.price)}</span>
          <span className="text-amber">×</span>
          <span className="font-num">{faNumber(qty)}</span>
          <span className="text-amber mx-0.5">=</span>
          <span className="font-num font-bold text-brand-dark">{faNumber(subtotal)}</span>
          <span className="text-[9px]">تومان</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDec}
          aria-label="کاهش"
          className="grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition active:scale-95"
        >
          {qty === 1 ? <X className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onInc}
          aria-label="افزایش"
          className="grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-brand text-white hover:bg-brand-dark transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function Field({ label, required, icon, children }: { label: string; required?: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold flex items-center gap-1.5 text-white/90">
        {icon && <span className="text-amber">{icon}</span>}
        {label}
        {required && <span className="text-coral mr-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
