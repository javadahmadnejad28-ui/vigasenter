"use client";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Users, UserPlus, Trash2, Loader2, Shield, KeyRound, User, AtSign, Lock,
} from "lucide-react";
import type { Manager } from "@/lib/types";
import { api } from "@/services/api";
import { faNumber, formatJalaliShort } from "@/lib/persian";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ManagersPanel() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const refreshTick = useStore((s) => s.refreshTick);
  const session = useStore((s) => s.session);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      api.listManagers()
        .then((m) => { if (!cancelled) setManagers(m); })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [refreshTick]);

  async function remove(m: Manager) {
    if (m.role === "master") { toast.error("مدیر کل قابل حذف نیست"); return; }
    if (!confirm(`حذف کاربر «${m.display_name}»؟`)) return;
    try {
      await api.deleteManager(m.id);
      useStore.getState().triggerRefresh();
      toast.success(`کاربر «${m.display_name}» حذف شد`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white overflow-hidden">
      <header className="flex items-center justify-between gap-2 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand" />
          <h2 className="font-extrabold text-brand-dark">کاربران و مدیران</h2>
          <span className="text-xs text-muted-foreground">({faNumber(managers.length)} کاربر)</span>
        </div>
        <div className="flex items-center gap-2">
          {session?.type === "master" && (
            <Button variant="outline" onClick={() => setPinOpen(true)} className="h-9 gap-1.5">
              <KeyRound className="w-4 h-4 text-amber" /> تغییر رمز ورود
            </Button>
          )}
          <Button onClick={() => setOpen(true)} className="h-9 bg-brand hover:bg-brand-dark gap-1.5">
            <UserPlus className="w-4 h-4" /> مدیر جدید
          </Button>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {pending && managers.length === 0 ? (
          <div className="col-span-full py-10 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> در حال بارگذاری…
          </div>
        ) : managers.length === 0 ? (
          <div className="col-span-full py-10 text-center text-muted-foreground text-sm">
            کاربری تعریف نشده است.
          </div>
        ) : (
          managers.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-white p-3 flex items-center gap-3"
            >
              <div className={`grid place-items-center w-11 h-11 rounded-lg shrink-0 ${
                m.role === "master" ? "bg-amber text-brand-dark" : "bg-gradient-to-br from-lavender to-secondary text-brand-dark"
              }`}>
                {m.role === "master" ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-brand-dark truncate">{m.display_name}</div>
                <div className="text-[11px] text-muted-foreground font-num truncate">@{m.username}</div>
                <div className="text-[10px] text-muted-foreground">
                  {m.role === "master" ? "مدیر کل" : "مدیر"} · {m.created_at ? formatJalaliShort(new Date(m.created_at)) : "—"}
                </div>
              </div>
              {m.role !== "master" && (
                <button
                  onClick={() => remove(m)}
                  className="grid place-items-center w-8 h-8 rounded-md text-rose-600 hover:bg-rose-50"
                  aria-label="حذف کاربر"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>

      <CreateManagerDialog open={open} onOpenChange={setOpen} />
      <ChangePinDialog open={pinOpen} onOpenChange={setPinOpen} />
    </section>
  );
}

function CreateManagerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const triggerRefresh = useStore((s) => s.triggerRefresh);

  useEffect(() => {
    if (open) {
      setDisplayName(""); setUsername(""); setPassword("");
    }
  }, [open]);

  async function save() {
    if (!displayName.trim() || !username.trim() || !password) {
      toast.error("همه فیلدها الزامی هستند");
      return;
    }
    if (password.length < 4) {
      toast.error("گذرواژه باید حداقل ۴ کاراکتر باشد");
      return;
    }
    setBusy(true);
    try {
      await api.createManager({
        username: username.trim(),
        password,
        display_name: displayName.trim(),
      });
      toast.success(`مدیر «${displayName}» با موفقیت ایجاد شد`);
      triggerRefresh();
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
            <UserPlus className="w-5 h-5 text-brand" />
            افزودن مدیر جدید
          </DialogTitle>
          <DialogDescription className="text-xs">
            مدیر جدید با نام کاربری و گذرواژه می‌تواند وارد پنل مدیریت شود. اطلاعات کاربر را برای ایشان ارسال کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="نام نمایشی" icon={<User className="w-3.5 h-3.5" />}>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="مثلاً: سارا محمدی" />
          </Field>
          <Field label="نام کاربری" icon={<AtSign className="w-3.5 h-3.5" />}>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="sara" className="font-num" dir="ltr" />
          </Field>
          <Field label="گذرواژه" icon={<Lock className="w-3.5 h-3.5" />}>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="حداقل ۴ کاراکتر" dir="ltr" />
          </Field>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>انصراف</Button>
          <Button onClick={save} disabled={busy} className="bg-brand hover:bg-brand-dark gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            ایجاد مدیر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangePinDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    if (open) { setCurrent(""); setNewPin(""); setConfirmPin(""); }
  }, [open]);

  async function save() {
    if (!current || !newPin || !confirmPin) { toast.error("هر سه فیلد را پر کنید"); return; }
    if (newPin !== confirmPin) { toast.error("رمز جدید و تأیید آن یکسان نیست"); return; }
    if (!/^\d{4,8}$/.test(newPin)) { toast.error("رمز جدید باید ۴ تا ۸ رقم باشد"); return; }
    setBusy(true);
    try {
      await api.changePin(current, newPin);
      toast.success("رمز ورود با موفقیت تغییر کرد");
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
            <KeyRound className="w-5 h-5 text-amber" />
            تغییر رمز ورود به پنل
          </DialogTitle>
          <DialogDescription className="text-xs">
            این رمز همان رمزی است که در صفحه ورود برای دسترسی سریع مدیر کل استفاده می‌شود (پیش‌فرض: ۱۲۳۴).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="رمز فعلی" icon={<Lock className="w-3.5 h-3.5" />}>
            <Input value={current} onChange={(e) => setCurrent(e.target.value)} type="password" inputMode="numeric" dir="ltr" className="font-num" />
          </Field>
          <Field label="رمز جدید (۴ تا ۸ رقم)" icon={<KeyRound className="w-3.5 h-3.5" />}>
            <Input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" className="font-num" maxLength={8} />
          </Field>
          <Field label="تکرار رمز جدید" icon={<KeyRound className="w-3.5 h-3.5" />}>
            <Input value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" className="font-num" maxLength={8} />
          </Field>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>انصراف</Button>
          <Button onClick={save} disabled={busy} className="bg-brand hover:bg-brand-dark gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            تغییر رمز
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold flex items-center gap-1.5 text-brand-dark">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
      </Label>
      {children}
    </div>
  );
}
