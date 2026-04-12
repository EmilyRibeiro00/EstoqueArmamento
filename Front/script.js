const BASE_URL = "http://localhost:3000/api";

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page-section");
const modalOverlays = document.querySelectorAll(".modal-overlay");
const modalCloseButtons = document.querySelectorAll("[data-close-modal]");
const crudSearchInputs = document.querySelectorAll(".crud-search");
const actionCards = document.querySelectorAll(".action-card");

let currentDelete = {
  entity: null,
  id: null
};

let currentEdit = {
  entity: null,
  id: null
};

const entityConfig = {
  tipos: {
    endpoint: "tipos",
    idField: "id_tipo",
    modalId: "tipoModal",
    tableBodyId: "tiposTableBody"
  },
  fabricantes: {
    endpoint: "fabricantes",
    idField: "id_fabricante",
    modalId: "fabricanteModal",
    tableBodyId: "fabricantesTableBody"
  },
  modelos: {
    endpoint: "modelos",
    idField: "id_produto",
    modalId: "modeloModal",
    tableBodyId: "modelosTableBody"
  },
  unidades: {
    endpoint: "unidades",
    idField: "id_unidade",
    modalId: "unidadeModal",
    tableBodyId: "unidadesTableBody"
  },
  agentes: {
    endpoint: "agentes",
    idField: "id_agente",
    modalId: "agenteModal",
    tableBodyId: "agentesTableBody"
  },
  itens: {
    endpoint: "itens",
    idField: "id_item",
    modalId: "itemModal",
    tableBodyId: "itensTableBody"
  },
  movimentacoes: {
    endpoint: "movimentacoes",
    idField: "id_mov",
    modalId: "movimentacaoModal",
    tableBodyId: "movimentacoesTableBody"
  },
  operadores: {
    endpoint: "operadores",
    idField: "id_operador",
    modalId: "operadorModal",
    tableBodyId: "operadoresTableBody"
  }
};

/* 
  Faz a navegação entre as seções da página
  sem recarregar o HTML.
*/
function setupNavigation() {
  navItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      const target = item.dataset.page;
      const targetPage = document.getElementById(target);

      if (!targetPage) return;

      pages.forEach((page) => {
        page.classList.remove("active");
      });

      navItems.forEach((nav) => {
        nav.classList.remove("active");
      });

      targetPage.classList.add("active");
      item.classList.add("active");
    });
  });
}

/* 
  Abre um modal pelo id.
*/
function openModal(modalId) {
  const modal = document.getElementById(modalId);

  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/* 
  Fecha um modal específico.
*/
function closeModal(modal) {
  if (!modal) return;

  modal.classList.remove("active");
  updateBodyScroll();
}

/* 
  Fecha todos os modais abertos.
*/
function closeAllModals() {
  modalOverlays.forEach((modal) => {
    modal.classList.remove("active");
  });

  document.body.style.overflow = "";
}

/* 
  Libera ou trava o scroll da página
  dependendo se existe modal aberto.
*/
function updateBodyScroll() {
  const hasActiveModal = document.querySelector(".modal-overlay.active");
  document.body.style.overflow = hasActiveModal ? "hidden" : "";
}

/* 
  Configura o fechamento dos modais:
  botão X, clique fora e tecla ESC.
*/
function setupModalCloseEvents() {
  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal-overlay");
      closeModal(modal);
    });
  });

  modalOverlays.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });
}

/* 
  Liga os botões de ações rápidas do painel
  aos modais corretos.
*/
function setupQuickActions() {
  actionCards.forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.textContent.toLowerCase();

      if (text.includes("novo empréstimo")) {
        resetMovimentacaoForm();
        const tipoSelect = document.getElementById("movimentacaoTipo");
        if (tipoSelect) {
          tipoSelect.value = "Retirada";
        }
        currentEdit.entity = null;
        currentEdit.id = null;
        openModal("movimentacaoModal");
      }

      if (text.includes("nova devolução")) {
        resetMovimentacaoForm();
        const tipoSelect = document.getElementById("movimentacaoTipo");
        if (tipoSelect) {
          tipoSelect.value = "Devolução";
        }
        currentEdit.entity = null;
        currentEdit.id = null;
        openModal("movimentacaoModal");
      }

      if (text.includes("adicionar item")) {
        resetItemForm();
        currentEdit.entity = null;
        currentEdit.id = null;
        openModal("itemModal");
      }

      if (text.includes("adicionar agente")) {
        resetAgenteForm();
        currentEdit.entity = null;
        currentEdit.id = null;
        openModal("agenteModal");
      }
    });
  });
}

