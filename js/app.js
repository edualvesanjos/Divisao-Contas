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
  },

  listaContas: document.getElementById('lista-contas'),
  listaContasVazia: document.getElementById('lista-contas-vazia'),
  listaCombustivel: document.getElementById('lista-combustivel'),
  listaCombustivelVazia: document.getElementById('lista-combustivel-vazia'),

  btnNovo: document.getElementById('btn-novo'),
  modalConta: document.getElementById('modal-conta'),
  modalCombustivel: document.getElementById('modal-combustivel'),
  formConta: document.getElementById('form-conta'),
  formCombustivel: document.getElementById('form-combustivel'),

  statusIndicator: document.getElementById('status-indicator'),
  statusLabel: document.getElementById('status-label'),
  btnLogout: document.getElementById('btn-logout'),
};

let currentUser = null;
let activeTab = 'contas';
let isSignUpMode = false;

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
      await enterApp(session.user);
    } else if (isSignUpMode) {
      els.authError.textContent = 'Conta criada! Verifique seu e-mail para confirmar o login.';
      els.authError.hidden = false;
    }
  } catch (err) {
    els.authError.textContent = traduzErroAuth(err.message);
    els.authError.hidden = false;
  } finally {
    els.authSubmit.disabled = false;
  }
});

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
  await renderTab(activeTab);

  syncAll(currentUser.id).then(() => renderTab(activeTab));
  watchConnectivity(() => currentUser?.id, () => renderTab(activeTab));
}

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
  els.tabTitle.textContent = tab === 'contas' ? 'Contas' : 'Combustível';

  els.tabButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tab));
  Object.entries(els.tabPanels).forEach(([name, panel]) => {
    panel.hidden = name !== tab;
  });

  renderTab(tab);
}

// ---------------------------------------------------------
// Listagem
// ---------------------------------------------------------

const TIPO_LABEL = { agua: 'Água', luz: 'Luz', internet: 'Internet' };
const formatMoeda = (valor) =>
  valor == null ? '—' : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatData = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR') : '—');

async function renderTab(tab) {
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
    </li>`;
}

// ---------------------------------------------------------
// Modais de criação
// ---------------------------------------------------------

els.btnNovo.addEventListener('click', () => {
  if (activeTab === 'contas') {
    els.formConta.reset();
    els.modalConta.hidden = false;
  } else {
    els.formCombustivel.reset();
    els.modalCombustivel.hidden = false;
  }
});

document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', () => {
    els.modalConta.hidden = true;
    els.modalCombustivel.hidden = true;
  });
});

els.formConta.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser) return;

  await localDb.create('contas_consumo', {
    user_id: currentUser.id,
    tipo: document.getElementById('conta-tipo').value,
    valor_total: Number(document.getElementById('conta-valor-total').value),
    valor_rateado: parseOptionalNumber('conta-valor-rateado'),
    data_vencimento: parseOptionalText('conta-vencimento'),
    pago: document.getElementById('conta-pago').checked,
    data_pagamento: parseOptionalText('conta-data-pagamento'),
    data_transferencia_rateio: parseOptionalText('conta-data-rateio'),
    data_ordenacao: parseOptionalText('conta-vencimento') || new Date().toISOString().slice(0, 10),
  });

  els.modalConta.hidden = true;
  await renderTab('contas');
  triggerBackgroundSync();
});

els.formCombustivel.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser) return;

  const data = document.getElementById('combustivel-data').value;

  await localDb.create('abastecimentos', {
    user_id: currentUser.id,
    data,
    valor_total: Number(document.getElementById('combustivel-valor-total').value),
    valor_rateado: parseOptionalNumber('combustivel-valor-rateado'),
    litros: parseOptionalNumber('combustivel-litros'),
    km_atual: parseOptionalNumber('combustivel-km'),
    posto: parseOptionalText('combustivel-posto'),
    data_transferencia_rateio: parseOptionalText('combustivel-data-rateio'),
    data_ordenacao: data,
  });

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
  await signOut();
  currentUser = null;
  els.viewApp.hidden = true;
  els.viewAuth.hidden = false;
  els.formAuth.reset();
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
