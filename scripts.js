const SHEET_ID = "1vs2YWG1NrNAK0WoiJOA_E2RNVqrm3etO3n4wQP0Zuvc";
const API_KEY = "AIzaSyBH6EnOSZlpbyHasVJ4qGO_JRmW9iPwp-A";
const CLIENT_ID = "111240662640-4qiildanoi5dp786qaq9dg9s6in3i61u.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// Inicializa o cliente GAPI para autenticação
function initializeGapiClient() {
    gapi.load("client", () => {
        gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        }).then(() => {
            gapiInitialized = true;
        }).catch(error => {
            console.error("Erro ao inicializar o GAPI Client:", error);
        });
    });
}

// Configura o cliente GIS
function initializeTokenClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: "", // Callback configurado no envio do formulário
    });
}

// Autenticar e enviar dados
function authenticateAndSend(formData) {
    if (!gapiInitialized) {
        alert("Erro: O GAPI Client não foi inicializado.");
        return;
    }

    tokenClient.callback = (response) => {
        if (response.error) {
            console.error("Erro durante a autenticação:", response);
            return;
        }
        // Enviar os dados após autenticação
        enviarDados(formData);
    };

    tokenClient.requestAccessToken();
}

// Função para carregar os dados da planilha sem autenticação
function loadSheetData() {
  const lojasRange = "Lojas!B2:B";
  const fornecedoresRange = "Fornecedores!A2:A";

  const urlBase = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/`;
  
  Promise.all([
    fetch(`${urlBase}${lojasRange}?key=${API_KEY}`).then(res => res.json()),
    fetch(`${urlBase}${fornecedoresRange}?key=${API_KEY}`).then(res => res.json())
  ]).then(([lojasResponse, fornecedoresResponse]) => {
    preencherSelect(lojasResponse.values || [], 'loja');
    preencherSelect(fornecedoresResponse.values || [], 'fornecedor');
  }).catch(error => {
    console.error("Erro ao carregar dados da planilha:", error);
  });
}

// Função genérica para preencher um select
function preencherSelect(valores, selectId) {
  const selectElement = document.getElementById(selectId);
  selectElement.innerHTML = '<option value="" disabled selected>Selecione uma opção</option>';
  valores.forEach(valor => {
    const option = document.createElement('option');
    option.value = valor[0];
    option.innerText = valor[0];
    selectElement.appendChild(option);
  });
  // Reinitialize Materialize select
  M.FormSelect.init(selectElement);
}

// Função para carregar os colaboradores de acordo com a loja
function loadNomes(lojaSelecionada) {
  const range = "Colaboradores!A2:C";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;

  fetch(url).then(res => res.json()).then(response => {
    const colaboradores = response.values || [];
    const nomesFiltrados = colaboradores.filter(colaborador => colaborador[0] === lojaSelecionada);
    preencherSelect(nomesFiltrados.map(colaborador => [colaborador[2]]), 'nome');
  }).catch(error => {
    console.error("Erro ao carregar colaboradores:", error);
  });
}

// Evento para atualizar a lista de nomes quando a loja for selecionada
document.getElementById('loja').addEventListener('change', (event) => {
  const lojaSelecionada = event.target.value;
  loadNomes(lojaSelecionada);
});

// Enviar os dados do formulário
function enviarDados(formData) {
    const range = "Confirmação!A2:D";
    const dados = [[formData.loja, formData.nome, formData.fornecedor, formData.data]];

    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: range,
        valueInputOption: "RAW",
        resource: { values: dados },
    }).then(response => {
        console.log("Dados enviados com sucesso:", response);
        alert("Dados enviados com sucesso!");
    }).catch(error => {
        console.error("Erro ao enviar dados:", error);
        alert("Ocorreu um erro ao enviar os dados.");
    });
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    initializeGapiClient();
    initializeTokenClient();

    // Configurar envio do formulário
    document.getElementById("formulario").addEventListener("submit", function(event) {
        event.preventDefault();

        const loja = document.getElementById("loja").value;
        const nome = document.getElementById("nome").value;
        const fornecedor = document.getElementById("fornecedor").value;
        const data = document.getElementById("data").value;

        if (loja && nome && fornecedor && data) {
            const formData = { loja, nome, fornecedor, data };
            authenticateAndSend(formData);
        } else {
            alert("Por favor, preencha todos os campos.");
        }
    });
});
