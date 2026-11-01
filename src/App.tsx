"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Store, LayoutDashboard, Loader2, Bell,
  Package, FileSignature, History, Library, Users,
} from "lucide-react";

import { api } from "@/services/api";
import type { Bootstrap, Invoice, Product } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { faNumber } from "@/lib/persian";

import { Topbar } from "@/components/catalog/Topbar";
import { CategoryCarousel } from "@/components/catalog/CategoryCarousel";
import { FilterBar, type StockFilter, type SortKey } from "@/components/catalog/FilterBar";
import { CatalogTable } from "@/components/catalog/CatalogTable";
import { CatalogCards } from "@/components/catalog/CatalogCards";
import { CartBar } from "@/components/catalog/CartBar";
import { InvoiceModal } from "@/components/modals/InvoiceModal";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { ChangesDrawer } from "@/components/modals/ChangesDrawer";
import { CategoriesModal } from "@/components/modals/CategoriesModal";
import { MyInvoicesDrawer } from "@/components/modals/MyInvoicesDrawer";

import { KpiDashboard } from "@/components/admin/KpiDashboard";
import { ProductManagement } from "@/components/admin/ProductManagement";
import { InvoiceCenter } from "@/components/admin/InvoiceCenter";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { CategoriesManagement } from "@/components/admin/CategoriesManagement";
import { ManagersPanel } from "@/components/admin/ManagersPanel";
import { LoginGate } from "@/components/admin/LoginGate";

import { Toaster } from "sonner";

type AdminTab = "dashboard" | "products" | "invoices" | "history" | "categories" | "users";

export default function App() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const changesOpen = useStore((s) => s.changesOpen);
  const setChangesOpen = useStore((s) => s.setChangesOpen);
  const myInvoicesOpen = useStore((s) => s.myInvoicesOpen);
  const setMyInvoicesOpen = useStore((s) => s.setMyInvoicesOpen);
  const session = useStore((s) => s.session);
  const hydrateSession = useStore((s) => s.hydrateSession);

  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [, startTransition] = useTransition();
  const refreshTick = useStore((s) => s.refreshTick);

  // Hydrate persisted auth session on mount
  useEffect(() => { hydrateSession(); }, [hydrateSession]);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      api.bootstrap()
        .then((b) => { if (!cancelled) setBoot(b); })
        .catch(() => {});
    });
    return () => { cancelled = false; };
  }, [refreshTick]);

  return (
    <>
      <main dir="rtl" className="min-h-screen bg-surface flex flex-col">
        <Topbar />
        <ChangesDrawer open={changesOpen} onOpenChange={setChangesOpen} />
        <MyInvoicesDrawer open={myInvoicesOpen} onOpenChange={setMyInvoicesOpen} />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {view === "store" ? (
              <motion.div
                key="store"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {boot ? <Storefront boot={boot} /> : <Loading label="در حال بارگذاری کاتالوگ…" />}
              </motion.div>
            ) : !session ? (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoginGate onBack={() => setView("store")} />
              </motion.div>
            ) : (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {boot ? <Admin boot={boot} /> : <Loading label="در حال بارگذاری داشبورد…" />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {view === "store" && (
          <footer className="mt-8 pt-6 pb-10 text-center text-xs text-muted-foreground border-t border-border">
            <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>ویجاسنتر</span>
              <span>·</span>
              <span>سامانه مدیریت موجودی، کاتالوگ قیمت زنده و صدور فاکتور</span>
              <span>·</span>
              <span>تقویم شمسی و اعداد فارسی</span>
            </div>
          </footer>
        )}
      </main>

      {/* Sonner toaster — mounted once at the app root */}
      <Toaster position="top-center" dir="rtl" richColors />
    </>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="py-24 flex items-center justify-center text-muted-foreground gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-brand" /> {label}
    </div>
  );
}

// ----- Storefront -----
function Storefront({ boot }: { boot: Bootstrap }) {
  const search = useStore((s) => s.search);
  const [category, setCategory] = useState("همه");
  const [stock, setStock] = useState<StockFilter>("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [products, setProducts] = useState<Product[]>(boot.products);
  const [pending, startTransition] = useTransition();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [receipt, setReceipt] = useState<Invoice | null>(null);
  const refreshTick = useStore((s) => s.refreshTick);
  const catsModalOpen = useStore((s) => s.categoriesModalOpen);
  const setCategoriesModalOpen = useStore((s) => s.setCategoriesModalOpen);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      api.listProducts({ category, stock, search: debouncedSearch, sort })
        .then((p) => { if (!cancelled) setProducts(p); })
        .catch(() => {});
    });
    return () => { cancelled = false; };
  }, [category, stock, debouncedSearch, sort, refreshTick]);

  const kpis = boot.kpis;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-5 py-5 space-y-5">
      <section className="rounded-2xl overflow-hidden bg-gradient-to-l from-brand-dark via-brand to-brand-dark text-white p-5 sm:p-7 relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber/20 text-amber text-[11px] font-bold mb-2">
              <Bell className="w-3 h-3" /> قیمت‌ها به‌صورت زنده به‌روزرسانی می‌شوند
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">کاتالوگ زنده ویجاسنتر</h1>
            <p className="text-white/80 text-sm mt-1 max-w-xl">
              انتخاب سریع، صدور پیش‌فاکتور برای رزرو انبار یا فاکتور نهایی با کسر موجودی. اعداد و تاریخ‌ها به فارسی و شمسی.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <HeroStat label="کل کالاها" value={faNumber(kpis.totalProducts)} />
            <HeroStat label="قابل فروش" value={faNumber(kpis.sellableItems)} />
            <HeroStat label="پیش‌فاکتور باز" value={faNumber(kpis.openProformas)} />
          </div>
        </div>
      </section>

      {!search.trim() && (
        <CategoryCarousel categories={boot.categories} selected={category} onSelect={setCategory} />
      )}
      {search.trim() && (
        <div className="rounded-xl bg-lavender/60 px-4 py-2 text-xs text-brand-dark flex items-center justify-between">
          <span>نتایج جستجو برای: <b className="font-num">«{search.trim()}»</b></span>
          <button onClick={() => useStore.getState().setSearch("")} className="text-coral hover:underline font-bold">
            پاک کردن جستجو
          </button>
        </div>
      )}

      <FilterBar stock={stock} setStock={setStock} sort={sort} setSort={setSort} />

      <div className="relative">
        {pending && (
          <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] grid place-items-center pointer-events-none">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
          </div>
        )}
        <CatalogTable products={products} />
        <CatalogCards products={products} />
      </div>

      <CategoriesModal
        open={catsModalOpen}
        onOpenChange={setCategoriesModalOpen}
        categories={boot.categories}
        selected={category}
        onSelect={setCategory}
      />

      <CartBar onOpenInvoice={() => setInvoiceOpen(true)} />
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        onIssued={(inv) => { setInvoiceOpen(false); setReceipt(inv); }}
      />
      <ReceiptModal invoice={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur min-w-[80px]">
      <div className="font-num text-xl font-extrabold text-amber">{value}</div>
      <div className="text-[10px] text-white/80">{label}</div>
    </div>
  );
}

