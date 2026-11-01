"use client";
import { create } from "zustand";
import type { Product, SessionUser } from "@/lib/types";
import { SESSION_KEY, decodeSession } from "@/lib/auth";

export interface CartLine {
  product: Product;
  quantity: number;
}

interface StoreState {
  // view
  view: "store" | "admin";
  setView: (v: "store" | "admin") => void;

  // storefront search (global — drives the catalog filter)
  search: string;
  setSearch: (s: string) => void;

  // cart
  cart: Record<string, CartLine>;
  addToCart: (p: Product, qty?: number) => void;
  decrement: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartTotalQty: () => number;
  cartTotalAmount: () => number;
  cartLines: () => CartLine[];

  // changes drawer (notification badge)
  changesBadge: number;
  setChangesBadge: (n: number) => void;
  decrementBadge: () => void;

  // recent changes feed (live-updated by mutations)
  recentChangeIds: number[];
  pushRecentChange: (id: number) => void;

  // refresh trigger — incremented whenever a mutation happens, used to refetch data
  refreshTick: number;
  triggerRefresh: () => void;

  // changes drawer
  changesOpen: boolean;
  setChangesOpen: (o: boolean) => void;

  // categories modal (storefront)
  categoriesModalOpen: boolean;
  setCategoriesModalOpen: (o: boolean) => void;

  // my invoices drawer (seller's own proforma + invoice list)
  myInvoicesOpen: boolean;
  setMyInvoicesOpen: (o: boolean) => void;

  // auth
  session: SessionUser | null;
  setSession: (s: SessionUser | null) => void;
  logout: () => void;
  hydrateSession: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  view: "store",
  setView: (v) => set({ view: v }),

  search: "",
  setSearch: (s) => set({ search: s }),

  cart: {},
  addToCart: (p, qty = 1) =>
    set((s) => {
      const existing = s.cart[p.id];
      const newQty = Math.max(
        0,
        Math.min(p.stock - p.reserved, (existing?.quantity ?? 0) + qty),
      );
      const cart = { ...s.cart };
      if (newQty <= 0) {
        delete cart[p.id];
      } else {
        cart[p.id] = { product: p, quantity: newQty };
      }
      return { cart };
    }),
  decrement: (id) =>
    set((s) => {
      const existing = s.cart[id];
      if (!existing) return s;
      const newQty = existing.quantity - 1;
      const cart = { ...s.cart };
      if (newQty <= 0) delete cart[id];
      else cart[id] = { ...existing, quantity: newQty };
      return { cart };
    }),
  removeFromCart: (id) =>
    set((s) => {
      const cart = { ...s.cart };
      delete cart[id];
      return { cart };
    }),
  clearCart: () => set({ cart: {} }),
  cartCount: () => Object.keys(get().cart).length,
  cartTotalQty: () => Object.values(get().cart).reduce((a, b) => a + b.quantity, 0),
  cartTotalAmount: () =>
    Object.values(get().cart).reduce((a, b) => a + b.quantity * b.product.price, 0),
  cartLines: () => Object.values(get().cart),

  changesBadge: 0,
  setChangesBadge: (n) => set({ changesBadge: n }),
  decrementBadge: () => set((s) => ({ changesBadge: Math.max(0, s.changesBadge - 1) })),

  recentChangeIds: [],
  pushRecentChange: (id) =>
    set((s) => ({
      recentChangeIds: [id, ...s.recentChangeIds].slice(0, 50),
      changesBadge: s.changesBadge + 1,
    })),

  refreshTick: 0,
  triggerRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),

  changesOpen: false,
  setChangesOpen: (o) => set({ changesOpen: o }),

  categoriesModalOpen: false,
  setCategoriesModalOpen: (o) => set({ categoriesModalOpen: o }),

  myInvoicesOpen: false,
  setMyInvoicesOpen: (o) => set({ myInvoicesOpen: o }),

  session: null,
  setSession: (s) => {
    if (typeof window !== "undefined") {
      if (s) {
        // Encode and persist
        const token = btoa(unescape(encodeURIComponent(JSON.stringify({ ...s, ts: Date.now() }))));
        localStorage.setItem(SESSION_KEY, token);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    set({ session: s });
  },
  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
    set({ session: null, view: "store" });
  },
  hydrateSession: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return;
    const decoded = decodeSession<{ type: "master" | "manager"; displayName?: string; username?: string; id?: string; role?: "master" | "manager"; ts: number }>(token);
    if (!decoded) return;
    // Expire after 8 hours
    if (decoded.ts && Date.now() - decoded.ts > 8 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    if (decoded.type === "master") {
      set({ session: { type: "master", displayName: decoded.displayName ?? "مدیر کل" } });
    } else if (decoded.type === "manager" && decoded.username && decoded.id) {
      set({
        session: {
          type: "manager",
          id: decoded.id,
          username: decoded.username,
          displayName: decoded.displayName ?? decoded.username,
          role: decoded.role ?? "manager",
        },
      });
    }
  },
}));
