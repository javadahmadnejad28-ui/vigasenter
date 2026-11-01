// Shared types — mirror the D1 schema exactly.

export type ProductStatus = "فعال" | "غیرفعال";
export type InvoiceType = "فاکتور" | "پیش‌فاکتور";
export type InvoiceStatus = "فعال" | "لغو شده";

export interface Category {
  id: string;
  name: string;
  status: string;
  created_at?: string;
  /** server-derived count of products in this category */
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  price: number;
  stock: number;
  reserved: number;
  status: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Invoice {
  invoice_no: string;
  type: InvoiceType;
  customer_name: string;
  customer_phone: string | null;
  seller: string;
  total: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  created_at: string;
}

export type ChangeField =
  | "قیمت"
  | "موجودی کل"
  | "پیش‌فاکتور شده"
  | "فروش قطعی"
  | "ایجاد محصول"
  | "لغو سند"
  | "تغییر اطلاعات";

export interface ProductChange {
  id: number;
  product_id: string | null;
  product_name: string | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
  delta: number;
  admin: string;
  created_at: string;
}

export interface Kpis {
  totalProducts: number;
  sellableItems: number;
  openProformas: number;
  outOfStock: number;
  inventoryValue: number;
}

export interface Bootstrap {
  products: Product[];
  categories: Category[];
  proformas: Invoice[];
  kpis: Kpis;
  recentChanges: ProductChange[];
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export type ManagerRole = "master" | "manager";

export interface Manager {
  id: string;
  username: string;
  display_name: string;
  role: ManagerRole;
  created_at?: string;
}

export type SessionUser =
  | { type: "master"; displayName: string }
  | { type: "manager"; id: string; username: string; displayName: string; role: ManagerRole };
