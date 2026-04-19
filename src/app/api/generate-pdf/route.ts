import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReceiptPDF } from '@/lib/pdf-service';

// Cliente Supabase interno para uso na API Route (Server Side)
// Utilizando service_role para garantir upload no bucket privado
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      colaborador: colaborador,
      valor, 
      valor_base, 
      valor_base_unidade,
      valor_gratificacao, 
      valor_desconto,
      adicionais_lista,
      data: dataPagamento, 
      referencia, 
      observacoes,
      via = 'Colaborador'
    } = data;

    if (!colaborador) {
      return NextResponse.json({ success: false, error: 'Colaborador não encontrado' }, { status: 404 });
    }

    // 1. Buscar configurações do Pagador caso necessário
    const { data: config } = await supabase.from('configuracoes').select('*').limit(1).single();

    // 2. Formatar dados para o motor PDF
    const pdfData = {
      ...data,
      nome: colaborador.nome,
      documento: colaborador.documento || 'N/A',
      cargo: colaborador.cargo || 'N/A',
      nome_empresa: colaborador.nome_empresa || 'Marshall TDS',
      razao_social: colaborador.razao_social || '',
      nome_empregador: config?.nome_pagador || 'Natan Portela da Silva',
      doc_empregador: config?.documento_pagador || '444.618.778-33',
      valor,
      valor_base,
      valor_base_unidade,
      valor_gratificacao,
      valor_desconto,
      adicionais_lista,
      data: dataPagamento ? dataPagamento.split('-').reverse().join('/') : 'N/A',
      referencia,
      observacoes,
      via,
      data_emissao: new Date().toLocaleDateString('pt-BR'),
      chave_pix: colaborador.chave_pix || 'Não informada'
    };

    // 3. Gerar o PDF no motor nativo (Vercel Ready)
    const pdfBuffer = await generateReceiptPDF(pdfData);

    // 4. Salvar no Supabase Storage (Bucket Privado 'recibos')
    const safeName = colaborador.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeDoc = (colaborador.documento || '').replace(/\D/g, '');
    const viaSuffix = via.toLowerCase() === 'empresa' ? 'empresa' : 'colaborador';
    const timestamp = new Date().getTime();
    const filename = `${safeName}_${safeDoc}_${viaSuffix}_${timestamp}.pdf`;
    
    // Caminho no bucket: colaboradores/id_colaborador/arquivo.pdf
    const filePath = `${colaborador.id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('recibos')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('FULL UPLOAD ERROR:', uploadError);
      throw new Error(`Falha no armazenamento: ${uploadError.message}`);
    }

    // 5. Retornar o caminho do arquivo para o frontend salvar no banco
    return NextResponse.json({ 
      success: true, 
      pdfUrl: filePath, // Retornamos o path do bucket
      filename: filename,
      message: 'PDF gerado e armazenado com sucesso.'
    });

  } catch (err: any) {
    console.error('Erro na API Generate PDF:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
