import sys
import json
import asyncio
import os
from playwright.async_api import async_playwright

# Template HTML Premium (Marshall Gold Edition - v3.1 Professional)
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * {{ box-sizing: border-box; }}
        
        body {{ 
            font-family: 'Inter', sans-serif; 
            margin: 0;
            padding: 0;
            color: #1a1a1a;
            background: #fff;
            -webkit-print-color-adjust: exact;
        }}
        
        .page {{
            width: 210mm;
            height: 297mm;
            position: relative;
            overflow: hidden;
            background: white;
            padding-bottom: 300px;
        }}

        .header {{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            background: #0d0d0d;
            padding: 40px 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
            border-bottom: 4px solid #dbaa3d;
        }}
        
        .brand-section {{
            display: flex;
            flex-direction: column;
            gap: 4px;
        }}
        
        .brand-name {{
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.04em;
            color: #fff;
        }}
        
        .brand-name span {{ color: #dbaa3d; }}
        
        .employer-info {{
            font-size: 10px;
            color: #9ca3af;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }}
        
        .receipt-type {{ text-align: right; }}
        
        .receipt-type h1 {{
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #dbaa3d;
            margin: 0 0 8px 0;
        }}
        
        .ref-tag {{
            display: inline-block;
            padding: 6px 16px;
            background: rgba(219, 170, 61, 0.1);
            color: #dbaa3d;
            font-size: 11px;
            font-weight: 800;
            border-radius: 4px;
            border: 1px solid rgba(219, 170, 61, 0.3);
        }}

        .payment-date {{
            margin-top: 8px;
            font-size: 10px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
        
        .content {{
            margin-top: 180px;
            padding: 0 60px;
        }}

        .info-grid {{
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
        }}
        
        .info-card {{
            padding: 15px 20px;
            background: #f9fafb;
            border-radius: 12px;
            border: 1px solid #f3f4f6;
        }}
        
        .label {{
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            color: #9ca3af;
            letter-spacing: 0.1em;
            margin-bottom: 6px;
        }}
        
        .value {{
            font-size: 14px;
            font-weight: 700;
            color: #111;
        }}
        
        .sub-value {{
            font-size: 11px;
            color: #6b7280;
            font-weight: 600;
            margin-top: 2px;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }}
        
        th {{
            text-align: left;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            color: #9ca3af;
            padding: 12px 15px;
            border-bottom: 1px solid #f3f4f6;
            letter-spacing: 0.05em;
        }}
        
        td {{
            padding: 14px 15px;
            font-size: 12px;
            border-bottom: 1px solid #f3f4f6;
            color: #374151;
        }}
        
        .col-desc {{ font-weight: 700; color: #111; }}
        .col-ref {{ color: #6b7280; font-weight: 500; font-style: italic; font-size: 11px; }}
        .col-val {{ text-align: right; font-weight: 800; font-family: monospace; }}
        
        .total-container {{
            display: flex;
            justify-content: flex-end;
            margin-top: -20px;
            margin-bottom: 40px;
        }}

        .total-box {{
            background: #0d0d0d;
            color: white;
            padding: 20px 40px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            border-right: 8px solid #dbaa3d;
        }}
        
        .total-label {{ font-size: 10px; font-weight: 800; text-transform: uppercase; color: #dbaa3d; letter-spacing: 0.1em; margin-bottom: 4px; }}
        .total-amount {{ font-size: 26px; font-weight: 900; letter-spacing: -0.02em; }}
        
        .pix-section {{
            padding: 20px;
            background: #fdf6e7;
            border-radius: 12px;
            border: 1px solid #f3e9d2;
            display: flex;
            align-items: center;
            gap: 20px;
        }}

        .pix-badge {{
            padding: 8px 12px;
            background: #dbaa3d;
            color: white;
            border-radius: 6px;
            font-weight: 900;
            font-size: 12px;
        }}

        .pix-details p {{ margin: 0; font-size: 10px; color: #856404; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }}
        .pix-key {{ font-size: 14px !important; color: #111 !important; font-weight: 800 !important; font-family: monospace; margin-top: 2px !important; }}
        
        .footer {{
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 60px;
            background: white;
        }}

        .footer-signatures {{
            display: flex;
            justify-content: space-between;
            gap: 60px;
            margin-bottom: 60px;
        }}
        
        .sig-box {{ flex: 1; text-align: center; }}
        .sig-line {{ border-top: 2px solid #edeff2; margin-bottom: 12px; }}
        .sig-text {{ font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; }}
        
        .stamp {{
            border-top: 1px solid #f3f4f6;
            padding-top: 15px;
            text-align: center;
            font-size: 9px;
            color: #d1d5db;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }}
    </style>
</head>
<body>
    <div class="page">
        <header class="header">
            <div class="brand-section">
                <div class="brand-name">Marshall <span>TDS</span></div>
                <div class="employer-info">Empregador: {nome_empregador} • {doc_empregador}</div>
            </div>
            <div class="receipt-type">
                <h1>Recibo de Pagamento</h1>
                <div class="ref-tag">{referencia}</div>
                <div class="payment-date">Pagamento: {data_pagamento}</div>
            </div>
        </header>

        <div class="content">
            <section class="info-grid">
                <div class="info-card">
                    <div class="label">Beneficiário / Colaborador</div>
                    <div class="value">{nome}</div>
                    {razao_social_html}
                    <div class="sub-value">{documento}</div>
                </div>
                <div class="info-card">
                    <div class="label">Cargo / Empresa</div>
                    <div class="value">{cargo}</div>
                    <div class="sub-value">{nome_empresa}</div>
                </div>
            </section>

            <table>
                <thead>
                    <tr>
                        <th class="col-desc">Descrição</th>
                        <th class="col-ref">Ref.</th>
                        <th class="col-val">Valor</th>
                        <th class="col-val">Descontos</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="col-desc">Salário Mensal</td>
                        <td class="col-ref">{referencia_desc}</td>
                        <td class="col-val">R$ {valor_base_row}</td>
                        <td class="col-val">-</td>
                    </tr>
                    <tr>
                        <td class="col-desc">Gratificação / Bônus Profissional</td>
                        <td class="col-ref">{perc_gratificacao}% do Salário</td>
                        <td class="col-val">R$ {valor_gratificacao}</td>
                        <td class="col-val">-</td>
                    </tr>
                    {rows_adicionais}
                    {row_desconto}
                </tbody>
            </table>

            <div class="total-container">
                <div class="total-box">
                    <div class="total-label">Valor do Crédito Líquido</div>
                    <div class="total-amount">R$ {valor_total}</div>
                </div>
            </div>

            <div class="pix-section">
                <div class="pix-badge">PIX</div>
                <div class="pix-details">
                    <p>Método de Pagamento: PIX</p>
                    <p class="pix-key">Chave: {chave_pix}</p>
                </div>
            </div>
        </div>

        <footer class="footer">
            <div class="footer-signatures">
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <div class="sig-text">Assinatura do Recebedor</div>
                </div>
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <div class="sig-text">{nome_empregador}</div>
                </div>
            </div>
            <div class="stamp">Marshall TDS • Gerado Digitalmente em {data_emissao}</div>
        </footer>
    </div>
</body>
</html>
"""

def parse_price(value_str):
    try:
        if not value_str: return 0.0
        return float(value_str.replace('R$', '').replace('.', '').replace(',', '.').strip())
    except:
        return 0.0

async def generate_pdf(data):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Lógica de processamento de valores
        v_base_unit = parse_price(data.get('valor_base_unidade', '0,00'))
        v_base_total = parse_price(data.get('valor_base', '0,00'))
        v_grat_raw = parse_price(data.get('valor_gratificacao', '0,00'))
        
        # Cálculo de porcentagem de gratificação (sempre sobre a base TOTAL do lote)
        perc_grat = 0
        if v_base_total > 0:
            perc_grat = round((v_grat_raw / v_base_total) * 100)
            
        rows_add = ""
        for add in data.get('adicionais_lista', []):
            rows_add += f'<tr><td class="col-desc">{add["descricao"]}</td><td class="col-ref">-</td><td class="col-val">R$ {add["valor"]}</td><td class="col-val">-</td></tr>'
            
        row_desc = ""
        if data.get('valor_desconto', '0,00') != '0,00':
            row_desc = f'<tr><td class="col-desc">Descontos / Retenções Gerais</td><td class="col-ref">-</td><td class="col-val">-</td><td class="col-val" style="color: #dc2626">R$ {data.get("valor_desconto")}</td></tr>'

        razao_social = data.get('razao_social', '')
        razao_social_html = f'<div class="sub-value" style="color: #dbaa3d; font-weight: 700;">{razao_social}</div>' if razao_social else ''

        # Se houver múltiplos meses, o usuário quer que a linha de salário mostre apenas 1 mês (valor unitário)
        # por clareza da ficha do colaborador.
        valor_base_row = data.get('valor_base_unidade', data.get('valor_base', '0,00'))
        
        html_content = HTML_TEMPLATE.format(
            nome=data.get('nome', 'N/A'),
            razao_social_html=razao_social_html,
            documento=data.get('documento', 'N/A'),
            cargo=data.get('cargo', 'N/A'),
            nome_empresa=data.get('nome_empresa', 'N/A'),
            nome_empregador=data.get('nome_empregador', 'Natan Portela da Silva'),
            doc_empregador=data.get('doc_empregador', '444.618.778-33'),
            referencia=data.get('referencia', 'N/A'),
            referencia_desc=f"Salário Mensal",
            data_pagamento=data.get('data', 'N/A'),
            valor_base_row=valor_base_row,
            perc_gratificacao=perc_grat,
            valor_gratificacao=data.get('valor_gratificacao', '0,00'),
            rows_adicionais=rows_add,
            row_desconto=row_desc,
            valor_total=data.get('valor', '0,00'),
            chave_pix=data.get('chave_pix', 'Não informada'),
            data_emissao=data.get('data_emissao', 'N/A')
        )
        
        await page.set_content(html_content)
        await page.wait_for_load_state('networkidle')
        
        output_path = data.get('output_path', 'recibo.pdf')
        await page.pdf(path=output_path, format="A4", print_background=True)
        await browser.close()
        return output_path

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(1)
    try:
        input_data = json.loads(sys.argv[1])
        result_path = asyncio.run(generate_pdf(input_data))
        print(f"OK: {result_path}")
    except Exception as e:
        print(f"FAIL: {str(e)}")
        sys.exit(1)
