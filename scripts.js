const SHEET_ID = "1vs2YWG1NrNAK0WoiJOA_E2RNVqrm3etO3n4wQP0Zuvc";
const SHEET_ID_FORNECEDORES_2 = "1xg9XLQM6UqmqmHPcURKBXBkfH18DzQwcIPyg5Ei5rns";
const API_KEY = "AIzaSyBH6EnOSZlpbyHasVJ4qGO_JRmW9iPwp-A";
const CLIENT_ID = "111240662640-4qiildanoi5dp786qaq9dg9s6in3i61u.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

let gapiInitialized = false;
let tokenClient;

// Inicializar o cliente GAPI
function initializeGapiClient() {
    gapi.load("client", () => {
        gapi.client
            .init({
                apiKey: API_KEY,
                discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
            })
            .then(() => {
                gapiInitialized = true;
                console.log("GAPI Client inicializado com sucesso.");
            })
            .catch((error) => {
                console.error("Erro ao inicializar o GAPI Client:", error);
            });
    });
}

// Inicializar o cliente de token OAuth2
function initializeTokenClient() {
    if (typeof google === "undefined" || !google.accounts) {
        console.error("Erro: O script GSI não foi carregado.");
        return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error) {
                console.error("Erro durante a autenticação:", response);
            } else {
                console.log("Autenticação bem-sucedida!");
            }
        },
    });
}

// Função para autenticar e enviar dados
function authenticateAndSend(formData) {
    if (!gapiInitialized) {
        alert("Erro: O GAPI Client não foi inicializado.");
        return;
    }

    // Verifica se o tokenClient está corretamente inicializado
    if (!tokenClient) {
        console.error("Erro: tokenClient não foi inicializado.");
        return;
    }

    tokenClient.callback = (response) => {
        if (response.error) {
            console.error("Erro durante a autenticação:", response);
            alert("Erro na autenticação. Verifique as configurações.");
            return;
        }
        enviarDados(formData);
    };

    tokenClient.requestAccessToken();
}

// Função para carregar dados da planilha
/*function loadSheetData() {
    const lojasRange = "Lojas!B2:B";
    const fornecedoresRange = "Fornecedores!A2:A";
    const urlBase = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/`;

    Promise.all([
        fetch(`${urlBase}${lojasRange}?key=${API_KEY}`).then((res) => res.json()),
        fetch(`${urlBase}${fornecedoresRange}?key=${API_KEY}`).then((res) => res.json()),
    ])
        .then(([lojasResponse, fornecedoresResponse]) => {
            preencherSelect(lojasResponse.values || [], "loja");
            preencherSelect(fornecedoresResponse.values || [], "fornecedor");
        })
        .catch((error) => {
            console.error("Erro ao carregar dados da planilha:", error);
            alert("Erro ao carregar dados. Tente novamente mais tarde.");
        });
}*/

