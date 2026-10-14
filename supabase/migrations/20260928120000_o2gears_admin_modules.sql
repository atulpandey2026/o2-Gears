-- O2 Gears Admin Modules Migration
-- Adds: Inventory, Warehouses, Barcodes, Coupons, Roles/Permissions, Audit Logs, Settings, Banners
-- Extends: Orders (full lifecycle), Reviews (approval), User Profiles (admin role)
-- Timestamp: 20260928120000

-- ============================================================
-- 1. EXTEND EXISTING ENUMS (drop & recreate with new values)
-- ============================================================

-- Extend order_status to full lifecycle
DROP TYPE IF EXISTS public.order_status CASCADE;
CREATE TYPE public.order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'
);

-- Extend product_status to include out_of_stock
DROP TYPE IF EXISTS public.product_status CASCADE;
CREATE TYPE public.product_status AS ENUM ('active', 'draft', 'out_of_stock', 'archived');

-- New enums
DROP TYPE IF EXISTS public.barcode_format CASCADE;
CREATE TYPE public.barcode_format AS ENUM ('EAN13', 'UPCA', 'CODE128');

DROP TYPE IF EXISTS public.barcode_status CASCADE;
CREATE TYPE public.barcode_status AS ENUM ('active', 'inactive');

DROP TYPE IF EXISTS public.inventory_movement_type CASCADE;
CREATE TYPE public.inventory_movement_type AS ENUM ('stock_in', 'stock_out', 'adjustment', 'transfer', 'reserved', 'released', 'returned');

DROP TYPE IF EXISTS public.coupon_type CASCADE;
CREATE TYPE public.coupon_type AS ENUM ('percentage', 'fixed');

DROP TYPE IF EXISTS public.review_status CASCADE;
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

DROP TYPE IF EXISTS public.banner_type CASCADE;
CREATE TYPE public.banner_type AS ENUM ('hero', 'product', 'promotional', 'featured');

-- ============================================================
-- 2. RESTORE EXISTING TABLES WITH UPDATED ENUMS
-- ============================================================

-- Restore products table with updated product_status enum
-- CASCADE on DROP TYPE removes the column, so we add it back if missing
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_status public.product_status DEFAULT 'active'::public.product_status;

ALTER TABLE public.products
  ALTER COLUMN product_status SET DEFAULT 'active'::public.product_status;

-- Restore orders table with updated order_status enum
-- CASCADE on DROP TYPE removes the column, so we add it back if missing
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_status public.order_status DEFAULT 'pending'::public.order_status;

ALTER TABLE public.orders
  ALTER COLUMN order_status SET DEFAULT 'pending'::public.order_status;

-- ============================================================
-- 3. EXTEND EXISTING TABLES
-- ============================================================

-- Extend orders with full lifecycle fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS shipping_provider TEXT,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS return_reason TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Extend reviews with approval workflow
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_status public.review_status DEFAULT 'pending'::public.review_status,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Extend user_profiles with admin-specific fields
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- 4. NEW TABLES
-- ============================================================

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  UNIQUE(module, action)
);

-- Role Permissions (junction)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- Admin Users (links user_profiles to roles)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Inventory (product stock per warehouse)
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  available_stock INTEGER GENERATED ALWAYS AS (GREATEST(current_stock - reserved_stock, 0)) STORED,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, warehouse_id)
);

-- Inventory Movements (stock in/out/adjustments history)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  movement_type public.inventory_movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL DEFAULT 0,
  quantity_after INTEGER NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  performed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Barcodes