// ----- Admin (tabbed) -----
function Admin({ boot }: { boot: Bootstrap }) {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const refreshTick = useStore((s) => s.refreshTick);
  const [liveBoot, setLiveBoot] = useState(boot);

  useEffect(() => {
    if (refreshTick === 0) return;
    api.bootstrap().then((b) => setLiveBoot(b)).catch(() => {});
  }, [refreshTick]);

  const tabs: { key: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "dashboard", label: "داشبورد", icon: LayoutDashboard },
    { key: "products", label: "محصولات", icon: Package },
    { key: "invoices", label: "فاکتورها", icon: FileSignature },
    { key: "categories", label: "دسته‌بندی‌ها", icon: Library },
    { key: "users", label: "کاربران", icon: Users },
    { key: "history", label: "تاریخچه", icon: History },
  ];

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-5 py-5 space-y-5">
      <section className="rounded-2xl bg-brand-dark text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-white/15">
            <LayoutDashboard className="w-6 h-6 text-amber" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">پنل مدیریت ویجاسنتر</h1>
            <p className="text-white/70 text-xs mt-0.5">داشبورد اجرایی، محصولات، فاکتورها، دسته‌بندی‌ها، کاربران و تاریخچه کامل تراکنش‌ها.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-amber text-sm">
          <Store className="w-4 h-4" /> ویجاسنتر
        </div>
      </section>

      {/* Tab bar */}
      <div className="bg-secondary/70 rounded-xl p-1.5 flex flex-wrap gap-1 overflow-x-auto scroll-slim">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                active ? "bg-brand text-white" : "text-brand-dark hover:bg-lavender"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {tab === "dashboard" && (
          <div className="space-y-5">
            <KpiDashboard kpis={liveBoot.kpis} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <InvoiceCenter />
              <ActivityLog />
            </div>
          </div>
        )}
        {tab === "products" && (
          <ProductManagement products={liveBoot.products} categories={liveBoot.categories} />
        )}
        {tab === "invoices" && <InvoiceCenter />}
        {tab === "categories" && <CategoriesManagement categories={liveBoot.categories} />}
        {tab === "users" && <ManagersPanel />}
        {tab === "history" && <ActivityLog />}
      </div>
    </div>
  );
}
