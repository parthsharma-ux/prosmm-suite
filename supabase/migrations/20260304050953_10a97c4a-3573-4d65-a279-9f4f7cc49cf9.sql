
-- Drop all existing RESTRICTIVE policies and recreate as PERMISSIVE

-- admin_logs
DROP POLICY IF EXISTS "Admin can manage logs" ON public.admin_logs;
CREATE POLICY "Admin can manage logs" ON public.admin_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- categories
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admin can read all categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can read active categories" ON public.categories;
CREATE POLICY "Admin full access categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read active categories" ON public.categories FOR SELECT TO authenticated USING (status = true);

-- orders
DROP POLICY IF EXISTS "Admin can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Admin full access orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());

-- payment_requests
DROP POLICY IF EXISTS "Admin can manage payments" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can create payments" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can read own payments" ON public.payment_requests;
CREATE POLICY "Admin full access payments" ON public.payment_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create payments" ON public.payment_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users read own payments" ON public.payment_requests FOR SELECT TO authenticated USING (user_id = auth.uid());

-- profiles
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Admin read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- provider_services
DROP POLICY IF EXISTS "Admin can manage provider services" ON public.provider_services;
CREATE POLICY "Admin full access provider services" ON public.provider_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- providers
DROP POLICY IF EXISTS "Admin can manage providers" ON public.providers;
CREATE POLICY "Admin full access providers" ON public.providers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- public_services
DROP POLICY IF EXISTS "Admin can manage services" ON public.public_services;
DROP POLICY IF EXISTS "Admin can read all services" ON public.public_services;
DROP POLICY IF EXISTS "Users can read active services" ON public.public_services;
CREATE POLICY "Admin full access services" ON public.public_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read active services" ON public.public_services FOR SELECT TO authenticated USING (status = true);

-- service_provider_map
DROP POLICY IF EXISTS "Admin can manage service map" ON public.service_provider_map;
CREATE POLICY "Admin full access service map" ON public.service_provider_map FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- transactions
DROP POLICY IF EXISTS "Admin can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
CREATE POLICY "Admin full access transactions" ON public.transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read own transactions" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "Admin can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Admin full access roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
