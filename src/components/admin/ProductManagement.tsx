"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Minus, Loader2, PackagePlus, Search, Hash, Filter, X, Check, Library } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { api } from "@/services/api";
import { faToman, faNumber } from "@/lib/persian";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { StockBadge } from "@/components/shared/StockBadge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  products: Product[];
  categories: Category[];
}

export function ProductManagement({ products, categories }: Props) {
  const [search, setSearch] = useState("");
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const triggerRefresh = useStore((s) => s.triggerRefresh);

  // Match across ALL categories: name, code, OR category name.
  // Multi-category filter: union of selected categories (or all if none selected).
  const filtered = products.filter((p) => {
    const matchesSearch = !search.trim()
      || p.name.includes(search.trim())
      || p.id.toLowerCase().includes(search.toLowerCase())
      || p.category.includes(search.trim());
    const matchesCat = activeCats.length === 0 || activeCats.includes(p.category);
    return matchesSearch && matchesCat;
  });

  function toggleCat(name: string) {
    setActiveCats((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  }

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(p: Product) { setEditing(p); setOpen(true); }

  async function quickAdjust(p: Product, delta: number) {
    try {
      const r = await api.adjustStock(p.id, delta);
      useStore.getState().pushRecentChange(r.change.id);
      triggerRefresh();
      toast.success(
        delta > 0
          ? `${faNumber(delta)} عدد به موجودی «${p.name}» افزوده شد`
          : `${faNumber(-delta)} عدد از موجودی «${p.name}» کسر شد`,
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-brand" />
          <h2 className="font-extrabold text-brand-dark">مدیریت محصولات و موجودی</h2>
          <span className="text-xs text-muted-foreground">({faNumber(filtered.length)} از {faNumber(products.length)} کالا)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام، کد یا دسته…"
              className="h-9 w-48 pr-9 text-xs"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setCatModalOpen(true)}
            className={cn("h-9 gap-1.5", activeCats.length > 0 && "bg-lavender border-brand")}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">دسته‌ها</span>
            {activeCats.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-brand text-white text-[10px] font-bold font-num">
                {faNumber(activeCats.length)}
              </span>
            )}
          </Button>
          <Button onClick={openNew} className="h-9 bg-brand hover:bg-brand-dark gap-1.5">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">کالای جدید</span>
          </Button>
        </div>
      </header>

      {/* Active filters chip-row (visible only when filtering) */}
      {activeCats.length > 0 && (
        <div className="border-b border-border bg-secondary/30 px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0">دسته‌های فعال:</span>
          {activeCats.map((name) => (
            <button
              key={name}
              onClick={() => toggleCat(name)}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-brand text-white text-[11px] font-bold hover:bg-brand-dark"
            >
              {name}
              <X className="w-3 h-3" />
            </button>
          ))}
          <button
            onClick={() => setActiveCats([])}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold hover:bg-rose-100"
          >
            <X className="w-3 h-3" /> پاک کردن همه
          </button>
        </div>
      )}

      <div className="overflow-x-auto scroll-slim">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/70 text-brand-dark text-xs">
              <th className="text-right py-2 px-3 font-bold">کالا</th>
              <th className="text-center py-2 px-3 font-bold">دسته</th>
              <th className="text-center py-2 px-3 font-bold">موجودی</th>
              <th className="text-left py-2 px-3 font-bold">قیمت</th>
              <th className="text-center py-2 px-3 font-bold">وضعیت</th>
              <th className="text-center py-2 px-3 font-bold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filtered.map((p, idx) => (
                <motion.tr
                  key={p.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`border-t border-border ${idx % 2 ? "bg-secondary/20" : "bg-white"} hover:bg-lavender/40`}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="grid place-items-center w-10 h-10 rounded-lg bg-gradient-to-br from-lavender to-secondary text-brand-dark shrink-0">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-brand-dark truncate max-w-[260px]">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-num">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="px-2 py-1 rounded-md bg-lavender text-brand-dark text-[11px] font-bold">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => quickAdjust(p, -1)}
                        className="grid place-items-center w-7 h-7 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                        aria-label="کاهش موجودی"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-center min-w-[3rem]">
                        <div className="font-num font-bold text-brand-dark text-sm">{faNumber(p.stock)}</div>
                        <div className="text-[10px] text-muted-foreground font-num">رزرو: {faNumber(p.reserved)}</div>
                      </div>
                      <button
                        onClick={() => quickAdjust(p, +1)}
                        className="grid place-items-center w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                        aria-label="افزایش موجودی"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="text-left font-num py-2 px-3 text-brand-dark font-bold">{faToman(p.price)}</td>
                  <td className="text-center py-2 px-3">
                    <StockBadge stock={p.stock} reserved={p.reserved} variant="compact" />
                  </td>
                  <td className="text-center py-2 px-3">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="h-8 gap-1">
                      <Pencil className="w-3.5 h-3.5" /> ویرایش
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground text-sm">
                  کالایی با این فیلتر یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductFormDialog
        open={open}
        onOpenChange={setOpen}
        product={editing}
        categories={categories}
        onSaved={() => triggerRefresh()}
      />

      <CategoryFilterModal
        open={catModalOpen}
        onOpenChange={setCatModalOpen}
        categories={categories}
        activeCats={activeCats}
        onToggle={toggleCat}
        onClear={() => setActiveCats([])}
      />
    </section>
  );
}

// ----- Category filter modal with live search -----
function CategoryFilterModal({
  open,
  onOpenChange,
  categories,
  activeCats,
  onToggle,
  onClear,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: Category[];
  activeCats: string[];
  onToggle: (name: string) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = categories.filter((c) => c.name.includes(q.trim()));
  const totalProducts = categories.reduce((s, c) => s + (c.product_count ?? 0), 0);

  function handleOpenChange(o: boolean) {
    if (!o) setQ("");
    onOpenChange(o);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh]" dir="rtl">
        <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-border bg-gradient-to-l from-lavender to-white">
          <DialogTitle className="flex items-center gap-2 text-brand-dark">
            <Library className="w-5 h-5 text-brand" />
            فیلتر بر اساس دسته‌بندی
          </DialogTitle>
          <DialogDescription className="text-xs">
            یک یا چند دسته را انتخاب کنید تا فقط کالاهای آن دسته‌ها نمایش داده شوند.
          </DialogDescription>
        </DialogHeader>

        {/* Search bar */}
        <div className="p-3 border-b border-border bg-secondary/40">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی دسته‌بندی…"
              className="w-full h-11 pr-10 pl-3 rounded-xl bg-white border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm transition"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                aria-label="پاک کردن جستجو"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-coral"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* "All categories" tile */}
        <div className="p-3 max-h-[55vh] overflow-y-auto scroll-slim">
          <button
            onClick={() => { onClear(); onOpenChange(false); }}
            className={cn(
              "w-full mb-3 flex items-center gap-3 p-3 rounded-xl border transition-colors text-right",
              activeCats.length === 0
                ? "border-brand bg-lavender"
                : "border-border bg-white hover:bg-lavender/40",
            )}
          >
            <div className={cn(
              "grid place-items-center w-11 h-11 rounded-xl shrink-0",
              activeCats.length === 0 ? "bg-brand text-white" : "bg-secondary text-brand-dark",
            )}>
              <Library className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-brand-dark">همه دسته‌ها</div>
              <div className="text-[11px] text-muted-foreground font-num">{faNumber(totalProducts)} کالا</div>
            </div>
            {activeCats.length === 0 && <Check className="w-5 h-5 text-brand" />}
          </button>

          {/* Categories list */}
          <div className="grid sm:grid-cols-2 gap-2">
            {filtered.map((c) => {
              const active = activeCats.includes(c.name);
              return (
                <button
                  key={c.id}
                  onClick={() => onToggle(c.name)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-colors text-right",
                    active
                      ? "border-brand bg-lavender"
                      : "border-border bg-white hover:bg-lavender/40",
                  )}
                >
                  <div className={cn(
                    "grid place-items-center w-11 h-11 rounded-xl shrink-0",
                    active ? "bg-brand text-white" : "bg-secondary text-brand-dark",
                  )}>
                    <Library className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-dark truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground font-num">{faNumber(c.product_count ?? 0)} کالا</div>
                  </div>
                  {active && <Check className="w-5 h-5 text-brand shrink-0" />}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-muted-foreground text-sm">
              دسته‌بندی با این نام یافت نشد.
            </div>
          )}
        </div>

        {/* Footer — selected count + apply */}
        <div className="border-t border-border p-3 bg-secondary/40 flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {activeCats.length === 0 ? (
              <span>هیچ دسته‌ای انتخاب نشده · نمایش همه</span>
            ) : (
              <span><b className="font-num text-brand-dark">{faNumber(activeCats.length)}</b> دسته انتخاب شده</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCats.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClear} className="h-9 text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5">
                <X className="w-3.5 h-3.5" /> پاک کردن
              </Button>
            )}
            <Button size="sm" onClick={() => onOpenChange(false)} className="h-9 bg-brand hover:bg-brand-dark gap-1.5">
              <Check className="w-4 h-4" /> اعمال فیلتر
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductFormDialog({
  open, onOpenChange, product, categories, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("فعال");

  useEffect(() => {
    if (open) {
      setName(product?.name ?? "");
      setId(product?.id ?? "NEW-" + Math.random().toString(36).slice(2, 6).toUpperCase());
      setCategory(product?.category ?? categories[0]?.name ?? "");
      setPrice(product ? String(product.price) : "");
      setStock(product ? String(product.stock) : "");
      setStatus(product?.status ?? "فعال");
    }
  }, [open, product, categories]);

  async function save() {
    if (!name.trim() || !category) { toast.error("نام و دسته‌بندی الزامی است"); return; }
    setBusy(true);
    try {
      const payload = {
        id: product ? product.id : id,
        name: name.trim(),
        category,
        image_url: null,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        status,
      };
      const saved = await api.upsertProduct(payload);
      useStore.getState().pushRecentChange(Date.now());
      toast.success(product ? `کالای «${saved.name}» به‌روزرسانی شد` : `کالای «${saved.name}» ایجاد شد`);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-dark">
            <PackagePlus className="w-5 h-5 text-brand" />
            {product ? "ویرایش کالا" : "افزودن کالای جدید"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {product
              ? "تغییرات قیمت و موجودی به‌صورت خودکار در تاریخچه ثبت می‌شوند."
              : "کالای جدید را وارد کنید. پس از ثبت، یک رکورد ایجاد محصول در تاریخچه ذخیره می‌شود."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold">نام کالا</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: ماشین کنترلی تندرو X۹" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">دسته‌بندی</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب دسته" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">کد محصول</Label>
            <Input value={id} onChange={(e) => setId(e.target.value)} disabled={!!product} className="font-num" dir="ltr" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">قیمت (تومان)</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" inputMode="numeric" className="font-num" dir="ltr" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">موجودی کل</Label>
            <Input value={stock} onChange={(e) => setStock(e.target.value)} type="number" inputMode="numeric" className="font-num" dir="ltr" />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2 pt-1">
            <Switch checked={status === "فعال"} onCheckedChange={(c) => setStatus(c ? "فعال" : "غیرفعال")} />
            <Label className="text-xs font-bold">وضعیت: {status}</Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>انصراف</Button>
          <Button onClick={save} disabled={busy} className="bg-brand hover:bg-brand-dark gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {product ? "ذخیره تغییرات" : "ثبت کالا"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
