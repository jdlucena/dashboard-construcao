// ======================================
// CONFIGURAÇÕES
// ======================================

const CONFIG = {
    precoMetroQuadrado: 3200,
    metrosQuadrados: 165,
    url_padrao: location.origin,
    coresCategorias: [
        'success',
        'primary',
        'danger',
        'warning',
        'info'
    ]
};


// ======================================
// ESTADO GLOBAL
// ======================================

const state = {
    saldoAtual: 0,
    totalAportes: 0,
    totalDespesas: 0,
    rendimentosCDI: 0,
    evolucaoSaldo: [],
    dados: []
};


// ======================================
// HELPERS
// ======================================

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarData(data) {
    return new Date(data)
        .toLocaleDateString('pt-BR');
}


// ======================================
// FILTRO TABELA
// ======================================

function atualizarTabela() {

    const value =
        $("#filtrar-pesquisar")
            .val()
            .toLowerCase();

    const rows =
        $("#tabela-body tr")
            .not("#nenhum-resultado");

    const total = rows.length;

    let visiveis = 0;

    rows.each(function () {

        const encontrou =
            $(this)
                .text()
                .toLowerCase()
                .includes(value);

        $(this).toggle(encontrou);

        if (encontrou) visiveis++;
    });

    $("#nenhum-resultado")
        .toggle(visiveis === 0);

    $("#contador-registros")
        .text(`${visiveis} registros de ${total}`);
}

$("#filtrar-pesquisar")
    .on("keyup", atualizarTabela);


// ======================================
// LER JSON
// ======================================

async function lerDados() {

    try {

        const response =
            await fetch('dados.json');

        if (!response.ok) {
            throw new Error('Erro ao carregar JSON');
        }

        return await response.json();

    } catch (error) {

        console.error(error);

        return [];
    }
}


// ======================================
// DASHBOARD
// ======================================

function atualizarDashboard() {

    const custoTotalObra =
        CONFIG.precoMetroQuadrado *
        CONFIG.metrosQuadrados;

    const percentualConsumo =
        (state.totalDespesas / custoTotalObra) * 100;

    document.getElementById('saldo-atual')
        .textContent =
        formatarMoeda(state.saldoAtual);

    document.getElementById('total-aportes')
        .textContent =
        formatarMoeda(state.totalAportes);

    document.getElementById('total-despesas')
        .textContent =
        formatarMoeda(state.totalDespesas);

    document.getElementById('rendimentos-cdi')
        .textContent =
        formatarMoeda(state.rendimentosCDI);

    document.getElementById('percentual-consumo')
        .textContent =
        `${percentualConsumo.toFixed(1)}%`;

    document.getElementById('total-gasto')
        .textContent =
        formatarMoeda(state.totalDespesas);

    document.getElementById('total-restante')
        .textContent =
        formatarMoeda(custoTotalObra);

    document.getElementById('preco-metro-quadrado')
        .textContent =
        formatarMoeda(CONFIG.precoMetroQuadrado);

    const progressBar =
        document.querySelector('.progress-bar');

    if (progressBar) {

        progressBar.style.width =
            `${Math.min(percentualConsumo, 100)}%`;
    }
}


// ======================================
// GRÁFICO 1
// ======================================

function renderChart1() {

    Highcharts.chart('chart-1', {

        chart: {
            type: 'areaspline',
            zooming: {
                type: 'x'
            }
        },

        title: {
            text: ''
        },

        credits: {
            enabled: false
        },

        legend: {
            enabled: false
        },

        xAxis: {
            type: 'datetime'
        },

        yAxis: {
            title: {
                text: ''
            }
        },

        tooltip: {
            xDateFormat: '%d/%m/%Y',
            pointFormat:
                '<b>R$ {point.y:,.2f}</b>'
        },

        plotOptions: {

            areaspline: {

                lineWidth: 4,

                marker: {
                    radius: 3
                },

                fillOpacity: 0.25,

                color: '#157347'
            }
        },

        series: [
            {
                name: 'Saldo',
                data: state.evolucaoSaldo
            }
        ]
    });
}

// ======================================
// GRÁFICO 2 - CRÉDITOS X DÉBITOS POR MÊS
// ======================================

