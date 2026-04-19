-- MARSHALL RECEIPTS v2.3 | MASTER ACCESS SCRIPT
-- Execute este script no SQL Editor do Supabase para habilitar o acesso Master.

-- 1. Criar política para permitir que usuários Master vejam todos os COLABORADORES
DROP POLICY IF EXISTS "Admins can manage all colaboradores" ON public.colaboradores;
CREATE POLICY "Admins can manage all colaboradores"
ON public.colaboradores FOR ALL
USING (
  auth.uid() = user_id 
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'master'
);

-- 2. Criar política para permitir que usuários Master vejam todos os RECIBOS
DROP POLICY IF EXISTS "Admins can manage all recibos" ON public.recibos;
CREATE POLICY "Admins can manage all recibos"
ON public.recibos FOR ALL
USING (
  auth.uid() = user_id 
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'master'
);

-- 3. Criar política para permitir que usuários Master vejam todas as CONFIGURAÇÕES
DROP POLICY IF EXISTS "Admins can manage their own config" ON public.configuracoes;
CREATE POLICY "Admins can manage their own config"
ON public.configuracoes FOR ALL
USING (
  auth.uid() = user_id 
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'master'
);

-- 4. COMANDO PARA DEFINIR VOCÊ COMO MASTER (Substitua o email abaixo)
-- UPDATE auth.users 
-- SET raw_app_metadata_params = raw_app_metadata_params || jsonb_build_object('role', 'master')
-- WHERE email = 'seu-email@exemplo.com';

-- NOTA: O comando acima pode variar dependendo da versão do Supabase. 
-- Uma forma garantida é usar a função admin do Supabase via Dashboard:
-- Dashboard > Authentication > Users > [Seu Usuário] > Edit User Metadata > Add "role": "master"
