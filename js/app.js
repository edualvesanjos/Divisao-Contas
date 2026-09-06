// =========================================================
// App principal
// =========================================================

import { getSession, signIn, signUp, signOut, onAuthChange } from './auth.js';
import { localDb } from './db-local.js';
import { syncAll, watchConnectivity, isOnline } from './sync.js';

const els = {
  viewAuth: document.getElementById('view-auth'),
  viewApp: document.getElementById('view-app'),
  formAuth: document.getElementById('form-auth'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  authError: document.getElementById('auth-error'),
  authSubmit: document.getElementById('auth-submit'),
  authToggle: document.getElementById('auth-toggle'),

  tabTitle: document.getElementById('tab-title'),
  appVersion: document.getElementById('app-version'),
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanels: {
    contas: document.getElementById('tab-contas'),
    combustivel: document.getElementById('tab-combustivel'),
    config: document.getElementById('tab-config'),
  },

  listaContas: document.getElementById('lista-contas'),
  listaContasVazia: document.getElementById('lista-contas-vazia'),
  listaCombustivel: document.getElementById('lista-combustivel'),
  listaCombustivelVazia: document.getElementById('lista-combustivel-vazia'),

  btnNovo: document.getElementById('btn-novo'),
  modalConta: document.getElementById('modal-conta'),
  modalCombustivel: document.getElementById('modal-combustivel'),
  modalContaTitle: document.getElementById('modal-conta-title'),
  modalCombustivelTitle: document.getElementById('modal-combustivel-title'),
  formConta: document.getElementById('form-conta'),
  formCombustivel: document.getElementById('form-combustivel'),
  btnExcluirConta: document.getElementById('btn-excluir-conta'),
  btnExcluirCombustivel: document.getElementById('btn-excluir-combustivel'),

  statusIndicator: document.getElementById('status-indicator'),
  statusLabel: document.getElementById('status-label'),
  btnLogout: document.getElementById('btn-logout'),

  formConfig: document.getElementById('form-config'),
  configParticipantes: document.getElementById('config-participantes'),
  configPercentual: document.getElementById('config-percentual'),
};

let currentUser = null;
let activeTab = 'contas';
let isSignUpMode = false;
let editingId = null;
let settings = { numero_participantes_padrao: 2, percentual_combustivel_padrao: 50 };

// ---------------------------------------------------------
// Autenticação
// ---------------------------------------------------------

els.authToggle.addEventListener('click', () => {
  isSignUpMode = !isSignUpMode;
  els.authSubmit.textContent = isSignUpMode ? 'Criar conta' : 'Entrar';
  els.authToggle.textContent = isSignUpMode ? 'Já tenho conta' : 'Criar uma conta';
});

els.formAuth.addEventListener('submit', async (event) => {
  event.preventDefault();
  els.authError.hidden = true;
  els.authSubmit.disabled = true;

  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;

  try {
    const session = isSignUpMode
      ? await signUp(email, password)
      : await signIn(email, password);

    if (session) {
      showToast('Conectado com sucesso!');
      await enterApp(session.user);
    } else if (isSignUpMode) {
      els.authError.textContent = 'Conta criada! Verifique seu e-mail para confirmar o login.';
      els.authError.hidden = false;
    }
  } catch (err) {
    console.error('[auth] falha no login/cadastro:', err);
    els.authError.textContent = traduzErroAuth(err.message || 'Erro desconhecido ao conectar.');
    els.authError.hidden = false;
  } finally {
    els.authSubmit.disabled = false;
  }
});

function showToast(message, type = 'success') {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('is-error', type === 'error');
  toast.classList.add('is-visible');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
}

function traduzErroAuth(message) {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('User already registered')) return 'Já existe uma conta com esse e-mail.';
  return message;
}

async function enterApp(user) {
  currentUser = user;
  els.viewAuth.hidden = true;
  els.viewApp.hidden = false;

  updateConnectionStatus();

  try {
    await loadSettings();
    await renderTab(activeTab);
  } catch (err) {
    console.error('[app] falha ao carregar lista local:', err);
    showToast('Entrou, mas houve um erro ao carregar os dados locais.', 'error');
  }

  syncAll(currentUser.id)
    .then(() => renderTab(activeTab))
    .catch((err) => console.error('[sync] falha na sincronização inicial:', err));

  watchConnectivity(() => currentUser?.id, () => renderTab(activeTab));
}

