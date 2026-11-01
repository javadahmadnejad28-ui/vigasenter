-- ============================================================
--  فروشگاه آرتیمیس — Cloudflare D1 schema
--  Run inside D1 Console (Storage & Databases > D1 > shop-db > Console)
-- ============================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'فعال',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  price INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  status TEXT DEFAULT 'فعال',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  invoice_no TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('فاکتور', 'پیش‌فاکتور')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  seller TEXT DEFAULT 'فروشنده',
  total INTEGER DEFAULT 0,
  status TEXT DEFAULT 'فعال' CHECK(status IN ('فعال', 'لغو شده')),
  items TEXT NOT NULL, -- JSON string array: [{id, name, price, quantity}]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Activity & Change Logs Table (تغییرات اخیر)
CREATE TABLE IF NOT EXISTS product_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT,
  product_name TEXT,
  field TEXT NOT NULL, -- 'قیمت', 'موجودی کل', 'پیش‌فاکتور شده', 'فروش قطعی', 'ایجاد محصول', 'لغو سند', 'تغییر اطلاعات'
  old_value TEXT,
  new_value TEXT,
  delta INTEGER DEFAULT 0,
  admin TEXT DEFAULT 'مدیریت',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_changes_date ON product_changes(created_at DESC);

-- ============================================================
--  Optional seed data (sample Persian products)
-- ============================================================
INSERT OR IGNORE INTO categories (id, name) VALUES
  ('CAT-TOYS', 'اسباب‌بازی'),
  ('CAT-EDU',  'لوازم تحریر'),
  ('CAT-ELEC', 'الکترونیک'),
  ('CAT-BABY', 'کودک و نوزاد'),
  ('CAT-BOARD','بازی فکری');

INSERT OR IGNORE INTO products (id, name, category, image_url, price, stock, reserved) VALUES
  ('PRD-1001','ماشین کنترلی شارژی تندرو X۹','اسباب‌بازی','https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400',1850000,12,2),
  ('PRD-1002','عروسک خرسه عسل پولاشی ۴۰ سانت','اسباب‌بازی','https://images.unsplash.com/photo-1558877385-8c1b8b1cc2bb?w=400',320000,38,0),
  ('PRD-1003','لگو شهر آژانس مسافرتی ۲۴۰ تکه','اسباب‌بازی','https://images.unsplash.com/photo-1611604548018-d56bbd85d681?w=400',2450000,5,1),
  ('PRD-2001','دفتر مشق ۸۰ برگ طرح کلاسیک','لوازم تحریر','https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400',75000,240,5),
  ('PRD-2002','جعبه مدادرنگی ۳۶تایی فابلا','لوازم تحریر','https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',285000,18,3),
  ('PRD-3001','هدفون بی‌سیم بلوتوث TWS نسل ۵','الکترونیک','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',1290000,9,2),
  ('PRD-3003','پاوربانک ۲۰هزار mAh سریع‌شارژ PD','الکترونیک','https://images.unsplash.com/photo-1609592424823-1a1ddb5d7d5e?w=400',720000,25,4),
  ('PRD-4001','پوشک نوزادی سایز ۳ بسته ۶۰تایی','کودک و نوزاد','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',540000,50,0),
  ('PRD-5001','شطرنج مغناطیسی چوبی جیبی','بازی فکری','https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400',410000,22,1),
  ('PRD-5003','بازی تخته‌ای استراتژیک شکوه','بازی فکری','https://images.unsplash.com/photo-1606503153255-59d8b8b82176?w=400',1450000,2,0);