function renderChart2(data) {

    const mesesMap = {};

    data.forEach(item => {

        const dataItem = new Date(item.data);

        const mesAno = dataItem.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });

        // cria estrutura do mês
        if (!mesesMap[mesAno]) {

            mesesMap[mesAno] = {
                creditos: 0,
                debitos: 0
            };
        }

        // soma créditos
        if (item.tipo === 'Crédito') {

            mesesMap[mesAno].creditos += item.valor;
        }

        // soma débitos
        if (item.tipo === 'Débito') {

            mesesMap[mesAno].debitos += Math.abs(item.valor);
        }
    });

    // categorias do eixo X
    const categorias =
        Object.keys(mesesMap);

    // série créditos
    const creditos =
        Object.values(mesesMap)
            .map(item => Number(item.creditos.toFixed(2)));

    // série débitos
    const debitos =
        Object.values(mesesMap)
            .map(item => Number(item.debitos.toFixed(2)));

    Highcharts.chart('chart-2', {

        chart: {
            type: 'column'
        },

        title: {
            text: ''
        },

        subtitle: {
            text: ''
        },

        credits: {
            enabled: false
        },

        xAxis: {

            categories: categorias,

            crosshair: true,

            labels: {
                style: {
                    color: '#6c757d'
                }
            }
        },

        yAxis: {

            min: 0,

            title: {
                text: ''
            },

            labels: {

                formatter: function () {

                    return 'R$ ' +
                        Highcharts.numberFormat(this.value, 0, ',', '.');
                },

                style: {
                    color: '#6c757d'
                }
            }
        },

        tooltip: {

            shared: true,

            valuePrefix: 'R$ ',

            valueDecimals: 2
        },

        plotOptions: {

            column: {

                borderWidth: 0,

                pointPadding: 0.1,

                borderRadius: 4
            }
        },

        legend: {
            enabled: true
        },

        series: [

            {
                name: 'Créditos',
                data: creditos,
                color: '#157347'
            },

            {
                name: 'Débitos',
                data: debitos,
                color: '#DC3545'
            }
        ]
    });
}

// ======================================
// TOP 5 CATEGORIAS
// ======================================

function gerarTopCategorias(data) {

    const container =
        document.getElementById('top-categorias');

    if (!container) return;

    const categorias = {};

    data.forEach(item => {

        if (item.tipo === 'Débito') {

            const valor =
                Math.abs(item.valor);

            categorias[item.categoria] =
                (categorias[item.categoria] || 0)
                + valor;
        }
    });

    const categoriasOrdenadas =
        Object.entries(categorias)

            .map(([categoria, valor]) => ({
                categoria,
                valor
            }))

            .sort((a, b) =>
                b.valor - a.valor
            )

            .slice(0, 5);

    const total =
        categoriasOrdenadas.reduce(
            (acc, item) =>
                acc + item.valor,
            0
        );

    container.innerHTML = '';

    categoriasOrdenadas.forEach((item, index) => {

        const cor =
            CONFIG.coresCategorias[index]
            || 'secondary';

        const percentual =
            ((item.valor / total) * 100)
                .toFixed(1);

        const li =
            document.createElement('li');

        li.className = 'mb-2';

        li.innerHTML = `
        
            <a class="
                dropdown-item
                d-flex
                justify-content-between
                align-items-center
                gap-2
                py-2">

                <div>

                    <span class="
                        d-inline-block
                        bg-${cor}
                        rounded-circle
                        p-1">
                    </span>

                    ${item.categoria}

                </div>

                <span class="text-secondary">

                    ${formatarMoeda(item.valor)}

                </span>

            </a>

            <div class="progress"
                style="height: 8px">

                <div class="
                    progress-bar
                    bg-${cor}"

                    style="
                        width: ${percentual}%">
                </div>

            </div>
        `;

        container.appendChild(li);

    });
}

// ======================================
// PREENCHER SELECT DE CLASSES
// ======================================

function preencherSelectClasses(data) {

    const selectClasse =
        document.getElementById('select-classe');

    // remove opções antigas
    selectClasse.innerHTML = `
        <option value="">Classe</option>
    `;

    // pega categorias únicas
    const categorias =
        [...new Set(
            data.map(item => item.categoria)
        )]

        .sort((a, b) =>
            a.localeCompare(b)
        );

    // adiciona options
    categorias.forEach(categoria => {

        const option =
            document.createElement('option');

        option.value = categoria;
        option.textContent = categoria;

        selectClasse.appendChild(option);
    });
}

// ======================================
// FILTRAR TABELA
// ======================================

function filtrarTabela() {

    const texto =
        document.getElementById('filtrar-pesquisar')
            .value
            .toLowerCase();

    const tipo =
        document.getElementById('select-tipo')
            .value
            .toLowerCase();

    const classe =
        document.getElementById('select-classe')
            .value
            .toLowerCase();

    const linhas =
        document.querySelectorAll(
            '#tabela-body tr:not(#nenhum-resultado)'
        );

    let visiveis = 0;

    linhas.forEach(linha => {

        const textoLinha =
            linha.textContent.toLowerCase();

        const colunaTipo =
            linha.children[5]
                .textContent
                .trim()
                .toLowerCase();

        const colunaClasse =
            linha.children[2]
                .textContent
                .trim()
                .toLowerCase();

        const filtroTexto =
            textoLinha.includes(texto);

        const filtroTipo =
            !tipo ||
            tipo === 'tipo' ||
            colunaTipo === tipo;

        const filtroClasse =
            !classe ||
            classe === 'classe' ||
            colunaClasse === classe;

        const mostrar =
            filtroTexto &&
            filtroTipo &&
            filtroClasse;

        linha.style.display =
            mostrar
                ? ''
                : 'none';

        if (mostrar) visiveis++;
    });

    // nenhum resultado
    const nenhumResultado =
        document.getElementById('nenhum-resultado');

    if (nenhumResultado) {

        nenhumResultado.style.display =
            visiveis === 0
                ? ''
                : 'none';
    }

    // contador
    document.getElementById('contador-registros')
        .textContent =
        `${visiveis} registros encontrados`;
}