CREATE TABLE IF NOT EXISTS public.barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  barcode_value TEXT NOT NULL UNIQUE,
  barcode_format public.barcode_format NOT NULL DEFAULT 'EAN13'::public.barcode_format,
  barcode_status public.barcode_status NOT NULL DEFAULT 'active'::public.barcode_status,
  label_notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  coupon_type public.coupon_type NOT NULL DEFAULT 'percentage'::public.coupon_type,
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Coupon Usage
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Banners / CMS
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  banner_type public.banner_type NOT NULL DEFAULT 'hero'::public.banner_type,
  image_url TEXT,
  image_alt TEXT,
  cta_text TEXT,
  cta_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  extra_data JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  setting_group TEXT NOT NULL DEFAULT 'general',
  label TEXT,
  description TEXT,
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id UUID,
  record_type TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON public.inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse ON public.inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_barcodes_product ON public.barcodes(product_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_value ON public.barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_banners_type ON public.banners(banner_type);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_group ON public.settings(setting_group);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user ON public.admin_users(user_id);

-- ============================================================
-- 6. FUNCTIONS
-- ============================================================

-- Audit log helper
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_user_id UUID,
  p_user_name TEXT,
  p_user_email TEXT,
  p_action TEXT,
  p_module TEXT,
  p_record_id UUID DEFAULT NULL,
  p_record_type TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id, user_name, user_email, action, module,
    record_id, record_type, old_values, new_values, ip_address
  ) VALUES (
    p_user_id, p_user_name, p_user_email, p_action, p_module,
    p_record_id, p_record_type, p_old_values, p_new_values, p_ip_address
  ) RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;

