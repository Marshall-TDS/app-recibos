/**
 * data.js - Histórico e Configurações Semente da Marshall
 * 
 * Este arquivo serve como um registro histórico dos colaboradores e
 * configurações padrão. O Painel de Gestão (app.js) utilizará estes
 * dados caso o armazenamento local (LocalStorage) esteja vazio.
 */

const receiptConfig = {
    nome_empregador: "Natan Portela da Silva",
    documento_empregador: "444.618.778-33",
    periodo_padrao: "Dezembro, Janeiro e Fevereiro",
    data_pagamento_padrao: "20/03/2026"
};

const employeesRaw = [
    {
        nome_funcionario: "Tamires Moreira Frizanco",
        documento: "421.319.828-09",
        cargo: "Cozinheira",
        nome_empresa: "Restaurante Marshall",
        salario_base_mensal: 7000.00,
        porcentagem_gratificacao: 20,
        fevereiro_completo: false, // Até 20/02
        meses: "dezembro, janeiro, fevereiro",
        total_descontos: 0,
        adicionais: []
    },
    {
        nome_funcionario: "Leonardo Silva Santos",
        documento: "123.456.789-00",
        cargo: "Auxiliar Administrativo",
        nome_empresa: "Marshall TDS",
        salario_base_mensal: 3500.00,
        porcentagem_gratificacao: 15,
        fevereiro_completo: true,
        meses: "dezembro, janeiro, fevereiro",
        total_descontos: 150.00,
        adicionais: [
            { descricao: "Hora Extra 50%", valor_mensal: 200.00 }
        ]
    }
];

// Disponibiliza as variáveis globalmente para o app.js
window.marshallSeed = {
    receiptConfig,
    employeesRaw
};
