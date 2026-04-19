/**
 * app.js - Lógica do Painel de Recibos Marshall
 */

// --- CONFIGURAÇÕES PADRÃO ---
const DEFAULT_CONFIG = {
    nome_empregador: "Natan Portela da Silva",
    documento_empregador: "444.618.778-33",
    periodo_padrao: "Dezembro, Janeiro e Fevereiro",
    data_pagamento_padrao: "20/03/2026"
};

// --- ESTADO GLOBAL ---
let receiptConfig = {};
let employeesData = [];

// --- INICIALIZAÇÃO ---
window.onload = () => {
    loadData();
    renderConfigForm();
    renderEmployeesTable();
};

// --- GERENCIAMENTO DE DADOS (LOCALSTORAGE) ---
function loadData() {
    // Tenta carregar do LocalStorage
    const savedConfig = localStorage.getItem('marshall_receiptConfig');
    const savedEmployees = localStorage.getItem('marshall_employeesData');

    // Se houver semente no data.js (window.marshallSeed)
    const seed = window.marshallSeed || {};

    if (savedConfig) {
        receiptConfig = JSON.parse(savedConfig);
    } else {
        // Fallback para data.js ou DEFAULT_CONFIG
        receiptConfig = seed.receiptConfig || { ...DEFAULT_CONFIG };
        localStorage.setItem('marshall_receiptConfig', JSON.stringify(receiptConfig));
    }

    if (savedEmployees) {
        employeesData = JSON.parse(savedEmployees);
    } else {
        // Fallback para data.js ou lista vazia
        employeesData = seed.employeesRaw || [];
        // Não salvamos imediatamente no localStorage para permitir que alterações no data.js 
        // continuem refletindo enquanto o usuário não "salvar" nada novo no painel
    }
}

function saveData() {
    localStorage.setItem('marshall_receiptConfig', JSON.stringify(receiptConfig));
    localStorage.setItem('marshall_employeesData', JSON.stringify(employeesData));
}

function resetData() {
    if (confirm("Tem certeza que deseja zerar TODOS os dados e configurações? Isso apagará os colaboradores atuais.")) {
        localStorage.removeItem('marshall_receiptConfig');
        localStorage.removeItem('marshall_employeesData');
        loadData();
        renderConfigForm();
        renderEmployeesTable();
    }
}

// --- FORMULÁRIO GLOBAL ---
function renderConfigForm() {
    document.getElementById('config-nome').value = receiptConfig.nome_empregador || '';
    document.getElementById('config-doc').value = receiptConfig.documento_empregador || '';
    document.getElementById('config-periodo').value = receiptConfig.periodo_padrao || '';
    document.getElementById('config-data').value = receiptConfig.data_pagamento_padrao || '';
}

function saveGlobalConfig() {
    receiptConfig = {
        nome_empregador: document.getElementById('config-nome').value,
        documento_empregador: document.getElementById('config-doc').value,
        periodo_padrao: document.getElementById('config-periodo').value,
        data_pagamento_padrao: document.getElementById('config-data').value
    };
    saveData();
    alert("Configurações Globais salvas com sucesso!");
}

