"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Search, Bell, LayoutDashboard, Store, LogOut, Library, FileText, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatJalaliLong, faClock } from "@/lib/persian";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const setChangesOpen = useStore((s) => s.setChangesOpen);
  const setCategoriesModalOpen = useStore((s) => s.setCategoriesModalOpen);
  const setMyInvoicesOpen = useStore((s) => s.setMyInvoicesOpen);
  const badge = useStore((s) => s.changesBadge);
  const session = useStore((s) => s.session);
  const logout = useStore((s) => s.logout);
  const [now, setNow] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // On mobile, the search field collapses into an expandable button
  // On desktop, the search field is always inline.

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-7xl px-2 sm:px-5">
        {/* Row 1 — main bar (logo + actions) */}
        <div className="flex items-center gap-2 h-14 sm:h-16">
          {/* Logo */}
          <button
            onClick={() => setView("store")}
            className="flex items-center gap-2 group shrink-0"
            aria-label="ویجاسنتر"
          >
            <span className="grid place-items-center w-10 h-10 rounded-xl brand-gradient text-white shadow-lg shadow-brand/30 group-active:scale-95 transition">
              <Sparkles className="w-5 h-5" />
            </span>
            <div className="hidden md:flex flex-col leading-tight text-right">
              <span className="text-base font-extrabold text-brand-dark">ویجاسنتر</span>
              <span className="text-[10px] text-muted-foreground">مرکز فروش و انبار</span>
            </div>
          </button>

          {/* Search — always visible on sm+, on mobile it's a button */}
          <div className="relative flex-1 max-w-xl hidden sm:block">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی کالا، کد محصول یا دسته‌بندی…"
              className="w-full h-10 pr-10 pl-9 rounded-xl bg-secondary/70 border border-transparent focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none text-sm transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="پاک کردن جستجو"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-coral text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Spacer on mobile when search is closed */}
          <div className="flex-1 sm:hidden" />

          {/* Right cluster — always visible */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile search toggle */}
            {view === "store" && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSearchOpen((v) => !v)}
                className="rounded-xl h-10 w-10 border-border bg-white sm:hidden"
                aria-label="جستجو"
              >
                <Search className="w-4 h-4 text-brand-dark" />
              </Button>
            )}

            {/* Live clock — desktop */}
            <div className="hidden xl:flex flex-col items-end leading-tight px-3 py-1.5 rounded-xl bg-secondary/70">
              <span className="text-[11px] text-muted-foreground">امروز</span>
              <span className="text-[12px] font-bold text-brand-dark">{formatJalaliLong(now)}</span>
            </div>
            <span className="hidden xl:inline-flex h-10 items-center px-3 rounded-xl bg-brand-dark text-white text-xs font-bold tabular-nums">
              {faClock(now)}
            </span>

            {/* Categories modal trigger (storefront only) */}
            {view === "store" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoriesModalOpen(true)}
                className="rounded-xl h-10 gap-1.5 border-border bg-white"
              >
                <Library className="w-4 h-4 text-brand" />
                <span className="hidden md:inline">دسته‌بندی‌ها</span>
              </Button>
            )}

            {/* My invoices (seller proforma list — storefront only) */}
            {view === "store" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMyInvoicesOpen(true)}
                className="rounded-xl h-10 gap-1.5 border-border bg-white"
              >
                <FileText className="w-4 h-4 text-amber" />
                <span className="hidden md:inline">فاکتورهای من</span>
              </Button>
            )}

            {/* Changes */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setChangesOpen(true)}
              className="relative rounded-xl h-10 w-10 border-border bg-white"
              aria-label="تغییرات اخیر"
            >
              <Bell className="w-4 h-4 text-brand-dark" />
              {badge > 0 && (
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-coral text-white text-[10px] font-bold"
                >
                  {badge > 9 ? "۹+" : badge}
                </motion.span>
              )}
            </Button>

            {/* View toggle */}
            <Button
              size="sm"
              onClick={() => setView(view === "store" ? "admin" : "store")}
              className="rounded-xl h-10 gap-1.5 bg-brand hover:bg-brand-dark text-white shadow-md shadow-brand/20"
            >
              {view === "store" ? (
                <>
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden lg:inline">پنل مدیریت</span>
                </>
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  <span className="hidden lg:inline">بازگشت به فروشگاه</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile search row (expanded) */}
        <AnimatePresence>
          {searchOpen && view === "store" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden sm:hidden"
            >
              <div className="relative pb-3 pt-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-2" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی کالا، کد محصول یا دسته‌بندی…"
                  className="w-full h-11 pr-10 pl-10 rounded-xl bg-secondary/70 border border-transparent focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none text-sm transition"
                />
                <button
                  onClick={() => { setSearch(""); setSearchOpen(false); }}
                  aria-label="بستن جستجو"
                  className="absolute left-3 top-1/2 -translate-y-1/2 mt-2 text-muted-foreground hover:text-coral"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin session badge row — full-width on mobile */}
        {view === "admin" && session && (
          <div className="flex items-center justify-end pb-2 sm:pb-0 sm:hidden">
            <div className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-lavender text-brand-dark text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {session.displayName}
              <button
                onClick={logout}
                aria-label="خروج"
                className="grid place-items-center w-6 h-6 rounded-md hover:bg-brand/10 text-brand"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Desktop session badge — top right */}
        {view === "admin" && session && (
          <div className="hidden sm:flex absolute left-5 top-3 items-center gap-1.5 h-9 px-3 rounded-xl bg-lavender text-brand-dark text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {session.displayName}
            <button
              onClick={logout}
              aria-label="خروج"
              className="grid place-items-center w-6 h-6 rounded-md hover:bg-brand/10 text-brand"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