function loadSheetData() {
    const lojasRange = "Lojas!B2:B";
    const urlBase = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/`;

    // Buscar apenas os dados de "Lojas"
    fetch(`${urlBase}${lojasRange}?key=${API_KEY}`)
        .then((res) => res.json())
        .then((lojasResponse) => {
            // Preencher o select com os valores das lojas
            preencherSelect(lojasResponse.values || [], "loja");
        })
        .catch((error) => {
            console.error("Erro ao carregar dados da planilha de lojas:", error);
            alert("Erro ao carregar dados das lojas. Tente novamente mais tarde.");
        });
}


/*/ Função genérica para preencher um select
function preencherSelect(valores, selectId) {
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = '<option value="" disabled selected>Selecione uma opção</option>';
    valores.forEach((valor) => {
        const option = document.createElement("option");
        option.value = valor[0];
        option.innerText = valor[0];
        selectElement.appendChild(option);
    });
    M.FormSelect.init(selectElement);
}*/

// Função para preencher a lista suspensa
function preencherSelect(opcoes, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return console.error(`Select com ID '${selectId}' não encontrado.`);

    // Limpa as opções existentes
    select.innerHTML = '<option value="" disabled selected>Selecione uma opção</option>';

    // Adiciona novas opções
    opcoes.forEach(([fornecedor]) => {
        const option = document.createElement("option");
        option.value = fornecedor;
        option.textContent = fornecedor;
        select.appendChild(option);
    });

    // Atualiza o select do Materialize
    M.FormSelect.init(select);
}

// Função para carregar nomes de colaboradores com base na loja selecionada
function loadNomes(lojaSelecionada) {
    const range = "Colaboradores!A2:C";
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;

    fetch(url)
        .then((res) => res.json())
        .then((response) => {
            const colaboradores = response.values || [];
            const nomesFiltrados = colaboradores.filter((colaborador) => colaborador[0] === lojaSelecionada);
            preencherSelect(nomesFiltrados.map((colaborador) => [colaborador[2]]), "nome");
        })
        .catch((error) => {
            console.error("Erro ao carregar colaboradores:", error);
        });
}

// Função para carregar fornecedores com base na loja e data atual
function loadFornecedoresPorLojaEData(lojaSelecionada) {
    const range = "Página1!A2:C"; // Colunas A (Loja), B (Fornecedor), C (Data)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID_FORNECEDORES_2}/values/${range}?key=${API_KEY}`;
    
    const dataAtual = new Date();
    const dataAtualFormatada = dataAtual.toISOString().split('T')[0]; // Formato 'yyyy-mm-dd'

    fetch(url)
        .then((res) => res.json())
        .then((response) => {
            const registros = response.values || [];
            console.log("Registros retornados pela API:", registros);

            // Filtra os fornecedores com base na loja e na data atual
            const fornecedoresFiltrados = registros.filter((registro) => {
                const [loja, fornecedor, dataTreinamento] = registro;

                // Verifica se a loja corresponde
                if (loja.trim() !== lojaSelecionada) return false;

                // Converte a data da planilha (dd/mm/yyyy) para o formato 'yyyy-mm-dd'
                const [dia, mes, ano] = dataTreinamento.split("/"); // Divide a data em dia, mês e ano
                const dataTreinamentoFormatada = `${ano}-${mes}-${dia}`; // Formato 'yyyy-mm-dd'

                // Compara a data formatada da planilha com a data atual
                return dataTreinamentoFormatada === dataAtualFormatada;
            });

            console.log("Fornecedores filtrados:", fornecedoresFiltrados);

            // Preenche a lista suspensa com os fornecedores filtrados
            preencherSelect(
                fornecedoresFiltrados.map((registro) => [registro[1]]), // Apenas fornecedores
                "fornecedor2" // ID do novo select
            );

            // Adiciona o evento para preencher o campo de data quando o fornecedor for selecionado
            const selectFornecedor = document.getElementById("fornecedor2");
            selectFornecedor.addEventListener("change", function () {
                const fornecedorSelecionado = selectFornecedor.value;

                // Encontra o fornecedor selecionado e preenche a data
                const fornecedorData = fornecedoresFiltrados.find((registro) => registro[1] === fornecedorSelecionado);
                if (fornecedorData) {
                    const [loja, fornecedor, dataTreinamento] = fornecedorData;
                    const [dia, mes, ano] = dataTreinamento.split("/"); // Divide a data em dia, mês e ano
                    //const dataFormatada = `${ano}-${mes}-${dia}`; // Formato 'yyyy-mm-dd'
                    const dataFormatada = `${dia}/${mes}/${ano}`; // Formato 'dd/mm/yyyy'

                    // Preenche o campo de data
                    const campoData = document.getElementById("data");
                    campoData.value = dataFormatada; // Preenche com a data no formato 'yyyy-mm-dd'
                    
                    // Atualiza o select do Materialize
                    M.updateTextFields();
                }
            });
        })
        .catch((error) => {
            console.error("Erro ao carregar fornecedores:", error);
            alert("Erro ao carregar fornecedores. Tente novamente mais tarde.");
        });
}

// Função para enviar dados para a planilha
function enviarDados(formData) {
    const range = "Confirmação!A2:D";
    const dados = [[formData.loja, formData.nome, formData.fornecedor, formData.data]];

    gapi.client.sheets.spreadsheets.values
        .append({
            spreadsheetId: SHEET_ID,
            range: range,
            valueInputOption: "RAW",
            resource: { values: dados },
        })
        .then((response) => {
            console.log("Dados enviados com sucesso:", response);
            alert("Dados enviados com sucesso!");
            limparFormulario();
        })
        .catch((error) => {
            console.error("Erro ao enviar dados:", error);
            alert("Ocorreu um erro ao enviar os dados.");
        });
}

// Evento para carregar nomes ao selecionar uma loja
document.getElementById("loja").addEventListener("change", (event) => {
    const lojaSelecionada = event.target.value;
    loadNomes(lojaSelecionada);
    loadFornecedoresPorLojaEData(lojaSelecionada); // Atualizado
});

// Função para limpar o formulário
function limparFormulario() {
    document.getElementById("loja").value = "";
    document.getElementById("nome").value = "";
    document.getElementById("fornecedor2").value = "";
    document.getElementById("data").value = "";
    M.FormSelect.init(document.querySelectorAll("select"));
    M.FormSelect.init(document.getElementById("loja"));
    M.FormSelect.init(document.getElementById("fornecedor2"));
}

// Inicialização da aplicação
document.addEventListener("DOMContentLoaded", () => {
    initializeGapiClient();
    initializeTokenClient();

    // Inicializar selects do Materialize
    M.FormSelect.init(document.querySelectorAll("select"));

    // Inicializar datepickers do Materialize
    M.Datepicker.init(document.querySelectorAll(".datepicker"), {
        format: "dd/mm/yyyy",
        autoClose: true,
    });

    // Carregar dados da planilha
    loadSheetData();

    // Configurar envio do formulário
    document.getElementById("formulario").addEventListener("submit", (event) => {
        event.preventDefault();

        if (!gapiInitialized) {
            alert("Erro: O GAPI Client não foi inicializado corretamente.");
            return;
        }

        const loja = document.getElementById("loja").value;
        const nome = document.getElementById("nome").value;
        const fornecedor = document.getElementById("fornecedor2").value;
        const data = document.getElementById("data").value;

        if (loja && nome && fornecedor && data) {
            authenticateAndSend({ loja, nome, fornecedor, data });
        } else {
            alert("Por favor, preencha todos os campos.");
        }
    });
});
