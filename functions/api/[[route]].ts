// =============================================================================
//  فروشگاه آرتیمیس — Cloudflare Pages Functions catch-all API router
//  File:  functions/api/[[route]].ts
//
//  Endpoints (mirror the local Next.js preview routes 1:1):
//    GET    /api/bootstrap            products + categories + active proformas + KPIs + recent changes
//    GET    /api/categories            categories with product counts
//    GET    /api/products?category=&stock=&search=&sort=
//    POST   /api/products              upsert (idempotent). Logs every field change.
//    POST   /api/products/stock        quick ±N stock adjustment
//    POST   /api/invoices              create invoice (final) or proforma (reserve)
//    GET    /api/invoices              list all invoices
//    POST   /api/invoices/convert      proforma -> final invoice
//    POST   /api/invoices/cancel       cancel invoice (restores stock/reservation)
//    GET    /api/changes?field=&limit= recent audit logs with optional filter
//
//  Bind D1 as `DB` in your Cloudflare Pages project settings:
//  Settings > Functions > D1 database bindings > Variable name: DB > D1 database: shop-db
// =============================================================================

export interface Env {
  DB: D1Database;
}

interface ProductRow {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  price: number;
  stock: number;
  reserved: number;
  status: string;
  updated_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface InvoiceRow {
  invoice_no: string;
  type: "فاکتور" | "پیش‌فاکتور";
  customer_name: string;
  customer_phone: string | null;
  seller: string;
  total: number;
  status: "فعال" | "لغو شده";
  items: string; // JSON
  created_at: string;
}

interface ChangeRow {
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

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// ---- helpers --------------------------------------------------------------

const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(init?.headers ?? {}) },
  });

const err = (msg: string, status = 400) => json({ error: msg }, { status });

function toFaYear(d = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric" }).formatToParts(d);
    return parts.find((p) => p.type === "year")?.value ?? "1405";
  } catch {
    return "1405";
  }
}

