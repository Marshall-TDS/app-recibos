-- Marshall Receipts | Adicionar Razão Social
ALTER TABLE public.colaboradores ADD COLUMN razao_social TEXT;

-- Atualizar o comentário da tabela se necessário
COMMENT ON COLUMN public.colaboradores.razao_social IS 'Razão Social da empresa (para colaboradores PJ)';