/* 
  Faz uma requisição para a API.
  Essa função centraliza GET, POST, PUT e DELETE.
*/
async function apiRequest(path, options = {}) {
  const response = await fetch(`${BASE_URL}/${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    let errorMessage = "Erro ao comunicar com a API.";

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (error) {
      // mantém mensagem padrão
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/* 
  Busca uma lista de registros na API.
*/
async function fetchList(entity) {
  const config = entityConfig[entity];
  return apiRequest(config.endpoint);
}

/* 
  Busca um registro específico na API.
*/
async function fetchOne(entity, id) {
  const config = entityConfig[entity];
  return apiRequest(`${config.endpoint}/${id}`);
}

/* 
  Cria um novo registro na API.
*/
async function createRecord(entity, data) {
  const config = entityConfig[entity];

  return apiRequest(config.endpoint, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

/* 
  Atualiza um registro existente na API.
*/
async function updateRecord(entity, id, data) {
  const config = entityConfig[entity];

  return apiRequest(`${config.endpoint}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

/* 
  Remove um registro da API.
*/
async function deleteRecord(entity, id) {
  const config = entityConfig[entity];

  return apiRequest(`${config.endpoint}/${id}`, {
    method: "DELETE"
  });
}

/* 
  Preenche um select com opções vindas da API.
*/
function fillSelect(select, items, valueField, labelCallback, placeholder = "Selecione") {
  if (!select) return;

  select.innerHTML = `<option value="">${placeholder}</option>`;

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item[valueField];
    option.textContent = labelCallback(item);
    select.appendChild(option);
  });
}

/* 
  Carrega os selects de relacionamento:
  tipo, fabricante, unidade, modelo, agente e item.
*/
async function loadRelationshipSelects() {
  try {
    const [
      tipos,
      fabricantes,
      unidades,
      modelos,
      agentes,
      itens
    ] = await Promise.all([
      fetchList("tipos"),
      fetchList("fabricantes"),
      fetchList("unidades"),
      fetchList("modelos"),
      fetchList("agentes"),
      fetchList("itens")
    ]);

    fillSelect(
      document.getElementById("modeloTipo"),
      tipos,
      "id_tipo",
      (item) => item.nome_tipo
    );

    fillSelect(
      document.getElementById("modeloFabricante"),
      fabricantes,
      "id_fabricante",
      (item) => item.nome_fabricante
    );

    fillSelect(
      document.getElementById("agenteUnidade"),
      unidades,
      "id_unidade",
      (item) => item.nome_unidade
    );

    fillSelect(
      document.getElementById("itemModelo"),
      modelos,
      "id_produto",
      (item) => item.nome_modelo
    );

    fillSelect(
      document.getElementById("itemAgente"),
      agentes,
      "id_agente",
      (item) => item.nome
    );

    fillSelect(
      document.getElementById("movimentacaoItem"),
      itens,
      "id_item",
      (item) => item.numero_serie
    );

    fillSelect(
      document.getElementById("movimentacaoAgente"),
      agentes,
      "id_agente",
      (item) => item.nome
    );
  } catch (error) {
    console.error(error);
  }
}

/* 
  Retorna uma string amigável para o status do item.
*/
function formatStatus(status) {
  const map = {
    disponivel: "Disponível",
    ativo: "Ativo",
    manutencao: "Manutenção",
    baixado: "Baixado",
    "em uso": "Em uso"
  };

  return map[status] || status || "--";
}

/* 
  Retorna a classe CSS correta para o status.
*/
function getStatusClass(status) {
  const map = {
    disponivel: "status-disponivel",
    ativo: "status-ativo",
    manutencao: "status-manutencao",
    baixado: "status-baixado",
    "em uso": "status-ativo"
  };

  return map[status] || "status-disponivel";
}