async function nextInvoiceNo(env: Env, type: "فاکتور" | "پیش‌فاکتور"): Promise<string> {
  const prefix = type === "فاکتور" ? "INV" : "PRV";
  const year = toFaYear();
  const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM invoices WHERE type = ?`)
    .bind(type)
    .first<{ c: number }>();
  const seq = (row?.c ?? 0) + 1;
  const padded = String(seq).padStart(4, "0");
  return `${prefix}-${year}-${padded}`;
}

// ---- router --------------------------------------------------------------

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/^\/api/, "").replace(/^\/+|\/+$/g, "");

  switch (path) {
    case "bootstrap":
      return handleBootstrap(ctx.env);
    case "categories":
      return handleCategories(ctx.env);
    case "products":
      return handleListProducts(ctx.env, url.searchParams);
    case "invoices":
      return handleListInvoices(ctx.env);
    case "changes":
      return handleListChanges(ctx.env, url.searchParams);
    default:
      return err(`Unknown GET route: /api/${path}`, 404);
  }
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/^\/api/, "").replace(/^\/+|\/+$/g, "");

  switch (path) {
    case "products":
      return handleUpsertProduct(ctx.env, ctx.request);
    case "products/stock":
      return handleStockAdjust(ctx.env, ctx.request);
    case "invoices":
      return handleCreateInvoice(ctx.env, ctx.request);
    case "invoices/convert":
      return handleConvertInvoice(ctx.env, ctx.request);
    case "invoices/cancel":
      return handleCancelInvoice(ctx.env, ctx.request);
    default:
      return err(`Unknown POST route: /api/${path}`, 404);
  }
};

// ---- GET handlers --------------------------------------------------------

async function handleBootstrap(env: Env) {
  const [products, categories, invoices, recentChanges] = await Promise.all([
    env.DB.prepare(`SELECT * FROM products ORDER BY updated_at DESC`).all<ProductRow>(),
    env.DB.prepare(`SELECT * FROM categories ORDER BY name ASC`).all<CategoryRow>(),
    env.DB.prepare(`SELECT * FROM invoices WHERE status = 'فعال' ORDER BY created_at DESC`).all<InvoiceRow>(),
    env.DB.prepare(`SELECT * FROM product_changes ORDER BY id DESC LIMIT 8`).all<ChangeRow>(),
  ]);

  const countByCat = new Map<string, number>();
  for (const p of products.results ?? []) countByCat.set(p.category, (countByCat.get(p.category) ?? 0) + 1);

  const kpis = {
    totalProducts: (products.results ?? []).length,
    sellableItems: (products.results ?? []).reduce((s, p) => s + Math.max(0, p.stock - p.reserved), 0),
    openProformas: (invoices.results ?? []).filter((i) => i.type === "پیش‌فاکتور").length,
    outOfStock: (products.results ?? []).filter((p) => p.stock <= 0).length,
    inventoryValue: (products.results ?? []).reduce((s, p) => s + p.price * p.stock, 0),
  };

  return json({
    products: products.results ?? [],
    categories: (categories.results ?? []).map((c) => ({ ...c, product_count: countByCat.get(c.name) ?? 0 })),
    proformas: (invoices.results ?? []).filter((i) => i.type === "پیش‌فاکتور").map((i) => ({ ...i, items: JSON.parse(i.items) })),
    kpis,
    recentChanges: recentChanges.results ?? [],
  });
}

async function handleCategories(env: Env) {
  const [cats, prods] = await Promise.all([
    env.DB.prepare(`SELECT * FROM categories ORDER BY name ASC`).all<CategoryRow>(),
    env.DB.prepare(`SELECT category FROM products`).all<{ category: string }>(),
  ]);
  const counts = new Map<string, number>();
  for (const p of prods.results ?? []) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return json((cats.results ?? []).map((c) => ({ ...c, product_count: counts.get(c.name) ?? 0 })));
}

async function handleListProducts(env: Env, sp: URLSearchParams) {
  const category = sp.get("category");
  const stock = sp.get("stock") ?? "all";
  const search = sp.get("search");
  const sort = sp.get("sort") ?? "default";

  const where: string[] = [];
  const binds: unknown[] = [];
  if (category && category !== "همه") { where.push("category = ?"); binds.push(category); }
  if (search) { where.push("name LIKE ?"); binds.push(`%${search}%`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  let sql = `SELECT * FROM products ${whereSql} ORDER BY updated_at DESC`;
  let rows = (await env.DB.prepare(sql).bind(...binds).all<ProductRow>()).results ?? [];

  if (stock === "in") rows = rows.filter((p) => p.stock - p.reserved > 3);
  else if (stock === "low") rows = rows.filter((p) => p.stock > 0 && p.stock - p.reserved <= 3);
  else if (stock === "out") rows = rows.filter((p) => p.stock <= 0);

  if (sort === "cheap") rows = [...rows].sort((a, b) => a.price - b.price);
  else if (sort === "expensive") rows = [...rows].sort((a, b) => b.price - a.price);
  else if (sort === "stock") rows = [...rows].sort((a, b) => b.stock - a.stock);
  else rows = [...rows].sort((a, b) => (b.stock - b.reserved > 0 ? 0 : 1) - (a.stock - a.reserved > 0 ? 0 : 1) || b.updated_at.localeCompare(a.updated_at));

  return json(rows);
}

async function handleListInvoices(env: Env) {
  const rows = (await env.DB.prepare(`SELECT * FROM invoices ORDER BY created_at DESC`).all<InvoiceRow>()).results ?? [];
  return json(rows.map((i) => ({ ...i, items: JSON.parse(i.items) })));
}

async function handleListChanges(env: Env, sp: URLSearchParams) {
  const field = sp.get("field");
  const limit = Math.min(200, Number(sp.get("limit") ?? 100));
  const cursor = sp.get("cursor");

  let sql = `SELECT * FROM product_changes`;
  const where: string[] = [];
  const binds: unknown[] = [];
  if (field && field !== "همه") { where.push("field LIKE ?"); binds.push(`%${field}%`); }
  if (cursor) { where.push("id < ?"); binds.push(Number(cursor)); }
  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += ` ORDER BY id DESC LIMIT ?`;
  binds.push(limit);

  const rows = (await env.DB.prepare(sql).bind(...binds).all<ChangeRow>()).results ?? [];
  return json({ items: rows, nextCursor: rows.length === limit ? rows[rows.length - 1]!.id : null });
}

// ---- POST handlers -------------------------------------------------------

async function handleUpsertProduct(env: Env, req: Request) {
  const body = await req.json() as {
    id?: string;
    name: string;
    category: string;
    image_url?: string | null;
    price: number;
    stock: number;
    status?: string;
  };

  let id = (body.id ?? "").trim();
  if (!id || id.startsWith("NEW-")) id = `PRD-${Date.now().toString(36).toUpperCase()}`;

  const existing = await env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first<ProductRow>();

  if (!existing) {
    const price = Math.max(0, Math.floor(body.price ?? 0));
    const stock = Math.max(0, Math.floor(body.stock ?? 0));
    await env.DB.prepare(
      `INSERT INTO products (id, name, category, image_url, price, stock, reserved, status) VALUES (?,?,?,?,?,?,0,?)`,
    ).bind(id, body.name, body.category, body.image_url ?? null, price, stock, body.status ?? "فعال").run();

    const change = await env.DB.prepare(
      `INSERT INTO product_changes (product_id, product_name, field, old_value, new_value, delta, admin)
       VALUES (?,?,?,?,?,?,?) RETURNING id`,
    ).bind(id, body.name, "ایجاد محصول", null, `موجودی: ${stock} | قیمت: ${price}`, stock, "مدیریت").first<{ id: number }>();

    return json({ id, ...body, image_url: body.image_url ?? null, price, stock, reserved: 0, status: body.status ?? "فعال" }, {
      headers: { "x-change-id": String(change?.id ?? 0) },
    });
  }

  const updates: { col: string; val: unknown }[] = [];
  const changes: { field: string; oldV: string; newV: string; delta: number }[] = [];

  if (body.name && body.name !== existing.name) updates.push({ col: "name", val: body.name });
  if (body.category && body.category !== existing.category) updates.push({ col: "category", val: body.category });
  if (body.image_url !== undefined && body.image_url !== existing.image_url) updates.push({ col: "image_url", val: body.image_url ?? null });
  if (body.status && body.status !== existing.status) updates.push({ col: "status", val: body.status });

  const newPrice = Math.max(0, Math.floor(body.price ?? existing.price));
  if (newPrice !== existing.price) {
    changes.push({ field: "قیمت", oldV: String(existing.price), newV: String(newPrice), delta: newPrice - existing.price });
    updates.push({ col: "price", val: newPrice });
  }
  const newStock = Math.max(0, Math.floor(body.stock ?? existing.stock));
  if (newStock !== existing.stock) {
    changes.push({ field: "موجودی کل", oldV: String(existing.stock), newV: String(newStock), delta: newStock - existing.stock });
    updates.push({ col: "stock", val: newStock });
  }

  if (updates.length === 0) return json(existing);

  const sets = updates.map((u) => `${u.col} = ?`).join(", ");
  const binds = updates.map((u) => u.val);
  binds.push(id);
  await env.DB.prepare(`UPDATE products SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...binds).run();

  let lastChangeId = 0;
  for (const c of changes) {
    const r = await env.DB.prepare(
      `INSERT INTO product_changes (product_id, product_name, field, old_value, new_value, delta, admin)
       VALUES (?,?,?,?,?,?,?) RETURNING id`,
    ).bind(id, body.name, c.field, c.oldV, c.newV, c.delta, "مدیریت").first<{ id: number }>();
    lastChangeId = r?.id ?? lastChangeId;
  }

  const updated = await env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first<ProductRow>();
  return json(updated, { headers: lastChangeId ? { "x-change-id": String(lastChangeId) } : undefined });
}