async function loadSettings() {
  if (!currentUser) return;
  const record = await localDb.get('configuracoes', currentUser.id);
  if (record) {
    settings = {
      numero_participantes_padrao: record.numero_participantes_padrao ?? 2,
      percentual_combustivel_padrao: record.percentual_combustivel_padrao ?? 50,
    };
  } else {
    settings = { numero_participantes_padrao: 2, percentual_combustivel_padrao: 50 };
  }
  els.configParticipantes.value = settings.numero_participantes_padrao;
  els.configPercentual.value = settings.percentual_combustivel_padrao;
}

els.formConfig.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser) return;

  settings = {
    numero_participantes_padrao: Number(els.configParticipantes.value),
    percentual_combustivel_padrao: Number(els.configPercentual.value),
  };

  await localDb.putWithId('configuracoes', currentUser.id, {
    user_id: currentUser.id,
    ...settings,
  });

  showToast('Configurações salvas.');
  triggerBackgroundSync();
});

async function checkExistingSession() {
  const session = await getSession();
  if (session) {
    await enterApp(session.user);
  } else {
    els.viewAuth.hidden = false;
  }
}

onAuthChange((session) => {
  if (!session) {
    currentUser = null;
    els.viewApp.hidden = true;
    els.viewAuth.hidden = false;
  }
});

// ---------------------------------------------------------
// Navegação entre abas
// ---------------------------------------------------------

els.tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchTab(tab) {
  activeTab = tab;
  const titles = { contas: 'Contas', combustivel: 'Combustível', config: 'Configurações' };
  els.tabTitle.textContent = titles[tab];

  els.tabButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tab));
  Object.entries(els.tabPanels).forEach(([name, panel]) => {
    panel.hidden = name !== tab;
  });

  els.btnNovo.hidden = tab === 'config';

  if (tab !== 'config') renderTab(tab);
}

// ---------------------------------------------------------
// Listagem
// ---------------------------------------------------------

const TIPO_LABEL = { agua: 'Água', luz: 'Luz', internet: 'Internet' };
const formatMoeda = (valor) =>
  valor == null ? '—' : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatData = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR') : '—');

async function renderTab(tab) {
  if (tab === 'config') return;

  if (tab === 'contas') {
    const rows = await localDb.listAll('contas_consumo');
    els.listaContasVazia.hidden = rows.length > 0;
    els.listaContas.innerHTML = rows.map(renderContaItem).join('');
  } else {
    const rows = await localDb.listAll('abastecimentos');
    els.listaCombustivelVazia.hidden = rows.length > 0;
    els.listaCombustivel.innerHTML = rows.map(renderCombustivelItem).join('');
  }
}

function renderContaItem(c) {
  const flag = c.pago
    ? '<span class="entry-flag is-pago">paga</span>'
    : '<span class="entry-flag is-pendente">pendente</span>';
  return `
    <li class="entry-card">
      <div class="entry-main">
        <span class="entry-title">${TIPO_LABEL[c.tipo] || c.tipo}</span>
        <span class="entry-meta">Vence em ${formatData(c.data_vencimento)}</span>
        ${flag}
      </div>
      <div class="entry-values">
        <div class="entry-value-total">${formatMoeda(c.valor_total)}</div>
        <div class="entry-value-rateado">rateado ${formatMoeda(c.valor_rateado)}</div>
      </div>
      <div class="entry-actions">
        <button class="entry-action-btn" data-action="edit" data-store="contas_consumo" data-id="${c.id}" aria-label="Editar">✏️</button>
        <button class="entry-action-btn is-danger" data-action="delete" data-store="contas_consumo" data-id="${c.id}" aria-label="Excluir">🗑️</button>
      </div>
    </li>`;
}

function renderCombustivelItem(a) {
  return `
    <li class="entry-card">
      <div class="entry-main">
        <span class="entry-title">${a.posto || 'Abastecimento'}</span>
        <span class="entry-meta">${formatData(a.data)}${a.litros ? ` · ${a.litros} L` : ''}</span>
      </div>
      <div class="entry-values">
        <div class="entry-value-total">${formatMoeda(a.valor_total)}</div>
        <div class="entry-value-rateado">rateado ${formatMoeda(a.valor_rateado)}</div>
      </div>
      <div class="entry-actions">
        <button class="entry-action-btn" data-action="edit" data-store="abastecimentos" data-id="${a.id}" aria-label="Editar">✏️</button>
        <button class="entry-action-btn is-danger" data-action="delete" data-store="abastecimentos" data-id="${a.id}" aria-label="Excluir">🗑️</button>
      </div>
    </li>`;
}