/* 
  Gera o HTML do botão de editar e remover.
*/
function buildActions(entity, id) {
  return `
    <div class="table-actions">
      <button class="table-btn edit-btn" type="button" data-entity="${entity}" data-id="${id}">Editar</button>
      <button class="table-btn delete-btn" type="button" data-entity="${entity}" data-id="${id}">Remover</button>
    </div>
  `;
}

/* 
  Mostra uma mensagem padrão quando a tabela está vazia.
*/
function renderEmptyRow(colspan) {
  return `
    <tr>
      <td colspan="${colspan}" class="empty-state">Nenhum registro encontrado.</td>
    </tr>
  `;
}

/* 
  Renderiza a tabela de tipos.
*/
async function loadTiposTable() {
  const tbody = document.getElementById("tiposTableBody");
  if (!tbody) return;

  try {
    const tipos = await fetchList("tipos");

    if (!Array.isArray(tipos) || !tipos.length) {
      tbody.innerHTML = renderEmptyRow(3);
      return;
    }

    tbody.innerHTML = tipos.map((tipo) => `
      <tr>
        <td>${tipo.id_tipo}</td>
        <td>${tipo.nome_tipo}</td>
        <td>${buildActions("tipos", tipo.id_tipo)}</td>
      </tr>
    `).join("");

    bindCrudButtons();
  } catch (error) {
    tbody.innerHTML = renderEmptyRow(3);
    console.error(error);
  }
}

/* 
  Renderiza a tabela de fabricantes.
*/
async function loadFabricantesTable() {
  const tbody = document.getElementById("fabricantesTableBody");
  if (!tbody) return;

  try {
    const fabricantes = await fetchList("fabricantes");

    if (!Array.isArray(fabricantes) || !fabricantes.length) {
      tbody.innerHTML = renderEmptyRow(4);
      return;
    }

    tbody.innerHTML = fabricantes.map((fabricante) => `
      <tr>
        <td>${fabricante.id_fabricante}</td>
        <td>${fabricante.nome_fabricante}</td>
        <td>${fabricante.cnpj || "--"}</td>
        <td>${buildActions("fabricantes", fabricante.id_fabricante)}</td>
      </tr>
    `).join("");

    bindCrudButtons();
  } catch (error) {
    tbody.innerHTML = renderEmptyRow(4);
    console.error(error);
  }
}

/* 
  Renderiza a tabela de modelos.
*/
async function loadModelosTable() {
  const tbody = document.getElementById("modelosTableBody");
  if (!tbody) return;

  try {
    const modelos = await fetchList("modelos");

    if (!Array.isArray(modelos) || !modelos.length) {
      tbody.innerHTML = renderEmptyRow(6);
      return;
    }

    tbody.innerHTML = modelos.map((modelo) => `
      <tr>
        <td>${modelo.id_produto}</td>
        <td>${modelo.nome_modelo}</td>
        <td>${modelo.calibre || "--"}</td>
        <td>${modelo.tipo_nome || modelo.nome_tipo || "--"}</td>
        <td>${modelo.fabricante_nome || modelo.nome_fabricante || "--"}</td>
        <td>${buildActions("modelos", modelo.id_produto)}</td>
      </tr>
    `).join("");

    bindCrudButtons();
  } catch (error) {
    tbody.innerHTML = renderEmptyRow(6);
    console.error(error);
  }
}

/* 
  Renderiza a tabela de unidades.
*/
async function loadUnidadesTable() {
  const tbody = document.getElementById("unidadesTableBody");
  if (!tbody) return;

  try {
    const unidades = await fetchList("unidades");

    if (!Array.isArray(unidades) || !unidades.length) {
      tbody.innerHTML = renderEmptyRow(5);
      return;
    }

    tbody.innerHTML = unidades.map((unidade) => `
      <tr>
        <td>${unidade.id_unidade}</td>
        <td>${unidade.nome_unidade}</td>
        <td>${unidade.sigla || "--"}</td>
        <td>${unidade.cep || "--"}</td>
        <td>${buildActions("unidades", unidade.id_unidade)}</td>
      </tr>
    `).join("");

    bindCrudButtons();
  } catch (error) {
    tbody.innerHTML = renderEmptyRow(5);
    console.error(error);
  }
}

