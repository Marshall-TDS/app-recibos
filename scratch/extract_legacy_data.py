import os
import re
import json
from pypdf import PdfReader

def extract_data_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    page = reader.pages[0]
    text = page.extract_text()
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    data = {
        "nome": "",
        "documento": "",
        "cargo": "",
        "salario_base": 0.0,
        "gratificacao_padrao": 20,
        "dias_fevereiro": 20 if "(até 20/02)" in text else 30,
        "adicionais_padrao": [],
        "razao_social": "",
        "tipo_chave_pix": "CNPJ",
        "chave_pix": ""
    }

    try:
        colab_idx = -1
        for i, line in enumerate(lines):
            if "COLABORADOR" in line.upper():
                colab_idx = i
                break
        
        if colab_idx != -1:
            data["nome"] = lines[colab_idx + 1]
            doc_pattern = r'(\d{2,3}\.\d{3}\.\d{3}[/.-]\d{4}[/.-]\d{2})|(\d{3}\.\d{3}\.\d{3}\-\d{2})'
            
            for i in range(colab_idx + 2, min(colab_idx + 6, len(lines))):
                match = re.search(doc_pattern, lines[i])
                if match:
                    data["documento"] = match.group(0)
                    data["chave_pix"] = match.group(0)
                    # Empresa/Razão Social é o que estiver entre o nome e o documento
                    data["razao_social"] = " ".join(lines[colab_idx+2 : i]).replace("'", "''")
                    break
    except:
        pass

    # Cargo
    try:
        for i, line in enumerate(lines):
            if "CARGO" in line.upper():
                data["cargo"] = lines[i+1].replace("'", "''")
                break
    except:
        pass

    # Financeiro
    for line in lines:
        if "Salário Base Mensal" in line:
            match = re.search(r'R\$\s*([\d.]+,\d{2})', line)
            if match:
                data["salario_base"] = float(match.group(1).replace('.', '').replace(',', '.'))
        
        if "Gratificação" in line:
            match = re.search(r'Gratificação\s*(\d+)%', line)
            if match:
                data["gratificacao_padrao"] = int(match.group(1))

        if re.match(r'^[1-8]\d\d\s+', line):
            match = re.search(r'^\d{3}\s+(.*?)\s+Mensal:\s*R\$\s*([\d.]+,\d{2})', line)
            if match:
                desc = match.group(1).strip()
                val = float(match.group(2).replace('.', '').replace(',', '.'))
                if "Salário Base" not in desc:
                    data["adicionais_padrao"].append({
                        "descricao": desc,
                        "valor_mensal": val
                    })

    return data

def main():
    recibos_dir = "legacy/recibos"
    all_colabs = {}

    files = sorted([f for f in os.listdir(recibos_dir) if f.endswith("_colaborador.pdf")])
    
    for filename in files:
        path = os.path.join(recibos_dir, filename)
        try:
            colab_info = extract_data_from_pdf(path)
            ukey = f"{colab_info['nome']}_{colab_info['cargo']}"
            all_colabs[ukey] = colab_info
        except Exception as e:
            print(f"Erro em {filename}: {e}")

    # Gerar SQL Final e Limpo (Mapeado para nova coluna razao_social)
    sql = []
    sql.append("-- MARSHALL GOLD | MIGRAÇÃO DE DADOS LEGADOS V3 (Com Razão Social)")
    sql.append("DO $$")
    sql.append("DECLARE")
    sql.append("  v_user_id uuid := (SELECT id FROM auth.users LIMIT 1);")
    sql.append("BEGIN")
    sql.append("  RAISE NOTICE 'Iniciando migração de % colaboradores...', " + str(len(all_colabs)) + ";")

    for c in all_colabs.values():
        adj_json = json.dumps(c['adicionais_padrao'], ensure_ascii=False)
        nome = c['nome'].replace("'", "''")
        cargo = c['cargo'].replace("'", "''")
        razao = c['razao_social']
        
        stmt = f"""
  INSERT INTO public.colaboradores (
    nome, documento, cargo, salario_base, razao_social, 
    gratificacao_padrao, dias_fevereiro, tipo_chave_pix, 
    chave_pix, adicionais_padrao, user_id
  ) VALUES (
    '{nome}', '{c['documento']}', '{cargo}', {c['salario_base']}, '{razao}',
    {c['gratificacao_padrao']}, {c['dias_fevereiro']}, '{c['tipo_chave_pix']}',
    '{c['chave_pix']}', '{adj_json}'::jsonb, v_user_id
  ) ON CONFLICT (nome, documento) DO UPDATE SET
    cargo = EXCLUDED.cargo,
    razao_social = EXCLUDED.razao_social,
    salario_base = EXCLUDED.salario_base;"""
        sql.append(stmt)
        
    sql.append("\n  RAISE NOTICE 'Migração concluída com sucesso (V3).';")
    sql.append("END $$;")

    with open("scratch/migrate_legacy.sql", "w", encoding='utf-8') as f:
        f.write("\n".join(sql))
    
    print(f"Sucesso: {len(all_colabs)} colaboradores migrados para V3.")
    print("Verifique o arquivo: scratch/migrate_legacy.sql")

if __name__ == "__main__":
    main()
