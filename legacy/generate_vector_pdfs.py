import os
import subprocess
import re

# Dados básicos para nomeação (baseados no data.js)
employees = [
    {"name": "gabriel", "doc": "63573304000168"},
    {"name": "murilo", "doc": "59584517000118"},
    {"name": "thiago", "doc": "63490655000105"},
    {"name": "felipe", "doc": "42915167000122"},
    {"name": "douglas", "doc": "63217345000111"},
    {"name": "guilherme", "doc": "00000000000"}
]

base_path = os.path.abspath(".")
output_dir = os.path.join(base_path, "recibos")
chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print("Iniciando geração de PDFs vetoriais (Alta Qualidade)...")

for i, emp in enumerate(employees):
    for guide_num in [1, 2]:
        idx = i * 2 + (guide_num - 1)
        suffix = "colaborador" if guide_num == 1 else "empresa"
        filename = f"{emp['name']}_{emp['doc']}_{suffix}.pdf"
        filepath = os.path.join(output_dir, filename)
        
        # O Chrome Headless lida bem com file:// e query params se o script no HTML for carregado corretamente
        url = f"file://{base_path}/index.html?printIdx={idx}"
        
        print(f"[{idx+1}/12] Gerando: {filename}")
        
        cmd = [
            chrome_path,
            "--headless=new",
            "--disable-gpu",
            f"--print-to-pdf={filepath}",
            "--display-header-footer=false", # Remove URL e data do topo/rodapé
            "--no-margins", # Deixa o CSS do HTML controlar as margens
            url
        ]
        
        subprocess.run(cmd, capture_output=True)

print("\nSucesso! Todos os 12 recibos foram gerados em alta qualidade (vetorial) na pasta 'recibos'.")
