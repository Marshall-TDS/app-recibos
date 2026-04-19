import { chromium } from 'playwright-core';
import chromiumMin from '@sparticuz/chromium-min';

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * { box-sizing: border-box; }
        
        body { 
            font-family: 'Inter', sans-serif; 
            margin: 0;
            padding: 0;
            color: #1a1a1a;
            background: #fff;
            -webkit-print-color-adjust: exact;
        }
        
        .page {
            width: 210mm;
            height: 297mm;
            position: relative;
            overflow: hidden;
            background: white;
            padding-bottom: 300px;
        }

        .header {
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
        }
        
        .brand-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .brand-name {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.04em;
            color: #fff;
        }
        
        .brand-name span { color: #dbaa3d; }
        
        .employer-info {
            font-size: 10px;
            color: #9ca3af;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        
        .receipt-type { text-align: right; }
        
        .receipt-type h1 {
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #dbaa3d;
            margin: 0 0 8px 0;
        }
        
        .ref-tag {
            display: inline-block;
            padding: 6px 16px;
            background: rgba(219, 170, 61, 0.1);
            color: #dbaa3d;
            font-size: 11px;
            font-weight: 800;
            border-radius: 4px;
            border: 1px solid rgba(219, 170, 61, 0.3);
        }

        .payment-date {
            margin-top: 8px;
            font-size: 10px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .content {
            margin-top: 180px;
            padding: 0 60px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .info-card {
            padding: 15px 20px;
            background: #f9fafb;
            border-radius: 12px;
            border: 1px solid #f3f4f6;
        }
        
        .label {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            color: #9ca3af;
            letter-spacing: 0.1em;
            margin-bottom: 6px;
        }
        
        .value {
            font-size: 14px;
            font-weight: 700;
            color: #111;
        }
        
        .sub-value {
            font-size: 11px;
            color: #6b7280;
            font-weight: 600;
            margin-top: 2px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }
        
        th {
            text-align: left;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            color: #9ca3af;
            padding: 12px 15px;
            border-bottom: 1px solid #f3f4f6;
            letter-spacing: 0.05em;
        }
        
        td {
            padding: 14px 15px;
            font-size: 12px;
            border-bottom: 1px solid #f3f4f6;
            color: #374151;
        }
        
        .col-desc { font-weight: 700; color: #111; }
        .col-ref { color: #6b7280; font-weight: 500; font-style: italic; font-size: 11px; }
        .col-val { text-align: right; font-weight: 800; font-family: monospace; }
        
        .total-container {
            display: flex;
            justify-content: flex-end;
            margin-top: -20px;
            margin-bottom: 40px;
        }

        .total-box {
            background: #0d0d0d;
            color: white;
            padding: 20px 40px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            border-right: 8px solid #dbaa3d;
        }
        
        .total-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #dbaa3d; letter-spacing: 0.1em; margin-bottom: 4px; }
        .total-amount { font-size: 26px; font-weight: 900; letter-spacing: -0.02em; }
        
        .pix-section {
            padding: 20px;
            background: #fdf6e7;
            border-radius: 12px;
            border: 1px solid #f3e9d2;
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .pix-badge {
            padding: 8px 12px;
            background: #dbaa3d;
            color: white;
            border-radius: 6px;
            font-weight: 900;
            font-size: 12px;
        }

        .pix-details p { margin: 0; font-size: 10px; color: #856404; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .pix-key { font-size: 14px !important; color: #111 !important; font-weight: 800 !important; font-family: monospace; margin-top: 2px !important; }
        
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 60px;
            background: white;
        }

        .footer-signatures {
            display: flex;
            justify-content: space-between;
            gap: 60px;
            margin-bottom: 60px;
        }
        
        .sig-box { flex: 1; text-align: center; }
        .sig-line { border-top: 2px solid #edeff2; margin-bottom: 12px; }
        .sig-text { font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; }
        
        .stamp {
            border-top: 1px solid #f3f4f6;
            padding-top: 15px;
            text-align: center;
            font-size: 9px;
            color: #d1d5db;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }
    </style>
</head>
<body>
    <div class="page">
        <header class="header">
            <div class="brand-section">
                <div class="brand-name">Marshall <span>TDS</span></div>
                <div class="employer-info">
                    <div>Empregador: {{nome_empregador}}</div>
                    <div>{{doc_empregador}}</div>
                </div>
            </div>
            <div class="receipt-type">
                <h1>Recibo de Pagamento</h1>
                <div class="ref-tag">{{referencia}}</div>
                <div class="payment-date">Pagamento: {{data_pagamento}}</div>
            </div>
        </header>

        <div class="content">
            <section class="info-grid">
                <div class="info-card">
                    <div class="label">Beneficiário / Colaborador</div>
                    <div class="value">{{nome}}</div>
                    {{razao_social_html}}
                    <div class="sub-value">{{documento}}</div>
                </div>
                <div class="info-card">
                    <div class="label">Cargo / Empresa</div>
                    <div class="value">{{cargo}}</div>
                    <div class="sub-value">{{nome_empresa}}</div>
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
                        <td class="col-ref">{{referencia_desc}}</td>
                        <td class="col-val">R$ {{valor_base_row}}</td>
                        <td class="col-val">-</td>
                    </tr>
                    <tr>
                        <td class="col-desc">Gratificação / Bônus Profissional</td>
                        <td class="col-ref">{{perc_gratificacao}}% do Salário</td>
                        <td class="col-val">R$ {{valor_gratificacao}}</td>
                        <td class="col-val">-</td>
                    </tr>
                    {{rows_adicionais}}
                    {{row_desconto}}
                </tbody>
            </table>

            <div class="total-container">
                <div class="total-box">
                    <div class="total-label">Valor do Crédito Líquido</div>
                    <div class="total-amount">R$ {{valor_total}}</div>
                </div>
            </div>

            <div class="pix-section">
                <div class="pix-badge">PIX</div>
                <div class="pix-details">
                    <p>Método de Pagamento: PIX</p>
                    <p class="pix-key">Chave: {{chave_pix}}</p>
                </div>
            </div>
        </div>

        <footer class="footer">
            <div class="footer-signatures">
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <div class="sig-text">{{nome}}</div>
                </div>
                <div class="sig-box">
                    <div class="sig-line"></div>
                    <div class="sig-text">{{nome_empregador}}</div>
                </div>
            </div>
            <div class="stamp">Marshall TDS • Gerado em {{data_emissao}}</div>
        </footer>
    </div>
</body>
</html>
`;

function parsePrice(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

export async function generateReceiptPDF(data: any): Promise<Buffer> {
  const isProd = process.env.NODE_ENV === 'production';
  
  let browser;
  if (isProd) {
    browser = await chromium.launch({
      args: chromiumMin.args,
      executablePath: await chromiumMin.executablePath(),
      headless: true,
    });
  } else {
    browser = await chromium.launch({ headless: true });
  }

  try {
    const page = await browser.newPage();
    
    // Lógica de processamento de valores
    const vBaseTotal = parsePrice(data.valor_base || '0,00');
    const vGratRaw = parsePrice(data.valor_gratificacao || '0,00');
    
    const percGrat = vBaseTotal > 0 ? Math.round((vGratRaw / vBaseTotal) * 100) : 0;
    
    let rowsAdd = "";
    (data.adicionais_lista || []).forEach((add: any) => {
      rowsAdd += `<tr><td class="col-desc">${add.descricao}</td><td class="col-ref">-</td><td class="col-val">R$ ${add.valor}</td><td class="col-val">-</td></tr>`;
    });
    
    let rowDesc = "";
    if (data.valor_desconto && data.valor_desconto !== '0,00') {
      rowDesc = `<tr><td class="col-desc">Descontos / Retenções Gerais</td><td class="col-ref">-</td><td class="col-val">-</td><td class="col-val" style="color: #dc2626">R$ ${data.valor_desconto}</td></tr>`;
    }

    const razaoSocialHtml = data.razao_social 
      ? `<div class="sub-value" style="color: #dbaa3d; font-weight: 700;">${data.razao_social}</div>` 
      : '';

    const valorBaseRow = data.valor_base_unidade || data.valor_base || '0,00';
    
    const placeholders: Record<string, string> = {
      nome: data.nome || 'N/A',
      razao_social_html: razaoSocialHtml,
      documento: data.documento || 'N/A',
      cargo: data.cargo || 'N/A',
      nome_empresa: data.nome_empresa || 'N/A',
      nome_empregador: data.nome_empregador || 'Natan Portela da Silva',
      doc_empregador: data.doc_empregador || '444.618.778-33',
      referencia: data.referencia || 'N/A',
      referencia_desc: "Salário Mensal",
      data_pagamento: data.data || 'N/A',
      valor_base_row: valorBaseRow,
      perc_gratificacao: percGrat.toString(),
      valor_gratificacao: data.valor_gratificacao || '0,00',
      rows_adicionais: rowsAdd,
      row_desconto: rowDesc,
      valor_total: data.valor || '0,00',
      chave_pix: data.chave_pix || 'Não informada',
      data_emissao: data.data_emissao || new Date().toLocaleDateString('pt-BR')
    };

    let populatedHtml = HTML_TEMPLATE;
    Object.keys(placeholders).forEach(key => {
      populatedHtml = populatedHtml.replace(new RegExp(`{{${key}}}`, 'g'), placeholders[key]);
    });

    await page.setContent(populatedHtml);
    await page.waitForLoadState('networkidle');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