// --- CÁLCULO DE RECIBOS ---
const formatBRL = (val) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function calcularColaborador(emp) {
    // Parser e sanitização dos meses
    const mesesString = emp.meses || receiptConfig.periodo_padrao || 'dezembro, janeiro, fevereiro';
    const mesesAlvo = mesesString.split(',').map(m => m.trim().toLowerCase()).filter(m => m !== '');

    const calcularValorMes = (valorMensal, mesNome) => {
        if (mesNome === 'fevereiro') {
            const dias = emp.fevereiro_completo ? 30 : 20;
            return (valorMensal / 30) * dias;
        }
        return valorMensal;
    };

    const salario_base_mensal = parseFloat(emp.salario_base_mensal) || 0;
    const porcentagem_gratificacao = parseFloat(emp.porcentagem_gratificacao) || 0;
    const total_descontos_base = parseFloat(emp.total_descontos) || 0;

    const salarioTotalBase = mesesAlvo.reduce((acc, mes) => acc + calcularValorMes(salario_base_mensal, mes), 0);
    const valorGratificacao = (salarioTotalBase * porcentagem_gratificacao) / 100;

    let totalAdicionais = 0;
    const adicionaisProcessados = (emp.adicionais || []).map(ad => {
        const valor_mensal = parseFloat(ad.valor_mensal) || 0;
        const valorTotalAdicional = mesesAlvo.reduce((acc, mes) => acc + calcularValorMes(valor_mensal, mes), 0);
        totalAdicionais += valorTotalAdicional;
        return {
            descricao: ad.descricao,
            valor_mensal: formatBRL(valor_mensal),
            valor: formatBRL(valorTotalAdicional)
        };
    });

    const valorLiquido = (salarioTotalBase + valorGratificacao + totalAdicionais) - total_descontos_base;

    // Formatação do detalhe do período para exibição
    const mapFev = (m) => {
        if (m === 'dezembro') return 'Dez';
        if (m === 'janeiro') return 'Jan';
        if (m === 'fevereiro') return emp.fevereiro_completo ? 'Fev' : 'Fev (até 20/02)';
        if (m === 'marco' || m === 'março') return 'Mar';
        return m.charAt(0).toUpperCase() + m.slice(1);
    }
    const detalhe_periodo = mesesAlvo.map(mapFev).join(', ');

    return {
        ...emp,
        salario_base_mensal_fmt: formatBRL(salario_base_mensal),
        salario_base: formatBRL(salarioTotalBase),
        porcentagem_gratificacao_fmt: porcentagem_gratificacao + '%',
        valor_gratificacao: formatBRL(valorGratificacao),
        total_descontos_fmt: formatBRL(total_descontos_base),
        adicionais_vencimentos: adicionaisProcessados,
        valor_liquido_fmt: formatBRL(valorLiquido),
        detalhe_periodo: detalhe_periodo
    };
}


