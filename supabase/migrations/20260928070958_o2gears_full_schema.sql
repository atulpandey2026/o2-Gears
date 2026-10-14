-- O2 Gears Full Schema Migration
-- Auth-enabled with products, cart, wishlist, orders, user profiles

-- ============================================================
-- 1. TYPES
-- ============================================================
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'customer');

DROP TYPE IF EXISTS public.order_status CASCADE;
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

DROP TYPE IF EXISTS public.product_status CASCADE;
CREATE TYPE public.product_status AS ENUM ('active', 'draft', 'archived');

-- ============================================================
-- 2. CORE TABLES
-- ============================================================

-- User profiles (linked to auth.users via trigger)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    avatar_url TEXT,
    role public.user_role DEFAULT 'customer'::public.user_role,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT UNIQUE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(10,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    product_status public.product_status DEFAULT 'active'::public.product_status,
    is_featured BOOLEAN DEFAULT false,
    show_on_homepage BOOLEAN DEFAULT false,
    badge TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    -- Image fields
    main_image_url TEXT,
    main_image_alt TEXT,
    -- Technology/component images (JSON array of {url, alt, label})
    technology_images JSONB DEFAULT '[]'::jsonb,
    -- Close-up/detail images (JSON array of {url, alt, label})
    closeup_images JSONB DEFAULT '[]'::jsonb,
    -- Lifestyle images (JSON array of {url, alt})
    lifestyle_images JSONB DEFAULT '[]'::jsonb,
    -- Gallery images (JSON array of {url, alt})
    gallery_images JSONB DEFAULT '[]'::jsonb,
    -- Features (JSON array of {icon, title, description, stat, statLabel})
    features JSONB DEFAULT '[]'::jsonb,
    -- Specifications (JSON array of {label, value})
    specifications JSONB DEFAULT '[]'::jsonb,
    -- Color variants (JSON array of {label, color, border})
    color_variants JSONB DEFAULT '[]'::jsonb,
    -- Tags
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Homepage banners / CMS content
CREATE TABLE IF NOT EXISTS public.homepage_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    image_alt TEXT,
    cta_text TEXT,
    cta_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    extra_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    country TEXT DEFAULT 'India',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    order_status public.order_status DEFAULT 'pending'::public.order_status,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    coupon_code TEXT,
    shipping_method TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    variant_label TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cart items
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_label TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_user_product_variant ON public.cart_items(user_id, product_id, COALESCE(variant_label, ''));

-- Wishlist items
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_product ON public.wishlist_items(user_id, product_id);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    reviewer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    body TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(product_status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_homepage ON public.products(show_on_homepage);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Admin check from auth metadata
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile" ON public.user_profiles
FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_profiles" ON public.user_profiles;
CREATE POLICY "admin_manage_all_profiles" ON public.user_profiles
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- categories (public read, admin write)
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;
CREATE POLICY "admin_manage_categories" ON public.categories
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- products (public read active, admin all)
DROP POLICY IF EXISTS "public_read_active_products" ON public.products;
CREATE POLICY "public_read_active_products" ON public.products
FOR SELECT TO public USING (product_status = 'active'::public.product_status);

DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products" ON public.products
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- homepage_content (public read, admin write)
DROP POLICY IF EXISTS "public_read_homepage" ON public.homepage_content;
CREATE POLICY "public_read_homepage" ON public.homepage_content
FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_homepage" ON public.homepage_content;
CREATE POLICY "admin_manage_homepage" ON public.homepage_content
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- addresses
DROP POLICY IF EXISTS "users_manage_own_addresses" ON public.addresses;
CREATE POLICY "users_manage_own_addresses" ON public.addresses
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- orders
DROP POLICY IF EXISTS "users_view_own_orders" ON public.orders;
CREATE POLICY "users_view_own_orders" ON public.orders
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_create_own_orders" ON public.orders;
CREATE POLICY "users_create_own_orders" ON public.orders
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_orders" ON public.orders;
CREATE POLICY "admin_manage_orders" ON public.orders
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- order_items
DROP POLICY IF EXISTS "users_view_own_order_items" ON public.order_items;
CREATE POLICY "users_view_own_order_items" ON public.order_items
FOR SELECT TO authenticated USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "users_create_order_items" ON public.order_items;
CREATE POLICY "users_create_order_items" ON public.order_items
FOR INSERT TO authenticated WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "admin_manage_order_items" ON public.order_items;
CREATE POLICY "admin_manage_order_items" ON public.order_items
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- cart_items
DROP POLICY IF EXISTS "users_manage_own_cart" ON public.cart_items;
CREATE POLICY "users_manage_own_cart" ON public.cart_items
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- wishlist_items
DROP POLICY IF EXISTS "users_manage_own_wishlist" ON public.wishlist_items;
CREATE POLICY "users_manage_own_wishlist" ON public.wishlist_items
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- reviews (public read, authenticated write own)
DROP POLICY IF EXISTS "public_read_reviews" ON public.reviews;
CREATE POLICY "public_read_reviews" ON public.reviews
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "users_create_reviews" ON public.reviews;
CREATE POLICY "users_create_reviews" ON public.reviews
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_reviews" ON public.reviews;
CREATE POLICY "users_manage_own_reviews" ON public.reviews
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_reviews" ON public.reviews;
CREATE POLICY "admin_manage_reviews" ON public.reviews
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- ============================================================
-- 7. TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_cart_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 8. MOCK DATA
-- ============================================================
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    user_uuid UUID := gen_random_uuid();
    cat_eardops UUID := gen_random_uuid();
    cat_sports UUID := gen_random_uuid();
    prod1_uuid UUID := gen_random_uuid();
    prod2_uuid UUID := gen_random_uuid();
    prod3_uuid UUID := gen_random_uuid();
BEGIN
    -- Auth users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@o2gears.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'O2 Admin', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'user@o2gears.com', crypt('user123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Priya Sharma'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Categories
    INSERT INTO public.categories (id, name, slug, description, is_active, sort_order) VALUES
        (cat_eardops, 'O2 Eardops', 'o2-eardops', 'True Wireless Eardops by O2 Gears', true, 1),
        (cat_sports, 'Sports Eardops', 'sports-eardops', 'Sports & Fitness Eardops', true, 2)
    ON CONFLICT (slug) DO NOTHING;

    -- Products
    INSERT INTO public.products (
        id, name, slug, sku, category_id, description, price, sale_price,
        stock_quantity, product_status, is_featured, show_on_homepage, badge,
        rating, review_count, main_image_url, main_image_alt,
        technology_images, closeup_images, lifestyle_images, gallery_images,
        features, specifications, color_variants
    ) VALUES
    (
        prod1_uuid,
        'O2 Eardop Pro X1',
        'o2-eardop-pro-x1',
        'O2-X1-TW',
        cat_eardops,
        'The O2 Eardop Pro X1 redefines true wireless audio. Hybrid ANC, 12mm drivers, 30-hour battery, IPX5 water resistance, and Bluetooth 5.3 for seamless connectivity.',
        4999, 3499, 48,
        'active'::public.product_status, true, true, 'Best Seller',
        4.8, 342,
        'https://images.unsplash.com/photo-1724246924459-ed90728ceaf9',
        'O2 Eardop Pro X1 true wireless earbuds with charging case, white studio background',
        '[{"url":"https://images.unsplash.com/photo-1565267320115-bafa3fb0518f","alt":"O2 Eardop Pro X1 charging case technology close-up","label":"Fast Charging"},{"url":"https://images.unsplash.com/photo-1695835743477-68f580122cc1","alt":"O2 Eardop Pro X1 Bluetooth connectivity technology","label":"Bluetooth 5.3"}]'::jsonb,
        '[{"url":"https://img.rocket.new/generatedImages/rocket_gen_img_11e17f3ef-1774418660168.png","alt":"O2 Eardop Pro X1 close-up of driver mesh and eartip","label":"12mm Driver"},{"url":"https://images.unsplash.com/photo-1631677624302-55e6178078f1","alt":"O2 Eardop Pro X1 touch control surface close-up","label":"Touch Controls"}]'::jsonb,
        '[{"url":"https://images.unsplash.com/photo-1727174659485-0567349669d2","alt":"Person wearing O2 Eardop Pro X1 during workout"},{"url":"https://images.unsplash.com/photo-1695835743477-68f580122cc1","alt":"O2 Eardop Pro X1 lifestyle shot outdoors"}]'::jsonb,
        '[{"url":"https://images.unsplash.com/photo-1631677624302-55e6178078f1","alt":"O2 Eardop Pro X1 front view"},{"url":"https://img.rocket.new/generatedImages/rocket_gen_img_1fe1a4713-1765259224965.png","alt":"O2 Eardop Pro X1 side view"},{"url":"https://img.rocket.new/generatedImages/rocket_gen_img_11e17f3ef-1774418660168.png","alt":"O2 Eardop Pro X1 close-up"},{"url":"https://images.unsplash.com/photo-1677584658347-fff5917d0535","alt":"O2 Eardop Pro X1 charging case"}]'::jsonb,
        '[{"icon":"SpeakerWaveIcon","title":"Crystal Clear Sound","description":"12mm dynamic drivers deliver rich, immersive audio with deep bass and sparkling highs.","stat":"12mm","statLabel":"Driver Size"},{"icon":"BoltIcon","title":"30-Hour Battery","description":"6 hours on a single charge plus 24 more from the case. Fast charging gives 2 hours in 15 minutes.","stat":"30hrs","statLabel":"Total Playtime"},{"icon":"SignalIcon","title":"Bluetooth 5.3","description":"Latest Bluetooth 5.3 technology ensures stable, low-latency connection up to 10 meters.","stat":"10m","statLabel":"Range"},{"icon":"ShieldCheckIcon","title":"IPX5 Water Resistant","description":"Built for your active lifestyle. Sweat, rain, and splashes are no match for IPX5 protection.","stat":"IPX5","statLabel":"Water Rating"}]'::jsonb,
        '[{"label":"Model","value":"O2-X1-TW"},{"label":"Bluetooth","value":"5.3"},{"label":"Driver Size","value":"12mm Dynamic"},{"label":"Battery (Buds)","value":"6 hours"},{"label":"Battery (Case)","value":"24 hours"},{"label":"Total Playtime","value":"30 hours"},{"label":"Charging","value":"USB-C, 15min = 2hr"},{"label":"ANC","value":"Yes, Hybrid ANC"},{"label":"IP Rating","value":"IPX5"},{"label":"Microphones","value":"6 mics (3 per bud)"},{"label":"Weight","value":"4.5g per bud"},{"label":"Warranty","value":"1 Year"}]'::jsonb,
        '[{"label":"Pearl White","color":"#F5F5F5","border":"#E0E0E0"},{"label":"Midnight Black","color":"#1A1A1A","border":"#333"},{"label":"Ocean Blue","color":"#1A2E6C","border":"#0D1B4B"}]'::jsonb
    ),
    (
        prod2_uuid,
        'O2 Eardop Sport S3',
        'o2-eardop-sport-s3',
        'O2-S3-SP',
        cat_sports,
        'Engineered for athletes. The O2 Eardop Sport S3 features secure-fit ear hooks, IPX7 waterproofing, and powerful bass for your most intense workouts.',
        3299, 2699, 67,
        'active'::public.product_status, true, true, 'Hot',
        4.5, 156,
        'https://images.unsplash.com/photo-1657560566744-06d0b69f6647',
        'O2 Eardop Sport S3 wireless sports earbuds, bright studio lighting',
        '[{"url":"https://images.unsplash.com/photo-1695835743477-68f580122cc1","alt":"O2 Eardop Sport S3 Bluetooth technology","label":"Bluetooth 5.3"},{"url":"https://images.unsplash.com/photo-1565267320115-bafa3fb0518f","alt":"O2 Eardop Sport S3 charging case","label":"Quick Charge"}]'::jsonb,
        '[{"url":"https://images.unsplash.com/photo-1657560566744-06d0b69f6647","alt":"O2 Eardop Sport S3 ear hook close-up","label":"Secure Fit"},{"url":"https://img.rocket.new/generatedImages/rocket_gen_img_16df55184-1770387387146.png","alt":"O2 Eardop Sport S3 water resistance test","label":"IPX7 Rated"}]'::jsonb,
        '[{"url":"https://images.unsplash.com/photo-1727174659485-0567349669d2","alt":"Athlete wearing O2 Eardop Sport S3 during run"}]'::jsonb,
        '[{"url":"https://images.unsplash.com/photo-1657560566744-06d0b69f6647","alt":"O2 Eardop Sport S3 main view"},{"url":"https://images.unsplash.com/photo-1657383236448-5199376c9b87","alt":"O2 Eardop Sport S3 side view"}]'::jsonb,
        '[{"icon":"ShieldCheckIcon","title":"IPX7 Waterproof","description":"Full waterproof protection for swimming and intense workouts.","stat":"IPX7","statLabel":"Water Rating"},{"icon":"SpeakerWaveIcon","title":"Powerful Bass","description":"Enhanced bass drivers tuned for workout motivation.","stat":"10mm","statLabel":"Driver Size"},{"icon":"BoltIcon","title":"24-Hour Battery","description":"All-day battery life with quick charge support.","stat":"24hrs","statLabel":"Playtime"}]'::jsonb,
        '[{"label":"Model","value":"O2-S3-SP"},{"label":"Bluetooth","value":"5.3"},{"label":"Driver Size","value":"10mm Dynamic"},{"label":"Battery","value":"24 hours total"},{"label":"IP Rating","value":"IPX7"},{"label":"Weight","value":"5g per bud"},{"label":"Warranty","value":"1 Year"}]'::jsonb,
        '[{"label":"Midnight Black","color":"#1A1A1A","border":"#333"},{"label":"Ocean Blue","color":"#1A2E6C","border":"#0D1B4B"}]'::jsonb
    ),
    (
        prod3_uuid,
        'O2 Eardop Elite ANC',
        'o2-eardop-elite-anc',
        'O2-E1-ANC',
        cat_eardops,
        'The pinnacle of O2 Eardop engineering. Adaptive ANC, 40-hour battery, premium 13mm drivers, and wireless charging case for the ultimate audio experience.',
        7999, 5999, 12,
        'active'::public.product_status, true, true, 'Premium',
        4.9, 89,
        'https://img.rocket.new/generatedImages/rocket_gen_img_4484e8b64-1790576098992.png',
        'O2 Eardop Elite ANC premium wireless earbuds, luxury product shot',
        '[{"url":"https://images.unsplash.com/photo-1565267320115-bafa3fb0518f","alt":"O2 Eardop Elite ANC wireless charging case","label":"Wireless Charging"},{"url":"https://img.rocket.new/generatedImages/rocket_gen_img_11f086bcb-1767082416485.png","alt":"O2 Eardop Elite ANC driver technology","label":"13mm Driver"}]'::jsonb,
        '[{"url":"https://img.rocket.new/generatedImages/rocket_gen_img_4484e8b64-1790576098992.png","alt":"O2 Eardop Elite ANC close-up of premium finish","label":"Premium Build"},{"url":"https://images.unsplash.com/photo-1631677624302-55e6178078f1","alt":"O2 Eardop Elite ANC microphone array close-up","label":"6-Mic Array"}]'::jsonb,
        '[{"url":"https://images.unsplash.com/photo-1727174659485-0567349669d2","alt":"Person wearing O2 Eardop Elite ANC in premium setting"}]'::jsonb,
        '[{"url":"https://img.rocket.new/generatedImages/rocket_gen_img_4484e8b64-1790576098992.png","alt":"O2 Eardop Elite ANC main view"},{"url":"https://images.unsplash.com/photo-1631677624302-55e6178078f1","alt":"O2 Eardop Elite ANC side view"}]'::jsonb,
        '[{"icon":"SparklesIcon","title":"Adaptive ANC","description":"Industry-leading adaptive noise cancellation with 6-microphone array.","stat":"40dB","statLabel":"Noise Reduction"},{"icon":"BoltIcon","title":"40-Hour Battery","description":"8 hours per charge with wireless charging case for 32 more hours.","stat":"40hrs","statLabel":"Total Playtime"},{"icon":"SpeakerWaveIcon","title":"13mm Drivers","description":"Premium 13mm dynamic drivers with Hi-Res Audio certification.","stat":"13mm","statLabel":"Driver Size"}]'::jsonb,
        '[{"label":"Model","value":"O2-E1-ANC"},{"label":"Bluetooth","value":"5.3"},{"label":"Driver Size","value":"13mm Dynamic"},{"label":"Battery (Buds)","value":"8 hours"},{"label":"Battery (Case)","value":"32 hours"},{"label":"Total Playtime","value":"40 hours"},{"label":"Charging","value":"USB-C + Wireless Qi"},{"label":"ANC","value":"Adaptive ANC, 40dB"},{"label":"IP Rating","value":"IPX5"},{"label":"Microphones","value":"6 mics (3 per bud)"},{"label":"Weight","value":"5g per bud"},{"label":"Warranty","value":"1 Year"}]'::jsonb,
        '[{"label":"Midnight Black","color":"#1A1A1A","border":"#333"}]'::jsonb
    )
    ON CONFLICT (slug) DO NOTHING;

    -- Homepage content
    INSERT INTO public.homepage_content (section_key, title, subtitle, description, image_url, image_alt, cta_text, cta_url, is_active, sort_order) VALUES
        ('hero', 'True Wireless. True Freedom.', 'O2 Eardops', 'Experience premium audio engineered for your lifestyle. Crystal-clear sound, all-day battery, and seamless connectivity.', 'https://images.unsplash.com/photo-1724246924459-ed90728ceaf9', 'O2 Eardop Pro X1 premium wireless earbuds hero shot', 'Explore O2 Eardops', '/shop', true, 1),
        ('promo_banner', 'Season Sale — Up to 30% OFF', 'Limited Time', 'Exclusive deals on premium O2 Eardops. Don''t miss out.', 'https://images.unsplash.com/photo-1727174659485-0567349669d2', 'O2 Eardops promotional banner', 'Shop Sale', '/shop', true, 2)
    ON CONFLICT (section_key) DO NOTHING;

    -- Sample reviews
    INSERT INTO public.reviews (product_id, user_id, reviewer_name, rating, title, body, is_verified) VALUES
        (prod1_uuid, user_uuid, 'Priya Sharma', 5, 'Absolutely love these!', 'Best earbuds I have ever used. Sound quality is incredible and the ANC is top-notch. Battery lasts all day.', true),
        (prod1_uuid, null, 'Arjun Mehta', 4, 'Great value for money', 'Really impressed with the build quality. Fit is comfortable for long sessions.', false),
        (prod1_uuid, null, 'Kavya Reddy', 5, 'Perfect for workouts', 'IPX5 rating is real — went through a heavy rain run and they survived.', false)
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data error: %', SQLERRM;
END $$;
