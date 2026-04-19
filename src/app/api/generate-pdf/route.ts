import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase interno para uso na API Route (Server Side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      colaborador: colabPassed, // Dados passados diretamente do front para evitar RLS lag/miss
      valor, 
      valor_base, 
      valor_gratificacao, 
      adicionais_lista,
      data: dataPagamento, 
      referencia, 
      observacoes,
      via = 'Colaborador'
    } = data;

    // 1. Buscar configurações do Pagador (ainda necessário ou podemos passar também?)
    // Vamos tentar buscar a config, se falhar usamos um default seguro
    const { data: config } = await supabase.from('configuracoes').select('*').limit(1).single();

    const colaborador = colabPassed;

    if (!colaborador) {
      return NextResponse.json({ success: false, error: 'Colaborador não encontrado' }, { status: 404 });
    }

    // 2. Preparar diretório de saída
    const outputDir = path.join(process.cwd(), 'public', 'generated_recibos');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Nomenclatura solicitada: $nomeColaborador_$documento_(empresa|colaborador).pdf
    const safeName = colaborador.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeDoc = (colaborador.documento || '').replace(/\D/g, '');
    const viaSuffix = via.toLowerCase() === 'empresa' ? 'empresa' : 'colaborador';
    const filename = `${safeName}_${safeDoc}_${viaSuffix}.pdf`;
    const outputPath = path.join(outputDir, filename);

    // 3. Formatar dados para o motor Python
    const pythonData = {
      nome: colaborador.nome,
      documento: colaborador.documento || 'NÃO INFORMADO',
      cargo: colaborador.cargo || 'Colaborador',
      nome_empresa: colaborador.nome_empresa || 'Marshall TDS',
      razao_social: colaborador.razao_social || '',
      nome_empregador: config?.nome_pagador || 'Natan Portela da Silva',
      doc_empregador: config?.documento_pagador || '444.618.778-33',
      valor: valor,
      valor_base: valor_base,
      valor_gratificacao: valor_gratificacao,
      adicionais_lista: adicionais_lista || [],
      chave_pix: colaborador.chave_pix || 'Não informada',
      via: via,
      data_emissao: new Date(dataPagamento).toLocaleDateString('pt-BR'),
      referencia: referencia,
      observacoes: observacoes,
      output_path: outputPath
    };

    const pythonScriptPath = path.join(process.cwd(), 'generator', 'pdf_engine.py');
    const pythonExecutablePath = path.join(process.cwd(), 'generator', 'venv', 'bin', 'python3');

    return new Promise<Response>((resolve) => {
      const pyProcess = spawn(pythonExecutablePath, [pythonScriptPath, JSON.stringify(pythonData)]);

      let output = '';
      let errorText = '';

      pyProcess.stdout.on('data', (d) => { output += d.toString(); });
      pyProcess.stderr.on('data', (d) => { errorText += d.toString(); });

      pyProcess.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({ 
            success: true, 
            pdfUrl: `/generated_recibos/${filename}`,
            filename: filename,
            message: 'PDF gerado com sucesso.'
          }));
        } else {
          resolve(NextResponse.json({ success: false, error: 'Erro no processamento do PDF' }, { status: 500 }));
        }
      });
    });

  } catch (err: any) {
    console.error('Erro na API Generate PDF:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