/* 
  Renderiza a tabela de agentes.
*/
async function loadAgentesTable() {
  const tbody = document.getElementById("agentesTableBody");
  if (!tbody) return;

  try {
    const agentes = await fetchList("agentes");

    if (!Array.isArray(agentes) || !agentes.length) {
      tbody.innerHTML = renderEmptyRow(6);
      return;
    }

    tbody.innerHTML = agentes.map((agente) => `
      <tr>
        <td>${agente.id_agente}</td>
        <td>${agente.nome}</td>
        <td>${agente.matricula || "--"}</td>
        <td>${agente.cargo || "--"}</td>
        <td>${agente.unidade_nome || agente.nome_unidade || "--"}</td>
        <td>${buildActions("agentes", agente.id_agente)}</td>
      </tr>
    `).join("");

    bindCrudButtons();
  } catch (error) {
    tbody.innerHTML = renderEmptyRow(6);
    console.error(error);
  }
}

/* 
  Renderiza a tabela de itens.
*/
async function loadItensTable() {
  const tbody = document.getElementById("itensTableBody");
  if (!tbody) return;

  try {
    const itens = await fetchList("itens");

    if (!Array.isArray(itens) || !itens.length) {
      tbody.innerHTML = renderEmptyRow(6);
      return;
    }

    tbody.innerHTML = itens.map((item) => `
      <tr>
        <td>${item.id_item}</td>
        <td>${item.numero_serie}</td>
        <td><span class="badge-status ${getStatusClass(item.status)}">${formatStatus(item.status)}</span></td>
        <td>${item.modelo_nome || item.nome_modelo || "--"}</td>
        <td>${item.agente_nome || item.nome_agente || "--"}</td>
        <td>${buildActions("itens", item.id_item)}</td>
      </tr>
    `).join("");

    bindCrudButtons();
  } catch (error) {
    tbody.innerHTML = renderEmptyRow(6);
    console.error(error);
  }
}

/* 
  Renderiza a tabela de movimentações.
*/
async function loadMovimentacoesTable() {
  const tbody = document.getElementById("movimentacoesTableBody");
  if (!tbody) return;

  try {
    const movimentacoes = await fetchList("movimentacoes");

    if (!Array.isArray(movimentacoes) || !movimentacoes.length) {
      tbody.innerHTML = renderEmptyRow(7);
      return;
    }

    tbody.innerHTML = movimentacoes.map((mov) => `
      <tr>
        <td>${mov.id_mov}</td>
        <td>${mov.data_hora || "--"}</td>
        <td>${mov.tipo || "--"}</td>
        <td>${mov.observacao || "--"}</td>
        <td>${mov.item_numero_serie || mov.numero_serie || "--"}</td>
        <td>${mov.agente_nome || mov.nome_agente || "--"}</td>
        <td>${buildActions("movimentacoes", mov.id_mov)}</td>
      </tr>
    `).join("");

    bindCrudButtons();
  } catch (error) {
    tbody.innerHTML = renderEmptyRow(7);
    console.error(error);
  }
}

/* 
  Renderiza a tabela de operadores.
*/
async function loadOperadoresTable() {
  const tbody = document.getElementById("operadoresTableBody");
  if (!tbody) return;

  try {
    const operadores = await fetchList("operadores");

    if (!Array.isArray(operadores) || !operadores.length) {
      tbody.innerHTML = renderEmptyRow(5);
      return;
    }

    tbody.innerHTML = operadores.map((operador) => `
      <tr>
        <td>${operador.id_operador}</td>
        <td>${operador.nome}</td>
        <td>${operador.matricula || "--"}</td>
        <td>${operador.senha_hash || "--"}</td>
        <td>${buildActions("operadores", operador.id_operador)}</td>
      </tr>
    `).join("");

    bindCrudButtons();
  } catch (error) {
    tbody.innerHTML = renderEmptyRow(5);
    console.error(error);
  }
}

/* 
  Carrega todas as tabelas e também os selects de relacionamento.
*/
async function loadAllData() {
  await Promise.all([
    loadTiposTable(),
    loadFabricantesTable(),
    loadModelosTable(),
    loadUnidadesTable(),
    loadAgentesTable(),
    loadItensTable(),
    loadMovimentacoesTable(),
    loadOperadoresTable(),
    loadRelationshipSelects()
  ]);
}

