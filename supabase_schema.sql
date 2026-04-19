-- Marshall Receipts | Supabase Schema

-- 1. Tabela de Colaboradores (Recipients)
create table public.colaboradores (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  documento text, -- CPF/CNPJ
  cargo text,
  salario_base decimal(10,2),
  ativo boolean default true,
  user_id uuid references auth.users(id) -- O administrador que cadastrou
);

-- 2. Tabela de Recibos Gerados (History)
create table public.recibos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  colaborador_id uuid references public.colaboradores(id) on delete set null,
  data_referencia date not null,
  valor_total decimal(10,2) not null,
  meta_data jsonb, -- Detalhes extras (descontos, bônus, etc.)
  pdf_url text,    -- Caso queira armazenar o arquivo no Supabase Storage
  user_id uuid references auth.users(id)
);

-- RLS Policies (Simplificadas para Administração)
alter table public.colaboradores enable row level security;
alter table public.recibos enable row level security;

create policy "Admins can manage all colaboradores"
  on public.colaboradores for all
  using ( auth.uid() = user_id );

create policy "Admins can manage all recibos"
  on public.recibos for all
  using ( auth.uid() = user_id );
