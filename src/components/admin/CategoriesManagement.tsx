"use client";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Library, Plus, Pencil, Trash2, Loader2, Check, Search } from "lucide-react";
import type { Category } from "@/lib/types";
import { api } from "@/services/api";
import { faNumber } from "@/lib/persian";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  categories: Category[];
}

export function CategoriesManagement({ categories }: Props) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const triggerRefresh = useStore((s) => s.triggerRefresh);

  const filtered = categories.filter((c) => c.name.includes(q.trim()));

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(c: Category) { setEditing(c); setOpen(true); }

  async function remove(c: Category) {
    if (!confirm(`حذف دسته «${c.name}»؟ این عمل قابل بازگشت نیست.`)) return;
    try {
      await api.deleteCategory(c.id);
      triggerRefresh();
      toast.success(`دسته «${c.name}» حذف شد`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white overflow-hidden">
      <header className="flex items-center justify-between gap-2 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-brand" />
          <h2 className="font-extrabold text-brand-dark">مدیریت دسته‌بندی‌ها</h2>
          <span className="text-xs text-muted-foreground">({faNumber(categories.length)} دسته)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو…"
              className="h-9 w-36 pr-9 text-xs"
            />
          </div>
          <Button onClick={openNew} className="h-9 bg-brand hover:bg-brand-dark gap-1.5">
            <Plus className="w-4 h-4" /> دسته جدید
          </Button>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {filtered.map((c) => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-white p-3 flex items-center gap-3"
          >
            <div className="grid place-items-center w-11 h-11 rounded-lg bg-gradient-to-br from-lavender to-secondary text-brand-dark shrink-0">
              <Library className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-brand-dark truncate">{c.name}</div>
              <div className="text-[11px] text-muted-foreground font-num">
                {faNumber(c.product_count ?? 0)} کالا · {c.status}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEdit(c)}
                className="grid place-items-center w-8 h-8 rounded-md text-brand hover:bg-lavender"
                aria-label="ویرایش"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => remove(c)}
                className="grid place-items-center w-8 h-8 rounded-md text-rose-600 hover:bg-rose-50"
                aria-label="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-10 text-center text-muted-foreground text-sm">
            دسته‌بندی یافت نشد.
          </div>
        )}
      </div>

      <CategoryFormDialog
        open={open}
        onOpenChange={setOpen}
        category={editing}
        onSaved={() => triggerRefresh()}
      />
    </section>
  );
}

function CategoryFormDialog({
  open, onOpenChange, category, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: Category | null;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("فعال");

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setStatus(category?.status ?? "فعال");
    }
  }, [open, category]);

  async function save() {
    if (!name.trim()) { toast.error("نام دسته الزامی است"); return; }
    setBusy(true);
    try {
      if (category) {
        await api.updateCategory(category.id, { name: name.trim(), status });
        toast.success("دسته به‌روزرسانی شد");
      } else {
        await api.createCategory({ name: name.trim(), status });
        toast.success("دسته جدید ایجاد شد");
      }
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
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-dark">
            <Library className="w-5 h-5 text-brand" />
            {category ? "ویرایش دسته" : "افزودن دسته جدید"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {category
              ? "نام یا وضعیت دسته را تغییر دهید. در صورت تغییر نام، تمام کالاهای مرتبط هم به‌روزرسانی می‌شوند."
              : "دسته جدیدی برای کاتالوگ اضافه کنید."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">نام دسته</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: اسباب‌بازی" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={status === "فعال"} onCheckedChange={(c) => setStatus(c ? "فعال" : "غیرفعال")} />
            <Label className="text-xs font-bold">وضعیت: {status}</Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>انصراف</Button>
          <Button onClick={save} disabled={busy} className="bg-brand hover:bg-brand-dark gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {category ? "ذخیره" : "ایجاد دسته"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
