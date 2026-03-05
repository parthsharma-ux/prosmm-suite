INSERT INTO public.payment_settings (setting_key, setting_value)
VALUES ('usd_to_inr_rate', '83.50')
ON CONFLICT DO NOTHING;