/* 
  Limpa o formulário de item.
*/
function resetItemForm() {
  document.getElementById("itemNumeroSerie").value = "";
  document.getElementById("itemStatus").value = "Disponível";
  document.getElementById("itemModelo").value = "";
  document.getElementById("itemAgente").value = "";
}

/* 
  Limpa o formulário de agente.
*/
function resetAgenteForm() {
  document.getElementById("agenteNome").value = "";
  document.getElementById("agenteMatricula").value = "";
  document.getElementById("agenteCargo").value = "";
  document.getElementById("agenteUnidade").value = "";
}

/* 
  Limpa o formulário de modelo.
*/
function resetModeloForm() {
  document.getElementById("modeloNome").value = "";
  document.getElementById("modeloCalibre").value = "";
  document.getElementById("modeloTipo").value = "";
  document.getElementById("modeloFabricante").value = "";
}

/* 
  Limpa o formulário de fabricante.
*/
function resetFabricanteForm() {
  document.getElementById("fabricanteNome").value = "";
  document.getElementById("fabricanteCnpj").value = "";
}

/* 
  Limpa o formulário de tipo.
*/
function resetTipoForm() {
  document.getElementById("tipoNome").value = "";
}

/* 
  Limpa o formulário de unidade.
*/
function resetUnidadeForm() {
  document.getElementById("unidadeNome").value = "";
  document.getElementById("unidadeSigla").value = "";
  document.getElementById("unidadeCep").value = "";
}

/* 
  Limpa o formulário de operador.
*/
function resetOperadorForm() {
  document.getElementById("operadorNome").value = "";
  document.getElementById("operadorMatricula").value = "";
  document.getElementById("operadorSenha").value = "";
}

/* 
  Limpa o formulário de movimentação.
*/
function resetMovimentacaoForm() {
  document.getElementById("movimentacaoDataHora").value = "";
  document.getElementById("movimentacaoTipo").value = "Retirada";
  document.getElementById("movimentacaoItem").value = "";
  document.getElementById("movimentacaoAgente").value = "";
  document.getElementById("movimentacaoObservacao").value = "";
}

/* 
  Descobre qual modal deve abrir quando clicamos em "novo".
*/
function setupNewButtons() {
  document.querySelectorAll(".primary-btn[data-open-modal]").forEach((button) => {
    button.addEventListener("click", async () => {
      const modalId = button.dataset.openModal;

      currentEdit.entity = null;
      currentEdit.id = null;

      await loadRelationshipSelects();

      if (modalId === "itemModal") resetItemForm();
      if (modalId === "agenteModal") resetAgenteForm();
      if (modalId === "modeloModal") resetModeloForm();
      if (modalId === "fabricanteModal") resetFabricanteForm();
      if (modalId === "tipoModal") resetTipoForm();
      if (modalId === "unidadeModal") resetUnidadeForm();
      if (modalId === "operadorModal") resetOperadorForm();
      if (modalId === "movimentacaoModal") resetMovimentacaoForm();

      openModal(modalId);
    });
  });
}

/* 
  Liga os botões de editar e remover das tabelas.
*/
function bindCrudButtons() {
  document.querySelectorAll(".edit-btn[data-entity]").forEach((button) => {
    button.addEventListener("click", async () => {
      const entity = button.dataset.entity;
      const id = button.dataset.id;

      await handleEdit(entity, id);
    });
  });

  document.querySelectorAll(".delete-btn[data-entity]").forEach((button) => {
    button.addEventListener("click", () => {
      currentDelete.entity = button.dataset.entity;
      currentDelete.id = button.dataset.id;
      openModal("deleteConfirmModal");
    });
  });
}