// ======================================
// EVENTOS DOS FILTROS
// ======================================

// pesquisa
document.getElementById('filtrar-pesquisar')
    .addEventListener('keyup', filtrarTabela);

// tipo
document.getElementById('select-tipo')
    .addEventListener('change', filtrarTabela);

// classe
document.getElementById('select-classe')
    .addEventListener('change', filtrarTabela);

// ======================================
// MODAL DE ANEXOS
// ======================================

// Escuta clique nos anexos
document.addEventListener('click', function (event) {

    const botao =
        event.target.closest('.btn-abrir-anexos');

    if (!botao) return;

    // pega anexos do atributo
    const anexos =
        JSON.parse(
            botao.dataset.anexos || '[]'
        );

    // body do modal
    const modalBody =
        document.getElementById('modal-anexos-body');

    // limpa modal
    modalBody.innerHTML = '';

    // sem anexos
    if (anexos.length === 0) {

        modalBody.innerHTML = `        
            <div class="text-center text-secondary py-4">
                Nenhum anexo encontrado.
            </div>
        `;

        return;
    }

    // renderiza anexos
    anexos.forEach(anexo => {

        const item =
            document.createElement('div');

        item.className = `
            d-flex
            justify-content-between
            align-items-center
            border
            rounded
            p-3
            mb-2
        `;

        item.innerHTML = `
        
            <div class="d-flex align-items-center gap-2">
                <svg class="bi"
                    width="18"
                    height="18"
                    fill="currentColor">
                    <use xlink:href="#file-earmark-medical"></use>
                </svg>
                <span>
                    ${anexo.nome}
                </span>
            </div>

            <a href="${CONFIG.url_padrao}${anexo.url}"
                target="_blank"
                class="btn btn-sm btn-primary">
                Abrir
            </a>
        `;

        modalBody.appendChild(item);

    });

});

// ======================================
// TABELA
// ======================================

function renderTabela(data) {

    const tabelaBody =
        document.getElementById('tabela-body');

    tabelaBody.innerHTML = '';

    data.forEach(item => {

        const row =
            document.createElement('tr');

        const corValor =
            item.valor < 0
                ? 'danger'
                : 'success';

        const corTipo =
            item.tipo === 'Débito'
                ? 'danger'
                : 'success';

        const anexos =
            item.anexos?.length > 0
                ? `
                    <a href="javascript:void(0)"
                class="
                    text-decoration-none
                    text-dark
                    btn-abrir-anexos
                "
                data-bs-toggle="modal"
                data-bs-target="#exampleModal"
                data-anexos='${JSON.stringify(item.anexos)}'>

                <svg class="bi"
                    width="16"
                    height="16"
                    aria-hidden="true"
                    fill="currentColor">

                    <use xlink:href="#file-earmark-medical"></use>

                </svg>

            </a>
                `
                : '';

        row.innerHTML = `
        
            <td>
                ${item.data}
            </td>

            <td class="
                text-truncate"
                style="
                max-width: 250px;">

                ${item.descricao}

            </td>

            <td>

                <span class="
                    badge
                    bg-secondary-subtle
                    border
                    border-secondary-subtle
                    text-secondary-emphasis
                    rounded-pill">

                    ${item.categoria}

                </span>

            </td>

            <td class="
                text-${corValor}
                fw-bold
                text-end">

                ${formatarMoeda(item.valor)}

            </td>

            <td class="text-end">

                ${formatarMoeda(item.saldo)}

            </td>

            <td class="text-center">

                <span class="
                    badge
                    bg-${corTipo}-subtle
                    border
                    border-${corTipo}-subtle
                    text-${corTipo}-emphasis
                    rounded-pill">

                    ${item.tipo}

                </span>

            </td>

            <td class="text-center">
                ${anexos}
            </td>
        `;

        tabelaBody.appendChild(row);
    });

    tabelaBody.innerHTML += `
    
        <tr id="nenhum-resultado"
            style="display:none">

            <td colspan="7"
                class="text-center">

                Nenhum registro encontrado.

            </td>

        </tr>
    `;
}


// ======================================
// PROCESSAR DADOS
// ======================================

function processarDados(data) {

    state.dados = data;

    data.forEach(item => {

        state.saldoAtual =
            item.saldo;

        if (item.categoria === 'Aporte') {
            state.totalAportes += item.valor;
        }

        if (item.tipo === 'Débito') {
            state.totalDespesas += Math.abs(item.valor);
        }

        if (item.categoria === 'Rendimentos') {
            state.rendimentosCDI += item.valor;
        }

        state.evolucaoSaldo.push([
            new Date(item.data).getTime(),
            item.saldo
        ]);
    });
}


// ======================================
// INIT
// ======================================

async function init() {

    const data = await lerDados();

    preencherSelectClasses(data);

    processarDados(data);

    atualizarDashboard();

    renderTabela(data);

    gerarTopCategorias(data);

    renderChart1();

    renderChart2(data);

    atualizarTabela();

    filtrarTabela();
}

init();