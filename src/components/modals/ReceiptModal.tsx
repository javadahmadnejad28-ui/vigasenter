"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Printer, Copy, MessageCircle, X, Receipt as ReceiptIcon, Hash,
} from "lucide-react";
import type { Invoice, InvoiceItem } from "@/lib/types";
import { faToman, faNumber, formatJalaliDateTime, formatJalaliShort, jalaliYearFa } from "@/lib/persian";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

export function ReceiptModal({ invoice, onClose }: Props) {
  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden max-h-[95vh] sm:max-h-[90vh]" dir="rtl">
        <DialogTitle className="sr-only">رسید {invoice?.invoice_no}</DialogTitle>
        <DialogDescription className="sr-only">رسید صادر شده برای مشتری</DialogDescription>
        {invoice && <ReceiptBody invoice={invoice} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ReceiptBody({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const isProforma = invoice.type === "پیش‌فاکتور";
  const [copied, setCopied] = useState(false);
  const text = buildWhatsappText(invoice);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("متن رسید در کلیپ‌بورد کپی شد");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("امکان کپی نبود؛ متن را به‌صورت دستی انتخاب کنید");
    }
  }
  function printReceipt() { window.print(); }
  function openWhatsapp() {
    const phone = (invoice.customer_phone || "").replace(/[^0-9]/g, "");
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
      {/* Header bar (modal-only, hidden on print) */}
      <div className="no-print flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-secondary/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${isProforma ? "bg-amber/20 text-amber-700" : "bg-brand/15 text-brand"}`}>
            <ReceiptIcon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-extrabold text-brand-dark text-sm truncate">
              {isProforma ? "پیش‌فاکتور" : "فاکتور فروش"}
            </h2>
            <p className="text-[11px] text-muted-foreground font-num truncate">{invoice.invoice_no}</p>
          </div>
        </div>
        <button onClick={onClose} className="grid place-items-center w-9 h-9 rounded-lg hover:bg-border shrink-0" aria-label="بستن">
          <X className="w-5 h-5 text-brand-dark" />
        </button>
      </div>

      {/* Receipt body — scrollable on mobile */}
      <div id="receipt-print" className="p-4 sm:p-8 bg-white text-brand-dark overflow-y-auto scroll-slim flex-1">
        {/* Letterhead */}
        <header className="flex items-start justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b-2 border-brand">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="grid place-items-center w-11 h-11 sm:w-14 sm:h-14 rounded-xl brand-gradient text-white shrink-0">
              <ReceiptIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark">ویجاسنتر</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">مرکز فروش و انبار</p>
            </div>
          </div>
          <div className="text-left shrink-0">
            <div className={`inline-flex items-center px-2 py-1 sm:px-3 rounded-md text-[10px] sm:text-xs font-bold ${isProforma ? "bg-amber text-brand-dark" : "bg-brand-dark text-white"}`}>
              {isProforma ? "پیش‌فاکتور" : "فاکتور"}
            </div>
            <div className="mt-1 sm:mt-2 font-num text-xs sm:text-sm font-bold text-brand-dark">{invoice.invoice_no}</div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground font-num">{formatJalaliDateTime(new Date(invoice.created_at))}</div>
          </div>
        </header>

        {/* Customer info — 2 cols on mobile, 4 on desktop */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 py-3 sm:py-5 border-b border-border">
          <Info label="نام مشتری" value={invoice.customer_name} />
          <Info label="شماره تماس" value={invoice.customer_phone || "—"} mono />
          <Info label="فروشنده" value={invoice.seller} />
          <Info label="تاریخ صدور" value={formatJalaliShort(new Date(invoice.created_at))} mono />
        </section>

        {/* Items — CARDS on mobile, TABLE on desktop+print */}
        <section className="py-3 sm:py-5">
          <h2 className="text-sm font-bold text-brand-dark mb-2 sm:mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-brand rounded-full" /> اقلام فاکتور
          </h2>

          {/* Desktop / print view */}
          <table className="w-full text-sm border-collapse hidden sm:table">
            <thead>
              <tr className="bg-brand-dark text-white text-xs">
                <th className="text-right py-2.5 px-3 font-bold rounded-r-lg">ردیف</th>
                <th className="text-right py-2.5 px-3 font-bold">شرح کالا</th>
                <th className="text-center py-2.5 px-3 font-bold w-16">تعداد</th>
                <th className="text-left py-2.5 px-3 font-bold w-32">قیمت واحد</th>
                <th className="text-left py-2.5 px-3 font-bold w-32 rounded-l-lg">مبلغ کل</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, idx) => (
                <tr key={it.id} className="border-b border-border">
                  <td className="py-2.5 px-3 font-num text-muted-foreground">{faNumber(idx + 1)}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-brand-dark">{it.name}</div>
                    <div className="text-[10px] text-muted-foreground font-num">کد: {it.id}</div>
                  </td>
                  <td className="text-center font-num py-2.5 px-3">{faNumber(it.quantity)}</td>
                  <td className="text-left font-num py-2.5 px-3 text-xs">{faNumber(it.price)}</td>
                  <td className="text-left font-num py-2.5 px-3 font-bold">{faNumber(it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-lavender">
                <td colSpan={4} className="py-3 px-3 text-right font-extrabold text-brand-dark">مبلغ قابل پرداخت</td>
                <td className="text-left py-3 px-3 font-num font-extrabold text-brand text-lg">
                  {faNumber(invoice.total)}
                  <span className="text-[10px] text-muted-foreground block font-normal">تومان</span>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Mobile view — cards */}
          <div className="sm:hidden space-y-2">
            {invoice.items.map((it, idx) => (
              <ItemCard key={it.id} item={it} idx={idx} />
            ))}
            {/* Total */}
            <div className="rounded-lg bg-lavender p-3 flex items-center justify-between">
              <span className="text-sm font-extrabold text-brand-dark">مبلغ قابل پرداخت</span>
              <div className="text-left">
                <div className="font-num font-extrabold text-brand text-lg leading-none">{faNumber(invoice.total)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">تومان</div>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="py-3 sm:py-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">توضیحات:</div>
          <div className="text-xs text-brand-dark leading-relaxed min-h-[3rem]">
            {isProforma
              ? "این پیش‌فاکتور صرفاً رزرو موجودی است و کالا هنوز فروش قطعی نشده است. موجودی تا زمان صدور فاکتور نهایی رزرو خواهد ماند."
              : "این فاکتور فروش قطعی بوده و موجودی کالا از انبار کسر شده است. کالاها توسط مشتری تحویل گرفته شده‌اند."}
          </div>
        </section>

        {/* Signatures */}
        <section className="grid grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6">
          <div className="text-center">
            <div className="border-t border-dashed border-brand-dark/40 pt-1 text-xs text-muted-foreground">مهر و امضای فروشنده</div>
          </div>
          <div className="text-center">
            <div className="border-t border-dashed border-brand-dark/40 pt-1 text-xs text-muted-foreground">امضای مشتری</div>
          </div>
        </section>

        <footer className="mt-4 sm:mt-6 pt-3 border-t border-border text-center text-[10px] text-muted-foreground">
          فروشگاه ویجاسنتر · سال {jalaliYearFa()} · سامانه مدیریت موجودی و فاکتور
        </footer>
      </div>

      {/* Actions (modal-only) */}
      <div className="border-t border-border p-2 sm:p-3 flex gap-1.5 sm:gap-2 bg-secondary/40 no-print shrink-0">
        <Button onClick={printReceipt} variant="outline" className="flex-1 h-10 sm:h-11 gap-1.5 text-xs sm:text-sm">
          <Printer className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">چاپ A4</span>
          <span className="xs:hidden sm:hidden">چاپ</span>
        </Button>
        <Button onClick={copyText} variant="outline" className="flex-1 h-10 sm:h-11 gap-1.5 text-xs sm:text-sm">
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "کپی شد" : "کپی متن"}</span>
        </Button>
        <Button onClick={openWhatsapp} className="flex-1 h-10 sm:h-11 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm">
          <MessageCircle className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">واتساپ</span>
          <span className="xs:hidden sm:hidden">ارسال</span>
        </Button>
      </div>
    </div>
  );
}

function ItemCard({ item, idx }: { item: InvoiceItem; idx: number }) {
  const subtotal = item.price * item.quantity;
  return (
    <div className="rounded-lg border border-border bg-white p-2.5">
      <div className="flex items-start gap-2">
        <div className="grid place-items-center w-8 h-8 rounded-md bg-secondary text-brand-dark shrink-0">
          <span className="font-num text-xs font-bold">{faNumber(idx + 1)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-brand-dark text-sm leading-snug">{item.name}</div>
          <div className="text-[10px] text-muted-foreground font-num mt-0.5">کد: {item.id}</div>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3 h-3 text-muted-foreground" />
          <span className="font-num text-brand-dark font-bold">{faNumber(item.quantity)}</span>
          <span className="text-muted-foreground">عدد</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="font-num">{faNumber(item.price)}</span>
          <span>×</span>
          <span className="font-num">{faNumber(item.quantity)}</span>
          <span className="text-amber">=</span>
        </div>
        <div className="text-left">
          <span className="font-num font-bold text-brand-dark">{faNumber(subtotal)}</span>
          <span className="text-[9px] text-muted-foreground mr-1">تومان</span>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-xs sm:text-sm font-bold text-brand-dark ${mono ? "font-num" : ""} truncate`}>{value}</div>
    </div>
  );
}

function buildWhatsappText(inv: Invoice): string {
  const lines: string[] = [];
  lines.push(inv.type === "پیش‌فاکتور" ? "*پیش‌فاکتور فروش*" : "*فاکتور فروش*");
  lines.push(`شماره: ${inv.invoice_no}`);
  lines.push(`مشتری: ${inv.customer_name}`);
  if (inv.customer_phone) lines.push(`تماس: ${inv.customer_phone}`);
  lines.push(`فروشنده: ${inv.seller}`);
  lines.push(`تاریخ: ${formatJalaliDateTime(new Date(inv.created_at))}`);
  lines.push("");
  lines.push("🛒 *اقلام:*");
  for (const it of inv.items) {
    lines.push(`• ${it.name}`);
    lines.push(`   ${toFa(it.quantity)} عدد × ${toFa(it.price)} = ${toFa(it.price * it.quantity)}`);
  }
  lines.push("");
  lines.push(`*مبلغ کل: ${toFa(inv.total)} تومان*`);
  lines.push("");
  lines.push("— فروشگاه ویجاسنتر");
  return lines.join("\n");
}
function toFa(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
}

export { motion };