// ---------------------------------------------------------
// Modais de criação/edição
// ---------------------------------------------------------

els.btnNovo.addEventListener('click', () => {
  editingId = null;
  if (activeTab === 'contas') {
    els.formConta.reset();
    document.getElementById('conta-participantes').value = settings.numero_participantes_padrao;
    atualizarPreviewConta();
    els.modalContaTitle.textContent = 'Nova conta';
    els.btnExcluirConta.hidden = true;
    els.modalConta.hidden = false;
  } else {
    els.formCombustivel.reset();
    document.getElementById('combustivel-percentual').value = settings.percentual_combustivel_padrao;
    atualizarPreviewCombustivel();
    els.modalCombustivelTitle.textContent = 'Novo abastecimento';
    els.btnExcluirCombustivel.hidden = true;
    els.modalCombustivel.hidden = false;
  }
});

document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', () => {
    editingId = null;
    els.modalConta.hidden = true;
    els.modalCombustivel.hidden = true;
  });
});

// Delegação de clique nas listas: editar ou excluir um lançamento existente
els.listaContas.addEventListener('click', (event) => handleListClick(event, 'contas_consumo'));
els.listaCombustivel.addEventListener('click', (event) => handleListClick(event, 'abastecimentos'));

async function handleListClick(event, storeName) {
  const btn = event.target.closest('.entry-action-btn');
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'edit') {
    await abrirEdicao(storeName, id);
  } else if (action === 'delete') {
    await excluirRegistro(storeName, id);
  }
}

function atualizarPreviewConta() {
  const valorTotal = Number(document.getElementById('conta-valor-total').value) || 0;
  const participantes = Number(document.getElementById('conta-participantes').value) || 1;
  const rateado = valorTotal / participantes;
  document.getElementById('conta-valor-rateado-preview').textContent = formatMoeda(rateado);
  return rateado;
}

function atualizarPreviewCombustivel() {
  const valorTotal = Number(document.getElementById('combustivel-valor-total').value) || 0;
  const percentual = Number(document.getElementById('combustivel-percentual').value) || 0;
  const rateado = valorTotal * (percentual / 100);
  document.getElementById('combustivel-valor-rateado-preview').textContent = formatMoeda(rateado);
  return rateado;
}

['conta-valor-total', 'conta-participantes'].forEach((id) => {
  document.getElementById(id).addEventListener('input', atualizarPreviewConta);
});

['combustivel-valor-total', 'combustivel-percentual'].forEach((id) => {
  document.getElementById(id).addEventListener('input', atualizarPreviewCombustivel);
});

async function abrirEdicao(storeName, id) {
  const record = await localDb.get(storeName, id);
  if (!record) return;

  editingId = id;

  if (storeName === 'contas_consumo') {
    document.getElementById('conta-tipo').value = record.tipo;
    document.getElementById('conta-valor-total').value = record.valor_total ?? '';
    document.getElementById('conta-participantes').value =
      record.numero_participantes ?? settings.numero_participantes_padrao;
    document.getElementById('conta-vencimento').value = record.data_vencimento ?? '';
    document.getElementById('conta-pago').checked = !!record.pago;
    document.getElementById('conta-data-pagamento').value = record.data_pagamento ?? '';
    document.getElementById('conta-data-rateio').value = record.data_transferencia_rateio ?? '';
    atualizarPreviewConta();

    els.modalContaTitle.textContent = 'Editar conta';
    els.btnExcluirConta.hidden = false;
    els.modalConta.hidden = false;
  } else {
    document.getElementById('combustivel-data').value = record.data ?? '';
    document.getElementById('combustivel-valor-total').value = record.valor_total ?? '';
    document.getElementById('combustivel-percentual').value =
      record.percentual_rateado ?? settings.percentual_combustivel_padrao;
    document.getElementById('combustivel-litros').value = record.litros ?? '';
    document.getElementById('combustivel-km').value = record.km_atual ?? '';
    document.getElementById('combustivel-posto').value = record.posto ?? '';
    document.getElementById('combustivel-data-rateio').value = record.data_transferencia_rateio ?? '';
    atualizarPreviewCombustivel();

    els.modalCombustivelTitle.textContent = 'Editar abastecimento';
    els.btnExcluirCombustivel.hidden = false;
    els.modalCombustivel.hidden = false;
  }
}

