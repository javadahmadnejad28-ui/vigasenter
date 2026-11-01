"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Delete, ShieldCheck, User, Lock, Loader2, KeyRound } from "lucide-react";
import { api } from "@/services/api";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginGate({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"pin" | "manager">("pin");
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const setSession = useStore((s) => s.setSession);

  // Focus the pin input on mount
  useEffect(() => {
    if (mode === "pin") {
      const el = document.getElementById("pin-display");
      el?.focus();
    }
  }, [mode]);

  function pressDigit(d: string) {
    setPin((p) => (p.length < 8 ? p + d : p));
  }
  function backspace() {
    setPin((p) => p.slice(0, -1));
  }
  function clear() {
    setPin("");
  }

  async function submitPin() {
    if (pin.length < 4) { toast.error("رمز حداقل ۴ رقم است"); return; }
    // Convert Persian digits to Latin before sending — server hashes Latin "1234"
    const latinPin = pin.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    setBusy(true);
    try {
      const r = await api.checkPin(latinPin);
      setSession(r.user);
      toast.success("خوش آمدید!");
    } catch (e) {
      toast.error((e as Error).message);
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  async function submitManager() {
    if (!username.trim() || !password) { toast.error("نام کاربری و گذرواژه را وارد کنید"); return; }
    setBusy(true);
    try {
      const r = await api.loginManager(username.trim(), password);
      setSession(r.user);
      toast.success(`خوش آمدید ${r.user.displayName}!`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-brand-dark via-brand to-brand-dark grid place-items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-l from-brand-dark to-brand text-white p-6 text-center">
            <div className="inline-grid place-items-center w-16 h-16 rounded-2xl brand-gradient text-white shadow-lg shadow-amber/30 mx-auto mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold">ویجاسنتر</h1>
            <p className="text-white/70 text-xs mt-1">پنل مدیریت فروشندگان</p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-1 p-3 bg-secondary/40 border-b border-border">
            <button
              onClick={() => setMode("pin")}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                mode === "pin" ? "bg-brand text-white" : "bg-white text-brand-dark hover:bg-lavender"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> رمز مدیر
            </button>
            <button
              onClick={() => setMode("manager")}
              className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                mode === "manager" ? "bg-brand text-white" : "bg-white text-brand-dark hover:bg-lavender"
              }`}
            >
              <User className="w-3.5 h-3.5" /> ورود مدیر
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {mode === "pin" ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">رمز ۴ رقمی مدیر کل را وارد کنید</p>
                  <div
                    id="pin-display"
                    className="mt-3 h-14 rounded-xl bg-secondary/70 border-2 border-transparent focus-within:border-brand outline-none flex items-center justify-center gap-2 font-num text-2xl font-extrabold tracking-[0.5em] text-brand-dark"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (/\d/.test(e.key)) pressDigit(e.key);
                      else if (e.key === "Backspace") backspace();
                      else if (e.key === "Enter") submitPin();
                    }}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className={i < pin.length ? "" : "opacity-20"}>
                        {i < pin.length ? "●" : "○"}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Number pad */}
                <div className="grid grid-cols-3 gap-2">
                  {["۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"].map((d) => (
                    <motion.button
                      key={d}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => pressDigit(d)}
                      className="h-14 rounded-xl bg-white border border-border text-xl font-extrabold text-brand-dark hover:bg-lavender transition-colors font-num"
                    >
                      {d}
                    </motion.button>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={clear}
                    className="h-14 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors"
                  >
                    پاک کردن
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => pressDigit("۰")}
                    className="h-14 rounded-xl bg-white border border-border text-xl font-extrabold text-brand-dark hover:bg-lavender transition-colors font-num"
                  >
                    ۰
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={backspace}
                    className="h-14 rounded-xl bg-white border border-border text-brand-dark hover:bg-lavender transition-colors grid place-items-center"
                    aria-label="حذف"
                  >
                    <Delete className="w-5 h-5" />
                  </motion.button>
                </div>

                <Button
                  onClick={submitPin}
                  disabled={busy || pin.length < 4}
                  className="w-full h-12 bg-brand hover:bg-brand-dark text-base font-bold gap-2"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  ورود
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 text-brand-dark">
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> نام کاربری
                  </Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="font-num h-11"
                    dir="ltr"
                    onKeyDown={(e) => e.key === "Enter" && submitManager()}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 text-brand-dark">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" /> گذرواژه
                  </Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••"
                    className="font-num h-11"
                    dir="ltr"
                    onKeyDown={(e) => e.key === "Enter" && submitManager()}
                  />
                </div>
                <Button
                  onClick={submitManager}
                  disabled={busy}
                  className="w-full h-12 bg-brand hover:bg-brand-dark text-base font-bold gap-2"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5" />}
                  ورود
                </Button>
              </div>
            )}

            <button
              onClick={onBack}
              className="w-full mt-4 text-xs text-muted-foreground hover:text-brand-dark transition-colors"
            >
              بازگشت به فروشگاه
            </button>
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-4">
          ویجاسنتر · سامانه مدیریت موجودی و فاکتور
        </p>
      </motion.div>
    </main>
  );
}