async function handleStockAdjust(env: Env, req: Request) {
  const { id, delta } = await req.json() as { id: string; delta: number };
  if (!id || !Number.isFinite(delta) || delta === 0) return err("id و delta معتبر لازم است");

  const existing = await env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first<ProductRow>();
  if (!existing) return err("محصول یافت نشد", 404);

  const newStock = Math.max(0, existing.stock + delta);
  await env.DB.prepare(`UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(newStock, id).run();
  const change = await env.DB.prepare(
    `INSERT INTO product_changes (product_id, product_name, field, old_value, new_value, delta, admin)
     VALUES (?,?,?,?,?,?,?) RETURNING *`,
  ).bind(id, existing.name, "موجودی کل", String(existing.stock), String(newStock), delta, "مدیریت").first<ChangeRow>();

  const updated = await env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first<ProductRow>();
  return json({ product: updated, change }, { headers: { "x-change-id": String(change?.id ?? 0) } });
}

async function handleCreateInvoice(env: Env, req: Request) {
  const body = await req.json() as {
    type: "فاکتور" | "پیش‌فاکتور";
    customer_name: string;
    customer_phone?: string;
    seller?: string;
    items: InvoiceItem[];
  };

  if (!body.customer_name?.trim()) return err("نام مشتری الزامی است");
  if (!body.items?.length) return err("حداقل یک کالا انتخاب کنید");

  const items: InvoiceItem[] = [];
  for (const it of body.items) {
    const p = await env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(it.id).first<ProductRow>();
    if (!p) continue;
    const available = p.stock - p.reserved;
    const qty = Math.max(1, Math.min(it.quantity, available));
    if (qty <= 0) continue;
    items.push({ id: p.id, name: p.name, price: p.price, quantity: qty });
  }
  if (!items.length) return err("موجودی کافی برای هیچ کالایی وجود ندارد");

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const invoiceNo = await nextInvoiceNo(env, body.type);

  // Use D1 batch for the transaction (D1 doesn't support interactive transactions)
  const stmts: D1PreparedStatement[] = [];
  stmts.push(
    env.DB.prepare(
      `INSERT INTO invoices (invoice_no, type, customer_name, customer_phone, seller, total, status, items)
       VALUES (?,?,?,?,?,?,'فعال',?)`,
    ).bind(invoiceNo, body.type, body.customer_name.trim(), body.customer_phone?.trim() || null, body.seller?.trim() || "فروشنده", total, JSON.stringify(items)),
  );

  for (const it of items) {
    if (body.type === "پیش‌فاکتور") {
      stmts.push(env.DB.prepare(`UPDATE products SET reserved = reserved + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(it.quantity, it.id));
      stmts.push(
        env.DB.prepare(
          `INSERT INTO product_changes (product_id, product_name, field, old_value, new_value, delta, admin)
           VALUES (?,?,'پیش‌فاکتور شده',?,?,?,?)`,
        ).bind(it.id, it.name, String(0), String(it.quantity), it.quantity, body.seller || "فروشنده"),
      );
    } else {
      stmts.push(env.DB.prepare(`UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(it.quantity, it.id));
      stmts.push(
        env.DB.prepare(
          `INSERT INTO product_changes (product_id, product_name, field, old_value, new_value, delta, admin)
           VALUES (?,?,'فروش قطعی',?,?,?,?)`,
        ).bind(it.id, it.name, String(0), String(-it.quantity), -it.quantity, body.seller || "فروشنده"),
      );
    }
  }

  await env.DB.batch(stmts);

  const created = await env.DB.prepare(`SELECT * FROM invoices WHERE invoice_no = ?`).bind(invoiceNo).first<InvoiceRow>();
  return json({ ...created, items: JSON.parse(created!.items) }, { headers: { "x-change-id": "1" } });
}

async function handleConvertInvoice(env: Env, req: Request) {
  const { invoice_no } = await req.json() as { invoice_no: string };
  if (!invoice_no) return err("invoice_no لازم است");

  const inv = await env.DB.prepare(`SELECT * FROM invoices WHERE invoice_no = ?`).bind(invoice_no).first<InvoiceRow>();
  if (!inv) return err("سند یافت نشد", 404);
  if (inv.type !== "پیش‌فاکتور") return err("این سند قبلاً نهایی شده است");
  if (inv.status === "لغو شده") return err("سند لغو شده قابل تبدیل نیست");

  const items = JSON.parse(inv.items) as InvoiceItem[];
  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(`UPDATE invoices SET type = 'فاکتور' WHERE invoice_no = ?`).bind(invoice_no),
  ];
  for (const it of items) {
    stmts.push(env.DB.prepare(`UPDATE products SET reserved = MAX(0, reserved - ?), stock = MAX(0, stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(it.quantity, it.quantity, it.id));
    stmts.push(
      env.DB.prepare(
        `INSERT INTO product_changes (product_id, product_name, field, old_value, new_value, delta, admin)
         VALUES (?,?,'فروش قطعی',?,?,?,?)`,
      ).bind(it.id, it.name, String(0), `سند ${invoice_no} نهایی شد`, -it.quantity, "مدیریت"),
    );
  }
  await env.DB.batch(stmts);

  const updated = await env.DB.prepare(`SELECT * FROM invoices WHERE invoice_no = ?`).bind(invoice_no).first<InvoiceRow>();
  return json({ ...updated, items: JSON.parse(updated!.items) }, { headers: { "x-change-id": "1" } });
}

async function handleCancelInvoice(env: Env, req: Request) {
  const { invoice_no } = await req.json() as { invoice_no: string };
  if (!invoice_no) return err("invoice_no لازم است");

  const inv = await env.DB.prepare(`SELECT * FROM invoices WHERE invoice_no = ?`).bind(invoice_no).first<InvoiceRow>();
  if (!inv) return err("سند یافت نشد", 404);
  if (inv.status === "لغو شده") return err("سند قبلاً لغو شده است");

  const items = JSON.parse(inv.items) as InvoiceItem[];
  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(`UPDATE invoices SET status = 'لغو شده' WHERE invoice_no = ?`).bind(invoice_no),
  ];
  for (const it of items) {
    if (inv.type === "پیش‌فاکتور") {
      stmts.push(env.DB.prepare(`UPDATE products SET reserved = MAX(0, reserved - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(it.quantity, it.id));
      stmts.push(
        env.DB.prepare(
          `INSERT INTO product_changes (product_id, product_name, field, old_value, new_value, delta, admin)
           VALUES (?,?,'لغو سند',?,?,?,?)`,
        ).bind(it.id, it.name, `رزرو: ${it.quantity}`, `رزرو: 0`, -it.quantity, "مدیریت"),
      );
    } else {
      stmts.push(env.DB.prepare(`UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(it.quantity, it.id));
      stmts.push(
        env.DB.prepare(
          `INSERT INTO product_changes (product_id, product_name, field, old_value, new_value, delta, admin)
           VALUES (?,?,'لغو سند',?,?,?,?)`,
        ).bind(it.id, it.name, `موجودی: ${-it.quantity}`, `موجودی: +${it.quantity}`, it.quantity, "مدیریت"),
      );
    }
  }
  await env.DB.batch(stmts);

  const updated = await env.DB.prepare(`SELECT * FROM invoices WHERE invoice_no = ?`).bind(invoice_no).first<InvoiceRow>();
  return json({ ...updated, items: JSON.parse(updated!.items) }, { headers: { "x-change-id": "1" } });
}