async function excluirRegistro(storeName, id) {
  const confirmado = window.confirm('Tem certeza que deseja excluir este lançamento?');
  if (!confirmado) return;

  await localDb.remove(storeName, id);
  editingId = null;
  els.modalConta.hidden = true;
  els.modalCombustivel.hidden = true;

  await renderTab(activeTab);
  triggerBackgroundSync();
  showToast('Lançamento excluído.');
}

els.btnExcluirConta.addEventListener('click', () => {
  if (editingId) excluirRegistro('contas_consumo', editingId);
});

els.btnExcluirCombustivel.addEventListener('click', () => {
  if (editingId) excluirRegistro('abastecimentos', editingId);
});

els.formConta.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser) return;

  const valorTotal = Number(document.getElementById('conta-valor-total').value);
  const participantes = Number(document.getElementById('conta-participantes').value);

  const fields = {
    user_id: currentUser.id,
    tipo: document.getElementById('conta-tipo').value,
    valor_total: valorTotal,
    numero_participantes: participantes,
    valor_rateado: valorTotal / participantes,
    data_vencimento: parseOptionalText('conta-vencimento'),
    pago: document.getElementById('conta-pago').checked,
    data_pagamento: parseOptionalText('conta-data-pagamento'),
    data_transferencia_rateio: parseOptionalText('conta-data-rateio'),
    data_ordenacao: parseOptionalText('conta-vencimento') || new Date().toISOString().slice(0, 10),
  };

  if (editingId) {
    await localDb.update('contas_consumo', editingId, fields);
  } else {
    await localDb.create('contas_consumo', fields);
  }

  editingId = null;
  els.modalConta.hidden = true;
  await renderTab('contas');
  triggerBackgroundSync();
});

els.formCombustivel.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser) return;

  const data = document.getElementById('combustivel-data').value;
  const valorTotal = Number(document.getElementById('combustivel-valor-total').value);
  const percentual = Number(document.getElementById('combustivel-percentual').value);

  const fields = {
    user_id: currentUser.id,
    data,
    valor_total: valorTotal,
    percentual_rateado: percentual,
    valor_rateado: valorTotal * (percentual / 100),
    litros: parseOptionalNumber('combustivel-litros'),
    km_atual: parseOptionalNumber('combustivel-km'),
    posto: parseOptionalText('combustivel-posto'),
    data_transferencia_rateio: parseOptionalText('combustivel-data-rateio'),
    data_ordenacao: data,
  };

  if (editingId) {
    await localDb.update('abastecimentos', editingId, fields);
  } else {
    await localDb.create('abastecimentos', fields);
  }

  editingId = null;
  els.modalCombustivel.hidden = true;
  await renderTab('combustivel');
  triggerBackgroundSync();
});

function parseOptionalNumber(id) {
  const raw = document.getElementById(id).value;
  return raw === '' ? null : Number(raw);
}

function parseOptionalText(id) {
  const raw = document.getElementById(id).value;
  return raw === '' ? null : raw;
}

function triggerBackgroundSync() {
  if (currentUser) syncAll(currentUser.id).then(() => renderTab(activeTab));
}

// ---------------------------------------------------------
// Indicador de conexão
// ---------------------------------------------------------

function updateConnectionStatus() {
  const online = isOnline();
  els.statusIndicator.classList.toggle('is-offline', !online);
  els.statusLabel.textContent = online ? 'online' : 'offline';
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// ---------------------------------------------------------
// Logout
// ---------------------------------------------------------

els.btnLogout.addEventListener('click', async () => {
  try {
    await signOut();
  } catch (err) {
    console.error('[auth] falha ao sair:', err);
  } finally {
    window.location.reload();
  }
});

// ---------------------------------------------------------
// Início
// ---------------------------------------------------------

checkExistingSession();
loadAppVersion();

async function loadAppVersion() {
  try {
    const res = await fetch('./package.json');
    const pkg = await res.json();
    els.appVersion.textContent = `v${pkg.version}`;
  } catch (err) {
    console.warn('Não foi possível carregar a versão do app:', err);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service worker não registrado:', err);
    });
  });
}
