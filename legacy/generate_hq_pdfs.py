import os
import asyncio
import re

# Set local temp directory for Playwright
base_path = os.path.abspath(".")
tmp_dir = os.path.join(base_path, "tmp_playwright")
if not os.path.exists(tmp_dir):
    os.makedirs(tmp_dir)
os.environ["TMPDIR"] = tmp_dir

from playwright.async_api import async_playwright

async def generate_pdfs():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load local index.html
        index_file = f"file://{base_path}/index.html"
        
        print(f"Carregando {index_file}...")
        await page.goto(index_file)

        # Espera os recibos renderizarem inicialmente
        await page.wait_for_selector(".receipt-container")

        # Pega a quantidade total de guias (6 colaboradores * 2 vias = 12)
        try:
            receipt_count = await page.evaluate("document.querySelectorAll('.receipt-container').length")
            print(f"Total de guias para processar: {receipt_count}")
        except Exception as e:
            print(f"Erro ao contar recibos: {e}")
            await browser.close()
            return

        output_dir = os.path.join(base_path, "recibos")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        for i in range(receipt_count):
            # Extrai metadados para o nome do arquivo
            # Acessa employeesData diretamente (não via window.)
            try:
                metadata = await page.evaluate(f"""(idx) => {{
                    const empIdx = Math.floor(idx / 2);
                    const guideNum = (idx % 2) + 1;
                    const emp = employeesData[empIdx];
                    const type = (guideNum === 1) ? 'colaborador' : 'empresa';
                    return {{ name: emp.nome_funcionario, doc: emp.documento, type: type }};
                }}""", i)
            except Exception as e:
                print(f"Erro ao extrair metadados para índice {i}: {e}")
                continue

            first_name = metadata['name'].split(' ')[0].lower()
            doc_clean = re.sub(r'[^0-9]', '', metadata['doc'])
            filename = f"{first_name}_{doc_clean}_{metadata['type']}.pdf"
            filepath = os.path.join(output_dir, filename)

            print(f"[{i+1}/{receipt_count}] Gerando PDF Vetorial HQ: {filename}...")

            # Renderiza apenas a guia atual
            await page.evaluate(f"renderSingleGuide({i})")
            
            # Pausa para garantir renderização de fontes e layout
            await asyncio.sleep(0.8)

            # Gera o PDF (VETORIAL - Alta Qualidade)
            # Salvando via buffer para evitar erros de permissão de IO do processo do browser
            try:
                pdf_bytes = await page.pdf(
                    format="A4",
                    print_background=True,
                    margin={"top": "0.5cm", "right": "0.5cm", "bottom": "0.5cm", "left": "0.5cm"}
                )
                
                with open(filepath, "wb") as f:
                    f.write(pdf_bytes)
            except Exception as e:
                print(f"Erro ao gerar PDF para {filename}: {e}")

        await browser.close()
        print("\nPronto! Todos os PDFs foram gerados em ALTA QUALIDADE.")

if __name__ == "__main__":
    asyncio.run(generate_pdfs())