// --- TABELA DE COLABORADORES ---
function renderEmployeesTable() {
    const tbody = document.getElementById('employees-tbody');
    const emptyState = document.getElementById('empty-state');
    
    tbody.innerHTML = '';
    
    if (employeesData.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    employeesData.forEach((emp, index) => {
        const calcs = calcularColaborador(emp);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${emp.nome_funcionario}</strong><br>
                <span class="muted" style="font-size: 11px; color:#aaa;">${emp.documento}</span>
            </td>
            <td>${emp.cargo}</td>
            <td>R$ ${calcs.salario_base_mensal_fmt}</td>
            <td><strong style="color:var(--success-color)">R$ ${calcs.valor_liquido_fmt}</strong></td>
            <td>
                <div class="action-btns" style="justify-content: flex-end;">
                    <button class="btn-icon" onclick="editEmployee(${index})" title="Editar">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon danger" onclick="deleteEmployee(${index})" title="Excluir">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// --- GESTÃO DE MODAL ---
function openModal(index = null) {
    const modal = document.getElementById('employee-modal');
    modal.classList.add('active');

    if (index !== null) {
        // Edit
        document.getElementById('modal-title').innerText = "Editar Colaborador";
        document.getElementById('emp-id').value = index;
        
        const emp = employeesData[index];
        document.getElementById('emp-nome').value = emp.nome_funcionario || '';
        document.getElementById('emp-doc').value = emp.documento || '';
        document.getElementById('emp-cargo').value = emp.cargo || '';
        document.getElementById('emp-empresa').value = emp.nome_empresa || '';
        document.getElementById('emp-salario').value = emp.salario_base_mensal || '';
        document.getElementById('emp-gratificacao').value = emp.porcentagem_gratificacao !== undefined ? emp.porcentagem_gratificacao : 20;
        document.getElementById('emp-fev-completo').checked = !!emp.fevereiro_completo;
        document.getElementById('emp-meses').value = emp.meses || 'dezembro, janeiro, fevereiro';
        document.getElementById('emp-desconto').value = emp.total_descontos || '0';

        if (emp.adicionais && emp.adicionais.length > 0) {
            document.getElementById('emp-add-desc').value = emp.adicionais[0].descricao || '';
            document.getElementById('emp-add-valor').value = emp.adicionais[0].valor_mensal || '';
        } else {
            document.getElementById('emp-add-desc').value = '';
            document.getElementById('emp-add-valor').value = '';
        }

    } else {
        // Create
        document.getElementById('modal-title').innerText = "Novo Colaborador";
        document.getElementById('emp-id').value = '';
        
        document.getElementById('emp-nome').value = '';
        document.getElementById('emp-doc').value = '';
        document.getElementById('emp-cargo').value = '';
        document.getElementById('emp-empresa').value = '';
        document.getElementById('emp-salario').value = '';
        document.getElementById('emp-gratificacao').value = '20';
        document.getElementById('emp-fev-completo').checked = false;
        document.getElementById('emp-meses').value = 'dezembro, janeiro, fevereiro';
        document.getElementById('emp-desconto').value = '0';
        document.getElementById('emp-add-desc').value = '';
        document.getElementById('emp-add-valor').value = '';
    }
}

function closeModal() {
    document.getElementById('employee-modal').classList.remove('active');
}

function saveEmployee() {
    const index = document.getElementById('emp-id').value;
    
    // Validações básicas
    const nome = document.getElementById('emp-nome').value.trim();
    const doc = document.getElementById('emp-doc').value.trim();
    const cargo = document.getElementById('emp-cargo').value.trim();
    const salario = document.getElementById('emp-salario').value;
    
    if(!nome || !doc || !cargo || !salario) {
        alert("Preencha os campos obrigatórios (*).");
        return;
    }

    const adicionais = [];
    const addDesc = document.getElementById('emp-add-desc').value.trim();
    const addValor = document.getElementById('emp-add-valor').value;
    if (addDesc && addValor) {
        adicionais.push({
            descricao: addDesc,
            valor_mensal: parseFloat(addValor)
        });
    }

    const empData = {
        nome_funcionario: nome,
        documento: doc,
        cargo: cargo,
        nome_empresa: document.getElementById('emp-empresa').value.trim(),
        salario_base_mensal: parseFloat(salario),
        porcentagem_gratificacao: parseFloat(document.getElementById('emp-gratificacao').value),
        fevereiro_completo: document.getElementById('emp-fev-completo').checked,
        meses: document.getElementById('emp-meses').value.trim(),
        total_descontos: parseFloat(document.getElementById('emp-desconto').value) || 0,
        adicionais: adicionais
    };

    if (index !== '') {
        employeesData[parseInt(index)] = empData;
    } else {
        employeesData.push(empData);
    }

    saveData();
    closeModal();
    renderEmployeesTable();
}

function editEmployee(index) {
    openModal(index);
}

function deleteEmployee(index) {
    if (confirm("Deseja realmente remover este colaborador do painel?")) {
        employeesData.splice(index, 1);
        saveData();
        renderEmployeesTable();
    }
}


// --- LÓGICA DE IMPRESSÃO ---

function createReceiptHTML(config, empCalculado, guiaNumero) {
    const isGuia2 = guiaNumero === 2;
    const guiaLabel = isGuia2 ? 'GUIA DA EMPRESA' : 'GUIA DO COLABORADOR';

    const trAdicionais = (empCalculado.adicionais_vencimentos || []).map((ad, idx) => \`
        <tr>
            <td>\${101 + idx}</td>
            <td>\${ad.descricao}</td>
            <td>Mensal: R$ \${ad.valor_mensal}</td>
            <td>R$ \${ad.valor}</td>
            <td></td>
        </tr>
    \`).join('');

    return \`
        <div class="receipt-container">
            <span class="guia-label">\${guiaLabel}</span>
            <div class="black-header">
                <div class="header-logo">
                    <!-- Opcional colocar logo real se houver, ou remover -->
                    <img src="images/logo-gold.png" alt="Marshall Logo">
                </div>
                <div class="header-info">
                    <h1>Recibo de Pagamento</h1>
                    <p><strong>Empregador:</strong> \${config.nome_empregador}</p>
                    <p><strong>CNPJ/CPF:</strong> \${config.documento_empregador}</p>
                </div>
            </div>

            <div class="receipt-body">
                <div class="info-grid">
                    <div class="info-box">
                        <strong>Colaborador</strong> \${empCalculado.nome_funcionario} <br>
                        \${empCalculado.nome_empresa ? \`<span style="margin-top:2px; display:inline-block; font-size: 10px; color: #888;">\${empCalculado.nome_empresa}</span><br>\` : ''}
                        \${empCalculado.documento}
                    </div>
                    <div class="info-box"><strong>Cargo</strong> \${empCalculado.cargo}</div>
                    <div class="info-box"><strong>Referência</strong> \${empCalculado.detalhe_periodo}</div>
                </div>

                <table class="receipt-table">
                    <thead>
                        <tr>
                            <th>Cód.</th>
                            <th>Descrição</th>
                            <th>Ref.</th>
                            <th>Vencimentos</th>
                            <th>Descontos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>001</td>
                            <td>Salário Base</td>
                            <td>Mensal: R$ \${empCalculado.salario_base_mensal_fmt}</td>
                            <td>R$ \${empCalculado.salario_base}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>002</td>
                            <td>Gratificação</td>
                            <td>\${empCalculado.porcentagem_gratificacao_fmt} do Salário</td>
                            <td>R$ \${empCalculado.valor_gratificacao}</td>
                            <td></td>
                        </tr>
                        \${trAdicionais}
                        <tr>
                            <td>901</td>
                            <td>Descontos Gerais</td>
                            <td>-</td>
                            <td></td>
                            <td>R$ \${empCalculado.total_descontos_fmt}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="total-box">
                    <div class="total-value">
                        VALOR LÍQUIDO: R$ \${empCalculado.valor_liquido_fmt}
                    </div>
                </div>

                <p class="declaration">
                    Declaro ter recebido a importância líquida discriminada neste recibo, referente ao pagamento do período acima mencionado.
                </p>

                <div style="margin-top: 30px; font-weight: bold; text-align: right; padding-right: 20px;">Data: \${config.data_pagamento_padrao}</div>

                <div class="signatures" \${isGuia2 ? 'style="justify-content: center;"' : ''}>
                    \${!isGuia2 ? '<div class="sig-line">ASSINATURA DO COLABORADOR</div>' : ''}
                    <div class="sig-line" \${isGuia2 ? 'style="width: 60%;"' : ''}>ASSINATURA DO EMPREGADOR</div>
                </div>
            </div>
        </div>
    \`;
}

function generateAndPrintAll() {
    if (employeesData.length === 0) {
        alert("Não há colaboradores para imprimir. Adicione colaboradores primeiro.");
        return;
    }

    // Certifique-se que as configs globais mais recentes estão na memória
    saveGlobalConfig(); 

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';

    let htmlFull = '';

    employeesData.forEach(emp => {
        const calcs = calcularColaborador(emp);
        htmlFull += createReceiptHTML(receiptConfig, calcs, 1);
        htmlFull += createReceiptHTML(receiptConfig, calcs, 2);
    });

    printArea.innerHTML = htmlFull;

    // Atraso sutil para o DOM processar as imagens/grid antes do window.print
    setTimeout(() => {
        window.print();
        // Ocultar a area depois da impressão não é estritamente necessário porque já está ocultada pelo display: none padrão.
        // O @media print que cuida dela aparecer.
    }, 300);
}
