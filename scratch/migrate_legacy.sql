-- MARSHALL GOLD | MIGRAÇÃO DE DADOS LEGADOS V3 (Com Razão Social)
DO $$
DECLARE
  v_user_id uuid := (SELECT id FROM auth.users LIMIT 1);
BEGIN
  RAISE NOTICE 'Iniciando migração de % colaboradores...', 6;

  INSERT INTO public.colaboradores (
    nome, documento, cargo, salario_base, razao_social, 
    gratificacao_padrao, dias_fevereiro, tipo_chave_pix, 
    chave_pix, adicionais_padrao, user_id
  ) VALUES (
    'Douglas Lopes Aguiar', '63.217.345/0001-11', 'Desenvolvedor Full Stack', 4000.0, 'Black Swords LTDA',
    20, 20, 'CNPJ',
    '63.217.345/0001-11', '[]'::jsonb, v_user_id
  ) ON CONFLICT (nome, documento) DO UPDATE SET
    cargo = EXCLUDED.cargo,
    razao_social = EXCLUDED.razao_social,
    salario_base = EXCLUDED.salario_base;

  INSERT INTO public.colaboradores (
    nome, documento, cargo, salario_base, razao_social, 
    gratificacao_padrao, dias_fevereiro, tipo_chave_pix, 
    chave_pix, adicionais_padrao, user_id
  ) VALUES (
    'Felipe Quintino Torres', '42.915.167/0001-22', 'Product Owner', 6500.0, '42.915.167 Felipe Quintino Torres',
    20, 20, 'CNPJ',
    '42.915.167/0001-22', '[]'::jsonb, v_user_id
  ) ON CONFLICT (nome, documento) DO UPDATE SET
    cargo = EXCLUDED.cargo,
    razao_social = EXCLUDED.razao_social,
    salario_base = EXCLUDED.salario_base;

  INSERT INTO public.colaboradores (
    nome, documento, cargo, salario_base, razao_social, 
    gratificacao_padrao, dias_fevereiro, tipo_chave_pix, 
    chave_pix, adicionais_padrao, user_id
  ) VALUES (
    'Gabriel Pereira', '63.573.304/0001-68', 'Chief Operating Officer', 10000.0, 'V.I.R.T.U.O.S LTDA',
    20, 30, 'CNPJ',
    '63.573.304/0001-68', '[{"descricao": "Convênio", "valor_mensal": 2800.0}]'::jsonb, v_user_id
  ) ON CONFLICT (nome, documento) DO UPDATE SET
    cargo = EXCLUDED.cargo,
    razao_social = EXCLUDED.razao_social,
    salario_base = EXCLUDED.salario_base;

  INSERT INTO public.colaboradores (
    nome, documento, cargo, salario_base, razao_social, 
    gratificacao_padrao, dias_fevereiro, tipo_chave_pix, 
    chave_pix, adicionais_padrao, user_id
  ) VALUES (
    'Murilo Frizanco', '59.584.517-0001/18', 'Desenvolvedor Full Stack', 10000.0, 'Conect LTDA',
    20, 20, 'CNPJ',
    '59.584.517-0001/18', '[]'::jsonb, v_user_id
  ) ON CONFLICT (nome, documento) DO UPDATE SET
    cargo = EXCLUDED.cargo,
    razao_social = EXCLUDED.razao_social,
    salario_base = EXCLUDED.salario_base;

  INSERT INTO public.colaboradores (
    nome, documento, cargo, salario_base, razao_social, 
    gratificacao_padrao, dias_fevereiro, tipo_chave_pix, 
    chave_pix, adicionais_padrao, user_id
  ) VALUES (
    'Tamires Moreira Frizanco', '59.584.517-0001/18', 'Recursos Humanos', 6000.0, 'Conect LTDA',
    20, 20, 'CNPJ',
    '59.584.517-0001/18', '[]'::jsonb, v_user_id
  ) ON CONFLICT (nome, documento) DO UPDATE SET
    cargo = EXCLUDED.cargo,
    razao_social = EXCLUDED.razao_social,
    salario_base = EXCLUDED.salario_base;

  INSERT INTO public.colaboradores (
    nome, documento, cargo, salario_base, razao_social, 
    gratificacao_padrao, dias_fevereiro, tipo_chave_pix, 
    chave_pix, adicionais_padrao, user_id
  ) VALUES (
    'Thiago Lamberti', '63.490.655/0001-05', 'Chief Technology Officer', 15000.0, 'SURSUM ANIMA TECNOLOGIA E DESENVOLVIMENTO HUMANO LTDA',
    20, 20, 'CNPJ',
    '63.490.655/0001-05', '[{"descricao": "Convênio", "valor_mensal": 3184.78}]'::jsonb, v_user_id
  ) ON CONFLICT (nome, documento) DO UPDATE SET
    cargo = EXCLUDED.cargo,
    razao_social = EXCLUDED.razao_social,
    salario_base = EXCLUDED.salario_base;

  RAISE NOTICE 'Migração concluída com sucesso (V3).';
END $$;