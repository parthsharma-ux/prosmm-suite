
-- Table for admin-managed payment settings (QR code, TRC20 address)
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access payment_settings"
ON public.payment_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can read settings
CREATE POLICY "Users read payment_settings"
ON public.payment_settings FOR SELECT
TO authenticated
USING (true);

-- Seed default settings
INSERT INTO public.payment_settings (setting_key, setting_value) VALUES
  ('upi_qr_url', ''),
  ('trc20_address', '');