/* 
  Preenche o modal com os dados do registro
  que será editado.
*/
async function handleEdit(entity, id) {
  try {
    currentEdit.entity = entity;
    currentEdit.id = id;

    await loadRelationshipSelects();

    const record = await fetchOne(entity, id);

    if (entity === "tipos") {
      resetTipoForm();
      document.getElementById("tipoNome").value = record.nome_tipo || "";
      openModal("tipoModal");
      return;
    }

    if (entity === "fabricantes") {
      resetFabricanteForm();
      document.getElementById("fabricanteNome").value = record.nome_fabricante || "";
      document.getElementById("fabricanteCnpj").value = record.cnpj || "";
      openModal("fabricanteModal");
      return;
    }

    if (entity === "modelos") {
      resetModeloForm();
      document.getElementById("modeloNome").value = record.nome_modelo || "";
      document.getElementById("modeloCalibre").value = record.calibre || "";
      document.getElementById("modeloTipo").value = record.tipo_id || "";
      document.getElementById("modeloFabricante").value = record.fabricante_id || "";
      openModal("modeloModal");
      return;
    }

    if (entity === "unidades") {
      resetUnidadeForm();
      document.getElementById("unidadeNome").value = record.nome_unidade || "";
      document.getElementById("unidadeSigla").value = record.sigla || "";
      document.getElementById("unidadeCep").value = record.cep || "";
      openModal("unidadeModal");
      return;
    }

    if (entity === "agentes") {
      resetAgenteForm();
      document.getElementById("agenteNome").value = record.nome || "";
      document.getElementById("agenteMatricula").value = record.matricula || "";
      document.getElementById("agenteCargo").value = record.cargo || "";
      document.getElementById("agenteUnidade").value = record.unidade_id || "";
      openModal("agenteModal");
      return;
    }

    if (entity === "itens") {
      resetItemForm();
      document.getElementById("itemNumeroSerie").value = record.numero_serie || "";
      document.getElementById("itemStatus").value = formatStatus(record.status);
      document.getElementById("itemModelo").value = record.modelo_id || "";
      document.getElementById("itemAgente").value = record.agente_id || "";
      openModal("itemModal");
      return;
    }

    if (entity === "movimentacoes") {
      resetMovimentacaoForm();
      document.getElementById("movimentacaoDataHora").value = record.data_hora || "";
      document.getElementById("movimentacaoTipo").value =
        record.tipo === "retirada" ? "Retirada" : "Devolução";
      document.getElementById("movimentacaoItem").value = record.item_id || "";
      document.getElementById("movimentacaoAgente").value = record.agente_id || "";
      document.getElementById("movimentacaoObservacao").value = record.observacao || "";
      openModal("movimentacaoModal");
      return;
    }

    if (entity === "operadores") {
      resetOperadorForm();
      document.getElementById("operadorNome").value = record.nome || "";
      document.getElementById("operadorMatricula").value = record.matricula || "";
      document.getElementById("operadorSenha").value = record.senha_hash || "";
      openModal("operadorModal");
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

/* 
  Pega os dados do formulário de tipo.
*/
function getTipoFormData() {
  return {
    nome_tipo: document.getElementById("tipoNome").value.trim()
  };
}

/* 
  Pega os dados do formulário de fabricante.
*/
function getFabricanteFormData() {
  return {
    nome_fabricante: document.getElementById("fabricanteNome").value.trim(),
    cnpj: document.getElementById("fabricanteCnpj").value.trim()
  };
}

/* 
  Pega os dados do formulário de modelo.
*/
function getModeloFormData() {
  return {
    nome_modelo: document.getElementById("modeloNome").value.trim(),
    calibre: document.getElementById("modeloCalibre").value.trim(),
    tipo_id: Number(document.getElementById("modeloTipo").value),
    fabricante_id: Number(document.getElementById("modeloFabricante").value)
  };
}

/* 
  Pega os dados do formulário de unidade.
*/
function getUnidadeFormData() {
  return {
    nome_unidade: document.getElementById("unidadeNome").value.trim(),
    sigla: document.getElementById("unidadeSigla").value.trim(),
    cep: document.getElementById("unidadeCep").value.trim()
  };
}

/* 
  Pega os dados do formulário de agente.
*/
function getAgenteFormData() {
  return {
    nome: document.getElementById("agenteNome").value.trim(),
    matricula: document.getElementById("agenteMatricula").value.trim(),
    cargo: document.getElementById("agenteCargo").value.trim(),
    unidade_id: Number(document.getElementById("agenteUnidade").value)
  };
}

/* 
  Converte o status visual do select para o valor
  que normalmente vai para o backend.
*/
function normalizeItemStatus(label) {
  const map = {
    "Disponível": "disponivel",
    "Ativo": "ativo",
    "Manutenção": "manutencao",
    "Baixado": "baixado",
    "Em uso": "em uso"
  };

  return map[label] || "disponivel";
}

/* 
  Pega os dados do formulário de item.
*/
function getItemFormData() {
  const agenteValue = document.getElementById("itemAgente").value;

  return {
    numero_serie: document.getElementById("itemNumeroSerie").value.trim(),
    status: normalizeItemStatus(document.getElementById("itemStatus").value),
    modelo_id: Number(document.getElementById("itemModelo").value),
    agente_id: agenteValue ? Number(agenteValue) : null
  };
}

/* 
  Pega os dados do formulário de operador.
*/
function getOperadorFormData() {
  return {
    nome: document.getElementById("operadorNome").value.trim(),
    matricula: document.getElementById("operadorMatricula").value.trim(),
    senha_hash: document.getElementById("operadorSenha").value.trim()
  };
}

/* 
  Pega os dados do formulário de movimentação.
*/
function getMovimentacaoFormData() {
  const tipoValue = document.getElementById("movimentacaoTipo").value;

  return {
    data_hora: document.getElementById("movimentacaoDataHora").value,
    tipo: tipoValue === "Retirada" ? "retirada" : "devolução",
    item_id: Number(document.getElementById("movimentacaoItem").value),
    agente_id: Number(document.getElementById("movimentacaoAgente").value),
    observacao: document.getElementById("movimentacaoObservacao").value.trim()
  };
}

/* 
  Faz validações básicas antes de enviar para a API.
*/
function validateData(entity, data) {
  if (entity === "tipos" && !data.nome_tipo) return "Preencha o nome do tipo.";
  if (entity === "fabricantes" && (!data.nome_fabricante || !data.cnpj)) return "Preencha nome e CNPJ.";
  if (entity === "modelos" && (!data.nome_modelo || !data.calibre || !data.tipo_id || !data.fabricante_id)) {
    return "Preencha todos os campos do modelo.";
  }
  if (entity === "unidades" && (!data.nome_unidade || !data.sigla || !data.cep)) {
    return "Preencha todos os campos da unidade.";
  }
  if (entity === "agentes" && (!data.nome || !data.matricula || !data.cargo || !data.unidade_id)) {
    return "Preencha todos os campos do agente.";
  }
  if (entity === "itens" && (!data.numero_serie || !data.modelo_id)) {
    return "Preencha número de série e modelo.";
  }
  if (entity === "operadores" && (!data.nome || !data.matricula || !data.senha_hash)) {
    return "Preencha todos os campos do operador.";
  }
  if (entity === "movimentacoes" && (!data.data_hora || !data.item_id || !data.agente_id)) {
    return "Preencha data/hora, item e agente.";
  }

  return null;
}

/* 
  Salva um tipo.
*/
async function saveTipo() {
  const data = getTipoFormData();
  const error = validateData("tipos", data);

  if (error) {
    alert(error);
    return;
  }

  try {
    if (currentEdit.entity === "tipos" && currentEdit.id) {
      await updateRecord("tipos", currentEdit.id, data);
    } else {
      await createRecord("tipos", data);
    }

    await loadAllData();
    closeAllModals();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* 
  Salva um fabricante.
*/
async function saveFabricante() {
  const data = getFabricanteFormData();
  const error = validateData("fabricantes", data);

  if (error) {
    alert(error);
    return;
  }

  try {
    if (currentEdit.entity === "fabricantes" && currentEdit.id) {
      await updateRecord("fabricantes", currentEdit.id, data);
    } else {
      await createRecord("fabricantes", data);
    }

    await loadAllData();
    closeAllModals();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* 
  Salva um modelo.
*/
async function saveModelo() {
  const data = getModeloFormData();
  const error = validateData("modelos", data);

  if (error) {
    alert(error);
    return;
  }

  try {
    if (currentEdit.entity === "modelos" && currentEdit.id) {
      await updateRecord("modelos", currentEdit.id, data);
    } else {
      await createRecord("modelos", data);
    }

    await loadAllData();
    closeAllModals();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* 
  Salva uma unidade.
*/
async function saveUnidade() {
  const data = getUnidadeFormData();
  const error = validateData("unidades", data);

  if (error) {
    alert(error);
    return;
  }

  try {
    if (currentEdit.entity === "unidades" && currentEdit.id) {
      await updateRecord("unidades", currentEdit.id, data);
    } else {
      await createRecord("unidades", data);
    }

    await loadAllData();
    closeAllModals();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* 
  Salva um agente.
*/
async function saveAgente() {
  const data = getAgenteFormData();
  const error = validateData("agentes", data);

  if (error) {
    alert(error);
    return;
  }

  try {
    if (currentEdit.entity === "agentes" && currentEdit.id) {
      await updateRecord("agentes", currentEdit.id, data);
    } else {
      await createRecord("agentes", data);
    }

    await loadAllData();
    closeAllModals();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* 
  Salva um item.
*/
async function saveItem() {
  const data = getItemFormData();
  const error = validateData("itens", data);

  if (error) {
    alert(error);
    return;
  }

  try {
    if (currentEdit.entity === "itens" && currentEdit.id) {
      await updateRecord("itens", currentEdit.id, data);
    } else {
      await createRecord("itens", data);
    }

    await loadAllData();
    closeAllModals();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* 
  Salva um operador.
*/
async function saveOperador() {
  const data = getOperadorFormData();
  const error = validateData("operadores", data);

  if (error) {
    alert(error);
    return;
  }

  try {
    if (currentEdit.entity === "operadores" && currentEdit.id) {
      await updateRecord("operadores", currentEdit.id, data);
    } else {
      await createRecord("operadores", data);
    }

    await loadAllData();
    closeAllModals();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* 
  Salva uma movimentação.
*/
async function saveMovimentacao() {
  const data = getMovimentacaoFormData();
  const error = validateData("movimentacoes", data);

  if (error) {
    alert(error);
    return;
  }

  try {
    if (currentEdit.entity === "movimentacoes" && currentEdit.id) {
      await updateRecord("movimentacoes", currentEdit.id, data);
    } else {
      await createRecord("movimentacoes", data);
    }

    await loadAllData();
    closeAllModals();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* 
  Liga o botão salvar de cada modal
  com a função correta.
*/
function setupSaveButtons() {
  document.querySelector("#tipoModal .primary-btn")?.addEventListener("click", saveTipo);
  document.querySelector("#fabricanteModal .primary-btn")?.addEventListener("click", saveFabricante);
  document.querySelector("#modeloModal .primary-btn")?.addEventListener("click", saveModelo);
  document.querySelector("#unidadeModal .primary-btn")?.addEventListener("click", saveUnidade);
  document.querySelector("#agenteModal .primary-btn")?.addEventListener("click", saveAgente);
  document.querySelector("#itemModal .primary-btn")?.addEventListener("click", saveItem);
  document.querySelector("#operadorModal .primary-btn")?.addEventListener("click", saveOperador);
  document.querySelector("#movimentacaoModal .primary-btn")?.addEventListener("click", saveMovimentacao);
}

/* 
  Liga o botão final de confirmação de remoção.
*/
function setupDeleteConfirmButton() {
  const confirmDeleteButton = document.querySelector("#deleteConfirmModal .delete-btn");

  if (!confirmDeleteButton) return;

  confirmDeleteButton.addEventListener("click", async () => {
    if (!currentDelete.entity || !currentDelete.id) return;

    try {
      await deleteRecord(currentDelete.entity, currentDelete.id);
      currentDelete.entity = null;
      currentDelete.id = null;

      await loadAllData();
      closeAllModals();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}

/* 
  Faz a busca local em cada tabela,
  filtrando as linhas digitadas.
*/
function setupSearchFilters() {
  crudSearchInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const value = input.value.trim().toLowerCase();
      const section = input.closest(".page-section");

      if (!section) return;

      const rows = section.querySelectorAll("tbody tr");

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(value) ? "" : "none";
      });
    });
  });
}

/* 
  Inicializa tudo quando a página carrega.
*/
async function init() {
  setupNavigation();
  setupModalCloseEvents();
  setupQuickActions();
  setupNewButtons();
  setupSaveButtons();
  setupDeleteConfirmButton();
  setupSearchFilters();
  await loadAllData();
}

init();