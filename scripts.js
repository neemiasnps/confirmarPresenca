const SHEET_ID = "1vs2YWG1NrNAK0WoiJOA_E2RNVqrm3etO3n4wQP0Zuvc";
const API_KEY = "AIzaSyBH6EnOSZlpbyHasVJ4qGO_JRmW9iPwp-A";
const CLIENT_ID = "111240662640-4qiildanoi5dp786qaq9dg9s6in3i61u.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

let gapiInitialized = false;
let tokenClient;

// Função para inicializar o cliente GAPI
function initializeGapiClient() {
    gapi.load("client", () => {
        gapi.client
            .init({
                apiKey: API_KEY,
                discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
            })
            .then(() => {
                gapiInitialized = true;
                console.log("GAPI Client inicializado.");
            })
            .catch((error) => {
                console.error("Erro ao inicializar o GAPI Client:", error);
                alert("Erro ao inicializar o GAPI Client.");
            });
    });
}

// Configura o cliente GIS
function initializeTokenClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error) {
                console.error("Erro durante a autenticação:", response);
                alert("Erro na autenticação. Verifique as configurações.");
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
function loadSheetData() {
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
}

// Função genérica para preencher um select
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

// Função para limpar o formulário
function limparFormulario() {
    document.getElementById("loja").value = "";
    document.getElementById("nome").value = "";
    document.getElementById("fornecedor").value = "";
    document.getElementById("data").value = "";
    M.FormSelect.init(document.querySelectorAll("select"));
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

        const loja = document.getElementById("loja").value;
        const nome = document.getElementById("nome").value;
        const fornecedor = document.getElementById("fornecedor").value;
        const data = document.getElementById("data").value;

        if (loja && nome && fornecedor && data) {
            authenticateAndSend({ loja, nome, fornecedor, data });
        } else {
            alert("Por favor, preencha todos os campos.");
        }
    });
});
