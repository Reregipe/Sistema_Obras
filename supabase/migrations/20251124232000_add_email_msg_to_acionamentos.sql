-- Adiciona campo para armazenar conteúdo do email (.msg) em texto/base64
ALTER TABLE public.acionamentos
ADD COLUMN IF NOT EXISTS email_msg text;
