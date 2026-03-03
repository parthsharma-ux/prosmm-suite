
-- Enum types
CREATE TYPE public.user_status AS ENUM ('active', 'suspended');
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'completed', 'partial', 'cancelled', 'failed');
CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit', 'refund', 'adjustment');
CREATE TYPE public.payment_method AS ENUM ('upi', 'usdt');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Providers
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  priority INTEGER NOT NULL DEFAULT 1,
  status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Provider Services
CREATE TABLE public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  external_service_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC(12,4) NOT NULL DEFAULT 0,
  min INTEGER NOT NULL DEFAULT 1,
  max INTEGER NOT NULL DEFAULT 10000,
  type TEXT,
  description TEXT,
  status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- Public Services
CREATE TABLE public.public_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  retail_rate NUMERIC(12,4) NOT NULL DEFAULT 0,
  min INTEGER NOT NULL DEFAULT 1,
  max INTEGER NOT NULL DEFAULT 10000,
  status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.public_services ENABLE ROW LEVEL SECURITY;

-- Service Provider Map
CREATE TABLE public.service_provider_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_service_id UUID REFERENCES public.public_services(id) ON DELETE CASCADE NOT NULL,
  provider_service_id UUID REFERENCES public.provider_services(id) ON DELETE CASCADE NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  custom_margin NUMERIC(8,2) DEFAULT 0,
  failover_enabled BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.service_provider_map ENABLE ROW LEVEL SECURITY;

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  public_service_id UUID REFERENCES public.public_services(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_order_id TEXT,
  link TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  charge NUMERIC(12,4) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Payment Requests
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  method payment_method NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reference TEXT NOT NULL,
  screenshot_url TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reference)
);
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Admin Logs
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles: admin can read all, users can read own
CREATE POLICY "Admin can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- categories: everyone can read enabled, admin can manage
CREATE POLICY "Anyone can read active categories" ON public.categories FOR SELECT TO authenticated USING (status = true);
CREATE POLICY "Admin can read all categories" ON public.categories FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- providers: admin only
CREATE POLICY "Admin can manage providers" ON public.providers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- provider_services: admin only
CREATE POLICY "Admin can manage provider services" ON public.provider_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- public_services: users can read enabled, admin can manage
CREATE POLICY "Users can read active services" ON public.public_services FOR SELECT TO authenticated USING (status = true);
CREATE POLICY "Admin can read all services" ON public.public_services FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage services" ON public.public_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- service_provider_map: admin only
CREATE POLICY "Admin can manage service map" ON public.service_provider_map FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- orders: users read own, admin read all
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can manage all orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- transactions: users read own, admin read all
CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage transactions" ON public.transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- payment_requests: users read/insert own, admin manage all
CREATE POLICY "Users can read own payments" ON public.payment_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create payments" ON public.payment_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can manage payments" ON public.payment_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- admin_logs: admin only
CREATE POLICY "Admin can manage logs" ON public.admin_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false);

CREATE POLICY "Users can upload screenshots" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can read own screenshots" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admin can read all screenshots" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'));