-- Update inventory stock
CREATE OR REPLACE FUNCTION public.update_inventory_stock(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_movement_type public.inventory_movement_type,
  p_quantity INTEGER,
  p_performed_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER := 0;
  v_new_stock INTEGER;
  v_inv_id UUID;
BEGIN
  -- Get or create inventory record
  INSERT INTO public.inventory (product_id, warehouse_id, current_stock)
  VALUES (p_product_id, p_warehouse_id, 0)
  ON CONFLICT (product_id, warehouse_id) DO NOTHING;

  SELECT id, current_stock INTO v_inv_id, v_current_stock
  FROM public.inventory
  WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;

  -- Calculate new stock
  IF p_movement_type IN ('stock_in', 'released', 'returned') THEN
    v_new_stock := v_current_stock + p_quantity;
  ELSIF p_movement_type IN ('stock_out', 'reserved') THEN
    v_new_stock := GREATEST(v_current_stock - p_quantity, 0);
  ELSIF p_movement_type = 'adjustment' THEN
    v_new_stock := p_quantity; -- absolute value for adjustments
  ELSE
    v_new_stock := v_current_stock;
  END IF;

  -- Update inventory
  UPDATE public.inventory
  SET current_stock = v_new_stock, updated_at = CURRENT_TIMESTAMP
  WHERE id = v_inv_id;

  -- Also update products.stock_quantity
  UPDATE public.products
  SET stock_quantity = (
    SELECT COALESCE(SUM(current_stock), 0) FROM public.inventory WHERE product_id = p_product_id
  ), updated_at = CURRENT_TIMESTAMP
  WHERE id = p_product_id;

  -- Record movement
  INSERT INTO public.inventory_movements (
    product_id, warehouse_id, movement_type, quantity,
    quantity_before, quantity_after, performed_by, notes,
    reference_type, reference_id
  ) VALUES (
    p_product_id, p_warehouse_id, p_movement_type, p_quantity,
    v_current_stock, v_new_stock, p_performed_by, p_notes,
    p_reference_type, p_reference_id
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Generate barcode value
CREATE OR REPLACE FUNCTION public.generate_barcode_value(p_format public.barcode_format)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_value TEXT;
  v_exists BOOLEAN := TRUE;
  v_attempts INTEGER := 0;
BEGIN
  WHILE v_exists AND v_attempts < 100 LOOP
    IF p_format = 'EAN13' THEN
      v_value := LPAD(FLOOR(RANDOM() * 9999999999999)::BIGINT::TEXT, 13, '0');
    ELSIF p_format = 'UPCA' THEN
      v_value := LPAD(FLOOR(RANDOM() * 999999999999)::BIGINT::TEXT, 12, '0');
    ELSE
      v_value := 'O2-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.barcodes WHERE barcode_value = v_value) INTO v_exists;
    v_attempts := v_attempts + 1;
  END LOOP;
  RETURN v_value;
END;
$$;

-- Update coupon usage count
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.coupons
  SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

-- Update updated_at for new tables
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 7. ENABLE RLS
-- ============================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- Roles: admin full access, public read
DROP POLICY IF EXISTS "admin_manage_roles" ON public.roles;
CREATE POLICY "admin_manage_roles" ON public.roles
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "public_read_roles" ON public.roles;
CREATE POLICY "public_read_roles" ON public.roles FOR SELECT TO public USING (true);

-- Permissions: admin full access, public read
DROP POLICY IF EXISTS "admin_manage_permissions" ON public.permissions;
CREATE POLICY "admin_manage_permissions" ON public.permissions
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "public_read_permissions" ON public.permissions;
CREATE POLICY "public_read_permissions" ON public.permissions FOR SELECT TO public USING (true);

-- Role Permissions
DROP POLICY IF EXISTS "admin_manage_role_permissions" ON public.role_permissions;
CREATE POLICY "admin_manage_role_permissions" ON public.role_permissions
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Admin Users
DROP POLICY IF EXISTS "admin_manage_admin_users" ON public.admin_users;
CREATE POLICY "admin_manage_admin_users" ON public.admin_users
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Warehouses: admin full, public read
DROP POLICY IF EXISTS "admin_manage_warehouses" ON public.warehouses;
CREATE POLICY "admin_manage_warehouses" ON public.warehouses
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "public_read_warehouses" ON public.warehouses;
CREATE POLICY "public_read_warehouses" ON public.warehouses FOR SELECT TO public USING (true);

-- Inventory: admin full, public read
DROP POLICY IF EXISTS "admin_manage_inventory" ON public.inventory;
CREATE POLICY "admin_manage_inventory" ON public.inventory
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "public_read_inventory" ON public.inventory;
CREATE POLICY "public_read_inventory" ON public.inventory FOR SELECT TO public USING (true);

-- Inventory Movements: admin full
DROP POLICY IF EXISTS "admin_manage_inventory_movements" ON public.inventory_movements;
CREATE POLICY "admin_manage_inventory_movements" ON public.inventory_movements
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Barcodes: admin full, public read
DROP POLICY IF EXISTS "admin_manage_barcodes" ON public.barcodes;
CREATE POLICY "admin_manage_barcodes" ON public.barcodes
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "public_read_barcodes" ON public.barcodes;
CREATE POLICY "public_read_barcodes" ON public.barcodes FOR SELECT TO public USING (true);

-- Coupons: admin full, authenticated read active
DROP POLICY IF EXISTS "admin_manage_coupons" ON public.coupons;
CREATE POLICY "admin_manage_coupons" ON public.coupons
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "users_read_active_coupons" ON public.coupons;
CREATE POLICY "users_read_active_coupons" ON public.coupons
FOR SELECT TO authenticated USING (is_active = true);

-- Coupon Usage
DROP POLICY IF EXISTS "admin_manage_coupon_usage" ON public.coupon_usage;
CREATE POLICY "admin_manage_coupon_usage" ON public.coupon_usage
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "users_manage_own_coupon_usage" ON public.coupon_usage;
CREATE POLICY "users_manage_own_coupon_usage" ON public.coupon_usage
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Banners: admin full, public read active
DROP POLICY IF EXISTS "admin_manage_banners" ON public.banners;
CREATE POLICY "admin_manage_banners" ON public.banners
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "public_read_active_banners" ON public.banners;
CREATE POLICY "public_read_active_banners" ON public.banners
FOR SELECT TO public USING (is_active = true);

-- Settings: admin full, public read
DROP POLICY IF EXISTS "admin_manage_settings" ON public.settings;
CREATE POLICY "admin_manage_settings" ON public.settings
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "public_read_settings" ON public.settings;
CREATE POLICY "public_read_settings" ON public.settings FOR SELECT TO public USING (true);

-- Audit Logs: admin read/insert only
DROP POLICY IF EXISTS "admin_read_audit_logs" ON public.audit_logs;
CREATE POLICY "admin_read_audit_logs" ON public.audit_logs
FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "admin_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

-- Reviews: admin full access
DROP POLICY IF EXISTS "admin_manage_reviews" ON public.reviews;
CREATE POLICY "admin_manage_reviews" ON public.reviews
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Orders: admin full access
DROP POLICY IF EXISTS "admin_manage_orders" ON public.orders;
CREATE POLICY "admin_manage_orders" ON public.orders
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS coupon_usage_increment ON public.coupon_usage;
CREATE TRIGGER coupon_usage_increment
AFTER INSERT ON public.coupon_usage
FOR EACH ROW EXECUTE FUNCTION public.increment_coupon_usage();

DROP TRIGGER IF EXISTS warehouses_updated_at ON public.warehouses;
CREATE TRIGGER warehouses_updated_at
BEFORE UPDATE ON public.warehouses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS inventory_updated_at ON public.inventory;
CREATE TRIGGER inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS barcodes_updated_at ON public.barcodes;
CREATE TRIGGER barcodes_updated_at
BEFORE UPDATE ON public.barcodes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS coupons_updated_at ON public.coupons;
CREATE TRIGGER coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS banners_updated_at ON public.banners;
CREATE TRIGGER banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS admin_users_updated_at ON public.admin_users;
CREATE TRIGGER admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 10. SEED DATA
-- ============================================================

DO $$
DECLARE
  v_super_admin_role_id UUID;
  v_admin_role_id UUID;
  v_inventory_role_id UUID;
  v_order_role_id UUID;
  v_content_role_id UUID;
  v_support_role_id UUID;
  v_default_warehouse_id UUID;
  v_admin_user_id UUID;
  v_product_id UUID;
  v_perm_id UUID;
  v_modules TEXT[] := ARRAY['products', 'categories', 'orders', 'customers', 'inventory', 'warehouses', 'barcodes', 'coupons', 'reviews', 'cms', 'reports', 'settings', 'roles', 'audit_logs'];
  v_actions TEXT[] := ARRAY['view', 'create', 'edit', 'delete', 'export'];
  v_module TEXT;
  v_action TEXT;
BEGIN
  -- Roles
  INSERT INTO public.roles (id, name, description, is_system) VALUES
    (gen_random_uuid(), 'Super Admin', 'Full access to all modules', true),
    (gen_random_uuid(), 'Admin', 'Operational access to most modules', true),
    (gen_random_uuid(), 'Inventory Manager', 'Manage inventory and warehouses', false),
    (gen_random_uuid(), 'Order Manager', 'Manage orders and shipping', false),
    (gen_random_uuid(), 'Content Manager', 'Manage CMS, banners and products', false),
    (gen_random_uuid(), 'Customer Support', 'View orders and customers', false)
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'Super Admin' LIMIT 1;
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
  SELECT id INTO v_inventory_role_id FROM public.roles WHERE name = 'Inventory Manager' LIMIT 1;
  SELECT id INTO v_order_role_id FROM public.roles WHERE name = 'Order Manager' LIMIT 1;
  SELECT id INTO v_content_role_id FROM public.roles WHERE name = 'Content Manager' LIMIT 1;
  SELECT id INTO v_support_role_id FROM public.roles WHERE name = 'Customer Support' LIMIT 1;

  -- Permissions (all module/action combos)
  FOREACH v_module IN ARRAY v_modules LOOP
    FOREACH v_action IN ARRAY v_actions LOOP
      INSERT INTO public.permissions (module, action, description)
      VALUES (v_module, v_action, 'Can ' || v_action || ' ' || v_module)
      ON CONFLICT (module, action) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Assign all permissions to Super Admin
  IF v_super_admin_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_super_admin_role_id, id FROM public.permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;

  -- Default warehouse
  INSERT INTO public.warehouses (id, name, code, city, state, country, is_active, is_default)
  VALUES (gen_random_uuid(), 'Main Warehouse', 'WH-MAIN', 'Mumbai', 'Maharashtra', 'India', true, true)
  ON CONFLICT (code) DO NOTHING;

  SELECT id INTO v_default_warehouse_id FROM public.warehouses WHERE code = 'WH-MAIN' LIMIT 1;

  -- Seed inventory for existing products
  IF v_default_warehouse_id IS NOT NULL THEN
    FOR v_product_id IN SELECT id FROM public.products LOOP
      INSERT INTO public.inventory (product_id, warehouse_id, current_stock, low_stock_threshold)
      SELECT v_product_id, v_default_warehouse_id, COALESCE(p.stock_quantity, 50), 10
      FROM public.products p WHERE p.id = v_product_id
      ON CONFLICT (product_id, warehouse_id) DO NOTHING;
    END LOOP;
  END IF;

  -- Default settings
  INSERT INTO public.settings (setting_key, setting_value, setting_group, label) VALUES
    ('store_name', '"O2 Gears"', 'store', 'Store Name'),
    ('store_email', '"support@o2gears.com"', 'store', 'Store Email'),
    ('store_phone', '"+91 98765 43210"', 'store', 'Store Phone'),
    ('currency', '"INR"', 'store', 'Currency'),
    ('currency_symbol', '"₹"', 'store', 'Currency Symbol'),
    ('tax_rate', '18', 'tax', 'GST Rate (%)'),
    ('tax_included', 'false', 'tax', 'Tax Included in Price'),
    ('free_shipping_threshold', '999', 'shipping', 'Free Shipping Above (₹)'),
    ('default_shipping_cost', '99', 'shipping', 'Default Shipping Cost (₹)'),
    ('low_stock_threshold', '10', 'inventory', 'Low Stock Alert Threshold'),
    ('order_auto_confirm', 'false', 'orders', 'Auto-Confirm Orders'),
    ('review_auto_approve', 'false', 'reviews', 'Auto-Approve Reviews')
  ON CONFLICT (setting_key) DO NOTHING;

  -- Sample coupons
  SELECT id INTO v_admin_user_id FROM public.user_profiles WHERE role = 'admin' LIMIT 1;

  INSERT INTO public.coupons (code, description, coupon_type, discount_value, min_order_value, max_discount, start_date, end_date, usage_limit, is_active, created_by)
  VALUES
    ('WELCOME10', 'Welcome discount 10%', 'percentage'::public.coupon_type, 10, 500, 200, NOW(), NOW() + INTERVAL '1 year', 1000, true, v_admin_user_id),
    ('FLAT200', 'Flat ₹200 off on orders above ₹1499', 'fixed'::public.coupon_type, 200, 1499, NULL, NOW(), NOW() + INTERVAL '6 months', 500, true, v_admin_user_id),
    ('O2LAUNCH', 'Launch offer 15% off', 'percentage'::public.coupon_type, 15, 999, 500, NOW(), NOW() + INTERVAL '3 months', 200, true, v_admin_user_id)
  ON CONFLICT (code) DO NOTHING;

  -- Sample banners
  INSERT INTO public.banners (title, subtitle, description, banner_type, image_url, cta_text, cta_url, is_active, sort_order, created_by)
  VALUES
    ('O2 Eardops — Sound That Moves You', 'Premium True Wireless Earbuds', 'Experience 40-hour battery life, ANC, and crystal-clear audio.', 'hero'::public.banner_type, '/assets/images/O2Earpods_Orange-1790593783106.png', 'Shop Now', '/shop', true, 1, v_admin_user_id),
    ('Launch Offer — 15% Off', 'Use code O2LAUNCH', 'Limited time offer on all O2 Eardops products.', 'promotional'::public.banner_type, '/assets/images/O2Earpods_Blue-1790593772767.png', 'Grab Deal', '/shop', true, 2, v_admin_user_id)
  ON CONFLICT DO NOTHING;

  -- Seed barcodes for existing products
  FOR v_product_id IN SELECT id FROM public.products LOOP
    INSERT INTO public.barcodes (product_id, barcode_value, barcode_format, barcode_status, created_by)
    SELECT
      v_product_id,
      public.generate_barcode_value('EAN13'::public.barcode_format),
      'EAN13'::public.barcode_format,
      'active'::public.barcode_status,
      v_admin_user_id
    WHERE NOT EXISTS (SELECT 1 FROM public.barcodes WHERE product_id = v_product_id);
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;
