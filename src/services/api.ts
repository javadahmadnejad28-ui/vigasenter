// Frontend API service. Mirrors the Cloudflare Worker endpoints in
// /download/cloudflare/functions/api/[[route]].ts exactly so the React
// layer is portable to a Vite + Cloudflare Pages deployment with zero changes.

import type {
  Bootstrap,
  Category,
  Invoice,
  Manager,
  Product,
  ProductChange,
  SessionUser,
} from "@/lib/types";

const BASE = "/api";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  bootstrap: () =>
    fetch(`${BASE}/bootstrap`).then(json<Bootstrap>),

  listProducts: (params: {
    category?: string;
    stock?: "all" | "in" | "low" | "out";
    search?: string;
    sort?: "default" | "cheap" | "expensive" | "stock";
  } = {}) => {
    const q = new URLSearchParams();
    if (params.category && params.category !== "همه") q.set("category", params.category);
    if (params.stock && params.stock !== "all") q.set("stock", params.stock);
    if (params.search) q.set("search", params.search);
    if (params.sort) q.set("sort", params.sort);
    const qs = q.toString();
    return fetch(`${BASE}/products${qs ? `?${qs}` : ""}`).then(json<Product[]>);
  },

  listCategories: () =>
    fetch(`${BASE}/categories`).then(json<Category[]>),

  upsertProduct: (payload: Partial<Product> & { id: string; name: string; category: string; price: number; stock: number }) =>
    fetch(`${BASE}/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<Product>),

  adjustStock: (id: string, delta: number) =>
    fetch(`${BASE}/products/stock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, delta }),
    }).then(json<{ product: Product; change: ProductChange }>),

  createInvoice: (payload: {
    type: "فاکتور" | "پیش‌فاکتور";
    customer_name: string;
    customer_phone?: string;
    seller?: string;
    items: { id: string; name: string; price: number; quantity: number }[];
  }) =>
    fetch(`${BASE}/invoices`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<Invoice>),

  convertInvoice: (invoice_no: string) =>
    fetch(`${BASE}/invoices/convert`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoice_no }),
    }).then(json<Invoice>),

  cancelInvoice: (invoice_no: string) =>
    fetch(`${BASE}/invoices/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoice_no }),
    }).then(json<Invoice>),

  listInvoices: () =>
    fetch(`${BASE}/invoices`).then(json<Invoice[]>),

  listChanges: (params: { field?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.field && params.field !== "همه") q.set("field", params.field);
    if (params.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return fetch(`${BASE}/changes${qs ? `?${qs}` : ""}`).then(json<{ items: ProductChange[]; nextCursor: number | null }>);
  },

  // ---- auth ----
  checkPin: (pin: string) =>
    fetch(`${BASE}/auth/pin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    }).then(json<{ token: string; user: SessionUser }>),

  changePin: (current_pin: string, new_pin: string) =>
    fetch(`${BASE}/auth/pin-change`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ current_pin, new_pin }),
    }).then(json<{ ok: boolean }>),

  loginManager: (username: string, password: string) =>
    fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then(json<{ token: string; user: SessionUser }>),

  // ---- managers ----
  listManagers: () =>
    fetch(`${BASE}/managers`).then(json<Manager[]>),

  createManager: (payload: { username: string; password: string; display_name: string }) =>
    fetch(`${BASE}/managers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<Manager>),

  deleteManager: (id: string) =>
    fetch(`${BASE}/managers/${id}`, { method: "DELETE" }).then(json<{ ok: boolean }>),

  // ---- categories CRUD ----
  createCategory: (payload: { name: string; status?: string }) =>
    fetch(`${BASE}/categories`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<Category>),

  updateCategory: (id: string, payload: { name?: string; status?: string }) =>
    fetch(`${BASE}/categories/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<Category>),

  deleteCategory: (id: string) =>
    fetch(`${BASE}/categories/${id}`, { method: "DELETE" }).then(json<{ ok: boolean }>),
};

export type Api = typeof api;
