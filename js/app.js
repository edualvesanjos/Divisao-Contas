// =========================================================
// App principal
// =========================================================

import { getSession, signIn, signUp, signOut, onAuthChange } from './auth.js';
import { localDb } from './db-local.js';
import { supabase } from './supabase-client.js';
import { syncAll, watchConnectivity, isOnline } from './sync.js';
import { APP_ENVIRONMENT, isDevelopment } from './environment.js';
import { analisarPlanilhaHistorica } from './import-xlsx.js';

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
  environmentBadge: document.getElementById('environment-badge'),
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanels: {
    contas: document.getElementById('tab-contas'),
    combustivel: document.getElementById('tab-combustivel'),
    resumo: document.getElementById('tab-resumo'),
    config: document.getElementById('tab-config'),
  },

  monthNav: document.getElementById('month-nav'),
  mesAtivoLabel: document.getElementById('mes-ativo-label'),
  btnMesAnterior: document.getElementById('btn-mes-anterior'),
  btnMesProximo: document.getElementById('btn-mes-proximo'),
  monthPicker: document.getElementById('month-picker'),
  monthPickerMonth: document.getElementById('month-picker-month'),
  monthPickerYear: document.getElementById('month-picker-year'),
  monthPickerCancel: document.getElementById('month-picker-cancel'),
  monthPickerApply: document.getElementById('month-picker-apply'),

  contasSubtotal: document.getElementById('contas-subtotal'),
  contasSubtotalRateado: document.getElementById('contas-subtotal-rateado'),
  contasVariacao: document.getElementById('contas-variacao'),
  contasVariacaoNote: document.getElementById('contas-variacao-note'),
  contasMediaAno: document.getElementById('contas-media-ano'),
  contasMediaAnoNote: document.getElementById('contas-media-ano-note'),
  combustivelSubtotal: document.getElementById('combustivel-subtotal'),
  combustivelSubtotalRateado: document.getElementById('combustivel-subtotal-rateado'),
  combustivelVariacao: document.getElementById('combustivel-variacao'),
  combustivelVariacaoNote: document.getElementById('combustivel-variacao-note'),
  combustivelMediaAno: document.getElementById('combustivel-media-ano'),
  combustivelMediaAnoNote: document.getElementById('combustivel-media-ano-note'),

  resumoTotalContas: document.getElementById('resumo-total-contas'),
  resumoTotalCombustivel: document.getElementById('resumo-total-combustivel'),
  resumoTotalCombustivelLabel: document.getElementById('resumo-total-combustivel-label'),
  resumoCombustivelRateado: document.getElementById('resumo-combustivel-rateado'),
  resumoContasRateado: document.getElementById('resumo-contas-rateado'),
  resumoTotalRateado: document.getElementById('resumo-total-rateado'),
  resumoVazio: document.getElementById('resumo-vazio'),
  resumoTotalLitros: document.getElementById('resumo-total-litros'),
  resumoLitrosPorTipo: document.getElementById('resumo-litros-por-tipo'),

  formFechamento: document.getElementById('form-fechamento'),
  fechamentoContasPago: document.getElementById('fechamento-contas-pago'),
  fechamentoContasDataPagamento: document.getElementById('fechamento-contas-data-pagamento'),
  fechamentoDataRateio: document.getElementById('fechamento-data-rateio'),
  resumoFechadoBanner: document.getElementById('resumo-fechado-banner'),
  resumoPercentualFechado: document.getElementById('resumo-percentual-fechado'),

  listaPostos: document.getElementById('lista-postos'),

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
  btnForcarSync: document.getElementById('btn-forcar-sync'),

  importXlsxFile: document.getElementById('import-xlsx-file'),
  importContas: document.getElementById('import-contas'),
  importCombustivel: document.getElementById('import-combustivel'),
  btnAnalisarXlsx: document.getElementById('btn-analisar-xlsx'),
  btnImportarXlsx: document.getElementById('btn-importar-xlsx'),
  btnExcluirImportados: document.getElementById('btn-excluir-importados'),
  importXlsxResult: document.getElementById('import-xlsx-result'),
  importXlsxSummary: document.getElementById('import-xlsx-summary'),
  importXlsxStatus: document.getElementById('import-xlsx-status'),
  importXlsxYears: document.getElementById('import-xlsx-years'),
  importXlsxErrors: document.getElementById('import-xlsx-errors'),
  importXlsxWarnings: document.getElementById('import-xlsx-warnings'),
  importXlsxPreview: document.getElementById('import-xlsx-preview'),
};

let currentUser = null;
let activeTab = 'contas';
let isSignUpMode = false;
let editingId = null;
let settings = { numero_participantes_padrao: 2, percentual_combustivel_padrao: 50 };
let importAnalysis = null;

if (els.environmentBadge) {
  els.environmentBadge.hidden = !isDevelopment;
  els.environmentBadge.title = `Ambiente: ${APP_ENVIRONMENT}`;
}

const hoje = new Date();
let mesAtivo = { ano: hoje.getFullYear(), mes: hoje.getMonth() }; // mes: 0-11

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
    await refreshActiveView();
    await atualizarListaPostos();
  } catch (err) {
    console.error('[app] falha ao carregar lista local:', err);
    showToast('Entrou, mas houve um erro ao carregar os dados locais.', 'error');
  }

  syncAll(currentUser.id)
    .then(() => refreshActiveView())
    .catch((err) => console.error('[sync] falha na sincronização inicial:', err));

  watchConnectivity(() => currentUser?.id, () => refreshActiveView());
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

els.btnForcarSync.addEventListener('click', async () => {
  if (!currentUser) return;
  els.btnForcarSync.disabled = true;
  els.btnForcarSync.textContent = 'Sincronizando...';

  try {
    await localDb.markAllForResync('contas_consumo');
    await localDb.markAllForResync('abastecimentos');
    await localDb.markAllForResync('configuracoes');
    await localDb.markAllForResync('fechamentos_mensais');
    await syncAll(currentUser.id);
    await refreshActiveView();
    showToast('Sincronização forçada concluída.');
  } catch (err) {
    console.error('[sync] falha ao forçar sincronização:', err);
    showToast('Falha ao forçar sincronização — veja o console.', 'error');
  } finally {
    els.btnForcarSync.disabled = false;
    els.btnForcarSync.textContent = 'Forçar sincronização de tudo';
  }
});


function formatCompetencia(iso) {
  if (!iso) return '—';
  const [ano, mes] = iso.split('-').map(Number);
  if (!ano || !mes) return '—';
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function resetImportAnalysis() {
  importAnalysis = null;
  if (els.btnImportarXlsx) els.btnImportarXlsx.disabled = true;
  if (els.importXlsxResult) els.importXlsxResult.hidden = true;
}

function importStatusLabel(row) {
  const status = row?._importStatus || 'novo';
  if (status === 'duplicado') return '<span class="import-badge is-duplicate">Duplicado</span>';
  if (status === 'conflito') return '<span class="import-badge is-conflict">Conflito</span>';
  return '<span class="import-badge is-new">Novo</span>';
}

function renderImportAnalysis(result) {
  const contasAtivas = els.importContas?.checked ?? true;
  const combustivelAtivo = els.importCombustivel?.checked ?? true;
  const contas = contasAtivas ? result.contas : [];
  const combustivel = combustivelAtivo ? result.combustivel : [];
  const fechamentos = contasAtivas ? (result.fechamentos || []) : [];
  const totalLancamentos = contas.length + combustivel.length;
  const totalRegistros = totalLancamentos + fechamentos.length;
  const validation = result.validation || { errors: [], warnings: result.warnings || [], ready: true };

  const linhasSelecionadas = [...contas, ...combustivel, ...fechamentos];
  const novos = linhasSelecionadas.filter((r) => (r._importStatus || 'novo') === 'novo').length;
  const duplicados = linhasSelecionadas.filter((r) => r._importStatus === 'duplicado').length;
  const conflitos = linhasSelecionadas.filter((r) => r._importStatus === 'conflito').length;

  els.importXlsxSummary.innerHTML = `
    <div class="import-summary-card"><strong>${novos}</strong><span>novos</span></div>
    <div class="import-summary-card"><strong>${duplicados}</strong><span>duplicados</span></div>
    <div class="import-summary-card"><strong>${conflitos}</strong><span>conflitos</span></div>
    <div class="import-summary-card"><strong>${totalRegistros}</strong><span>registros analisados</span></div>`;

  if (els.importXlsxStatus) {
    const hasWarnings = (result.warnings || []).length > 0;
    const ready = validation.ready && totalLancamentos > 0;
    const hasConflicts = conflitos > 0;
    els.importXlsxStatus.className = `import-status ${ready ? ((hasWarnings || hasConflicts) ? 'is-warning' : 'is-ready') : 'is-error'}`;
    els.importXlsxStatus.innerHTML = ready
      ? (novos === 0
          ? '<strong>Nenhum registro novo encontrado.</strong><span>A base já contém todos os itens analisados. Duplicados e conflitos permanecerão inalterados.</span>'
          : hasConflicts
            ? '<strong>Análise concluída com conflitos preservados.</strong><span>Somente registros novos serão importados. Duplicados e conflitos não serão sobrescritos.</span>'
            : hasWarnings
              ? '<strong>Análise concluída com avisos.</strong><span>Confira os itens destacados antes de importar.</span>'
              : '<strong>Pronto para importar.</strong><span>Nenhuma inconsistência bloqueante foi encontrada.</span>')
      : '<strong>Importação bloqueada.</strong><span>Corrija os erros indicados e analise a planilha novamente.</span>';
  }

  if (els.importXlsxYears) {
    const rows = (result.porAno || []).filter((r) =>
      (contasAtivas && r.contas) || (combustivelAtivo && r.combustivel) || (contasAtivas && r.fechamentos)
    );
    els.importXlsxYears.innerHTML = rows.length
      ? `<h3>Resumo por ano</h3><div class="import-years-grid">${rows.map((r) => `
          <div class="import-year-card">
            <strong>${r.ano}</strong>
            <span>${contasAtivas ? `${r.contas} conta(s)` : ''}${contasAtivas && combustivelAtivo ? ' · ' : ''}${combustivelAtivo ? `${r.combustivel} abastecimento(s)` : ''}${contasAtivas && r.fechamentos ? ` · ${r.fechamentos} fechamento(s)` : ''}</span>
          </div>`).join('')}</div>`
      : '';
  }

  const errors = validation.errors || [];
  if (els.importXlsxErrors) {
    if (errors.length) {
      els.importXlsxErrors.innerHTML = `<strong>Erros que impedem a importação:</strong><br>${errors.map((w) => `• ${escapeHtml(w)}`).join('<br>')}`;
      els.importXlsxErrors.hidden = false;
    } else {
      els.importXlsxErrors.hidden = true;
      els.importXlsxErrors.innerHTML = '';
    }
  }

  if (result.warnings.length) {
    const shown = result.warnings.slice(0, 12);
    els.importXlsxWarnings.innerHTML = `<strong>Avisos da análise:</strong><br>${shown.map((w) => `• ${escapeHtml(w)}`).join('<br>')}${result.warnings.length > shown.length ? `<br>• +${result.warnings.length - shown.length} aviso(s)` : ''}`;
    els.importXlsxWarnings.hidden = false;
  } else {
    els.importXlsxWarnings.hidden = true;
    els.importXlsxWarnings.innerHTML = '';
  }

  const conflictRows = [...contas, ...combustivel, ...fechamentos]
    .filter((r) => r._importStatus === 'conflito' && r._conflictReason);
  if (conflictRows.length) {
    const details = conflictRows.slice(0, 10)
      .map((r) => `• ${escapeHtml(r._conflictReason)}`)
      .join('<br>');
    els.importXlsxWarnings.innerHTML += `${els.importXlsxWarnings.hidden ? '' : '<br><br>'}<strong>Conflitos preservados:</strong><br>${details}${conflictRows.length > 10 ? `<br>• +${conflictRows.length - 10} conflito(s)` : ''}`;
    els.importXlsxWarnings.hidden = false;
  }

  const classContas = contarStatus(contas);
  const classFuel = contarStatus(combustivel);
  const classFechamentos = contarStatus(fechamentos);
  const classificationHtml = `
    <section class="import-classification">
      <h3>Classificação por grupo</h3>
      <div class="import-classification-grid">
        ${contasAtivas ? `<div><strong>Contas</strong><span>${classContas.novo} novo(s) · ${classContas.duplicado} duplicado(s) · ${classContas.conflito} conflito(s)</span></div>` : ''}
        ${combustivelAtivo ? `<div><strong>Combustível</strong><span>${classFuel.novo} novo(s) · ${classFuel.duplicado} duplicado(s) · ${classFuel.conflito} conflito(s)</span></div>` : ''}
        ${contasAtivas ? `<div><strong>Fechamentos</strong><span>${classFechamentos.novo} novo(s) · ${classFechamentos.duplicado} duplicado(s) · ${classFechamentos.conflito} conflito(s)</span></div>` : ''}
      </div>
    </section>`;

  const contasPreview = contas.slice(0, 10);
  const fuelPreview = combustivel.slice(0, 10);
  const fechamentoPreview = fechamentos.slice(0, 8);

  const contaTable = contasPreview.length ? `
    <section class="import-preview-group">
      <h3>Contas — prévia</h3>
      <table><thead><tr><th>Status</th><th>Tipo</th><th>Competência</th><th>Valor</th><th>Rateado</th><th>Pago</th><th>Origem</th></tr></thead>
      <tbody>${contasPreview.map((r) => `<tr title="${escapeHtml(r._conflictReason || '')}">
        <td>${importStatusLabel(r)}</td>
        <td>${escapeHtml(TIPO_LABEL[r.tipo] || r.tipo)}</td>
        <td>${escapeHtml(formatCompetencia(r.competencia))}</td>
        <td>${formatMoeda(r.valor_total)}</td>
        <td>${formatMoeda(r.valor_rateado)}</td>
        <td>${r.pago ? escapeHtml(formatData(r.data_pagamento)) : 'Não'}</td>
        <td>${escapeHtml(r.source || '—')}</td>
      </tr>`).join('')}</tbody></table>
      ${contas.length > contasPreview.length ? `<p class="config-hint">Exibindo ${contasPreview.length} de ${contas.length} contas selecionadas.</p>` : ''}
    </section>` : '';

  const fuelTable = fuelPreview.length ? `
    <section class="import-preview-group">
      <h3>Combustível — prévia</h3>
      <table><thead><tr><th>Status</th><th>Data</th><th>Valor</th><th>% histórica</th><th>Rateado</th><th>Origem</th></tr></thead>
      <tbody>${fuelPreview.map((r) => `<tr title="${escapeHtml(r._conflictReason || '')}">
        <td>${importStatusLabel(r)}</td>
        <td>${escapeHtml(formatData(r.data))}</td>
        <td>${formatMoeda(r.valor_total)}</td>
        <td>${Number(r.percentual_rateado || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</td>
        <td>${formatMoeda(r.valor_rateado)}</td>
        <td>${escapeHtml(r.source || '—')}</td>
      </tr>`).join('')}</tbody></table>
      ${combustivel.length > fuelPreview.length ? `<p class="config-hint">Exibindo ${fuelPreview.length} de ${combustivel.length} abastecimentos selecionados.</p>` : ''}
    </section>` : '';

  const fechamentoTable = fechamentoPreview.length ? `
    <section class="import-preview-group">
      <h3>Meses pagos / fechamentos — prévia</h3>
      <table><thead><tr><th>Status</th><th>Período</th><th>Data de pagamento</th><th>Origem</th></tr></thead>
      <tbody>${fechamentoPreview.map((r) => `<tr title="${escapeHtml(r._conflictReason || '')}">
        <td>${importStatusLabel(r)}</td>
        <td>${String(r.mes).padStart(2, '0')}/${r.ano}</td>
        <td>${escapeHtml(formatData(r.contas_data_pagamento))}</td>
        <td>${escapeHtml(r.source || '—')}</td>
      </tr>`).join('')}</tbody></table>
      ${fechamentos.length > fechamentoPreview.length ? `<p class="config-hint">Exibindo ${fechamentoPreview.length} de ${fechamentos.length} fechamentos reconhecidos.</p>` : ''}
    </section>` : '';

  els.importXlsxPreview.innerHTML = contaTable || fuelTable || fechamentoTable
    ? `${classificationHtml}${contaTable}${fuelTable}${fechamentoTable}`
    : '<p class="config-hint">Nenhum registro selecionado para importação.</p>';

  els.importXlsxResult.hidden = false;
  els.btnImportarXlsx.disabled = totalLancamentos === 0 || !validation.ready || novos === 0;
}
function accountImportKey(r) {
  const competencia = r.competencia || (r.data_vencimento ? `${r.data_vencimento.slice(0, 7)}-01` : '');
  return `${r.tipo}|${competencia}|${Number(r.valor_total).toFixed(2)}`;
}

function accountLogicalKey(r) {
  const competencia = r.competencia || (r.data_vencimento ? `${r.data_vencimento.slice(0, 7)}-01` : '');
  return `${r.tipo}|${competencia}`;
}

function fuelImportKey(r) {
  return `${r.data || ''}|${Number(r.valor_total).toFixed(2)}`;
}

function moneyEquals(a, b) {
  return Math.abs(Number(a || 0) - Number(b || 0)) < 0.005;
}

function nullableEquals(a, b) {
  return (a ?? null) === (b ?? null);
}

function fechamentoEquals(existing, incoming) {
  return Boolean(existing?.contas_pago) === Boolean(incoming?.contas_pago)
    && nullableEquals(existing?.contas_data_pagamento, incoming?.contas_data_pagamento)
    && nullableEquals(existing?.contas_data_rateio, incoming?.contas_data_rateio)
    && nullableEquals(existing?.combustivel_data_rateio, incoming?.combustivel_data_rateio);
}

function contarStatus(rows) {
  return rows.reduce((acc, row) => {
    const status = row._importStatus || 'novo';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { novo: 0, duplicado: 0, conflito: 0 });
}

async function classificarImportacao(result) {
  if (!currentUser) return result;

  const [existingAccountsRaw, existingFuelRaw, existingClosingsRaw] = await Promise.all([
    localDb.listAll('contas_consumo'),
    localDb.listAll('abastecimentos'),
    localDb.listAll('fechamentos_mensais'),
  ]);

  const existingAccounts = existingAccountsRaw.filter((r) => r.user_id === currentUser.id && !r.deleted);
  const existingFuel = existingFuelRaw.filter((r) => r.user_id === currentUser.id && !r.deleted);
  const existingClosings = existingClosingsRaw.filter((r) => r.user_id === currentUser.id && !r.deleted);

  const accountsExact = new Map();
  const accountsLogical = new Map();
  for (const row of existingAccounts) {
    accountsExact.set(accountImportKey(row), row);
    const logical = accountLogicalKey(row);
    if (!accountsLogical.has(logical)) accountsLogical.set(logical, []);
    accountsLogical.get(logical).push(row);
  }

  const fuelExactCounts = new Map();
  const fuelByDate = new Map();
  for (const row of existingFuel) {
    const exact = fuelImportKey(row);
    fuelExactCounts.set(exact, (fuelExactCounts.get(exact) || 0) + 1);
    const date = row.data || '';
    if (!fuelByDate.has(date)) fuelByDate.set(date, []);
    fuelByDate.get(date).push(row);
  }

  // Consome duplicados exatos por ocorrência. Isso evita que dois abastecimentos
  // iguais no mesmo dia sejam tratados como um único registro.
  const consumedFuelExact = new Map();

  const contas = result.contas.map((row) => {
    const exact = accountsExact.get(accountImportKey(row));
    if (exact) {
      return { ...row, _importStatus: 'duplicado', _existingId: exact.id };
    }

    const logicalMatches = accountsLogical.get(accountLogicalKey(row)) || [];
    if (logicalMatches.length) {
      const current = logicalMatches[0];
      return {
        ...row,
        _importStatus: 'conflito',
        _existingId: current.id,
        _conflictReason: `Já existe ${TIPO_LABEL[row.tipo] || row.tipo} em ${formatCompetencia(row.competencia)} com valor ${formatMoeda(current.valor_total)}.`,
      };
    }
    return { ...row, _importStatus: 'novo' };
  });

  const combustivel = result.combustivel.map((row) => {
    const exactKey = fuelImportKey(row);
    const availableExact = fuelExactCounts.get(exactKey) || 0;
    const usedExact = consumedFuelExact.get(exactKey) || 0;
    if (usedExact < availableExact) {
      consumedFuelExact.set(exactKey, usedExact + 1);
      return { ...row, _importStatus: 'duplicado' };
    }

    const sameDate = fuelByDate.get(row.data || '') || [];
    // Para histórico XLSX, um valor diferente numa data já importada é sinalizado
    // para conferência em vez de gerar silenciosamente um novo abastecimento.
    const importedSameDate = sameDate.filter((r) => r.origem_importacao === 'xlsx_historico');
    if (importedSameDate.length) {
      return {
        ...row,
        _importStatus: 'conflito',
        _existingId: importedSameDate[0].id,
        _conflictReason: `Já existe abastecimento importado em ${formatData(row.data)} com valor diferente (${formatMoeda(importedSameDate[0].valor_total)}).`,
      };
    }

    return { ...row, _importStatus: 'novo' };
  });

  const existingClosingMap = new Map(existingClosings.map((r) => [`${r.ano}-${String(r.mes).padStart(2, '0')}`, r]));
  const fechamentos = (result.fechamentos || []).map((row) => {
    const existing = existingClosingMap.get(`${row.ano}-${String(row.mes).padStart(2, '0')}`);
    if (!existing) return { ...row, _importStatus: 'novo' };
    if (fechamentoEquals(existing, row)) {
      return { ...row, _importStatus: 'duplicado', _existingId: existing.id };
    }
    return {
      ...row,
      _importStatus: 'conflito',
      _existingId: existing.id,
      _conflictReason: `O fechamento ${String(row.mes).padStart(2, '0')}/${row.ano} já existe com dados diferentes e será preservado.`,
    };
  });

  return {
    ...result,
    contas,
    combustivel,
    fechamentos,
    comparison: {
      contas: contarStatus(contas),
      combustivel: contarStatus(combustivel),
      fechamentos: contarStatus(fechamentos),
    },
  };
}

async function importarDadosAnalisados() {
  if (!currentUser || !importAnalysis) return;

  const selectedAccounts = els.importContas.checked ? importAnalysis.contas : [];
  const selectedFuel = els.importCombustivel.checked ? importAnalysis.combustivel : [];
  const selectedClosings = els.importContas.checked ? (importAnalysis.fechamentos || []) : [];

  const accountsToCreate = selectedAccounts
    .filter((r) => r._importStatus === 'novo')
    .map(({ source, _importStatus, _existingId, _conflictReason, ...r }) => ({ ...r, user_id: currentUser.id }));

  const fuelToCreate = selectedFuel
    .filter((r) => r._importStatus === 'novo')
    .map(({ source, _importStatus, _existingId, _conflictReason, ...r }) => ({ ...r, user_id: currentUser.id }));

  await localDb.createMany('contas_consumo', accountsToCreate);
  await localDb.createMany('abastecimentos', fuelToCreate);

  let fechamentosCriados = 0;
  for (const fechamento of selectedClosings.filter((r) => r._importStatus === 'novo')) {
    const id = fechamentoId(currentUser.id, fechamento.ano, fechamento.mes - 1);
    const { source, _importStatus, _existingId, _conflictReason, ...fields } = fechamento;
    await localDb.putWithId('fechamentos_mensais', id, { ...fields, user_id: currentUser.id });
    fechamentosCriados += 1;
  }

  const selected = [...selectedAccounts, ...selectedFuel, ...selectedClosings];
  const duplicados = selected.filter((r) => r._importStatus === 'duplicado').length;
  const conflitos = selected.filter((r) => r._importStatus === 'conflito').length;
  const novos = accountsToCreate.length + fuelToCreate.length + fechamentosCriados;

  showToast(`${novos} novo(s) importado(s); ${duplicados} duplicado(s) ignorado(s); ${conflitos} conflito(s) preservado(s).`);
  await refreshActiveView();
  triggerBackgroundSync();
  atualizarListaPostos();
}

if (els.importXlsxFile) els.importXlsxFile.addEventListener('change', resetImportAnalysis);
if (els.importContas) els.importContas.addEventListener('change', () => importAnalysis && renderImportAnalysis(importAnalysis));
if (els.importCombustivel) els.importCombustivel.addEventListener('change', () => importAnalysis && renderImportAnalysis(importAnalysis));

if (els.btnAnalisarXlsx) {
  els.btnAnalisarXlsx.addEventListener('click', async () => {
    const file = els.importXlsxFile?.files?.[0];
    if (!file) {
      showToast('Selecione primeiro uma planilha XLSX.', 'error');
      return;
    }

    els.btnAnalisarXlsx.disabled = true;
    els.btnAnalisarXlsx.textContent = 'Analisando...';
    try {
      importAnalysis = await analisarPlanilhaHistorica(file, {
        participantesPadrao: settings.numero_participantes_padrao,
        percentualPadrao: settings.percentual_combustivel_padrao,
      });
      importAnalysis = await classificarImportacao(importAnalysis);
      renderImportAnalysis(importAnalysis);
      showToast('Planilha analisada. Confira a pré-visualização antes de importar.');
    } catch (err) {
      console.error('[import] falha ao analisar XLSX:', err);
      resetImportAnalysis();
      showToast(err.message || 'Não foi possível analisar a planilha.', 'error');
    } finally {
      els.btnAnalisarXlsx.disabled = false;
      els.btnAnalisarXlsx.textContent = 'Analisar planilha';
    }
  });
}

if (els.btnImportarXlsx) {
  els.btnImportarXlsx.addEventListener('click', async () => {
    if (!importAnalysis) return;
    const confirmado = window.confirm('Importar somente os registros classificados como novos? Duplicados e conflitos serão preservados sem sobrescrita.');
    if (!confirmado) return;
    els.btnImportarXlsx.disabled = true;
    els.btnImportarXlsx.textContent = 'Importando...';
    try {
      await importarDadosAnalisados();
      resetImportAnalysis();
      if (els.importXlsxFile) els.importXlsxFile.value = '';
    } catch (err) {
      console.error('[import] falha ao importar XLSX:', err);
      showToast('Falha ao importar. Verifique os avisos da análise e a configuração do Supabase DEV.', 'error');
      els.btnImportarXlsx.disabled = false;
    } finally {
      els.btnImportarXlsx.textContent = 'Importar dados analisados';
    }
  });
}

async function excluirDadosImportados() {
  if (!currentUser) return;

  const stores = ['contas_consumo', 'abastecimentos', 'fechamentos_mensais'];
  let removidos = 0;

  for (const store of stores) {
    const rows = await localDb.listAll(store);
    const importados = rows.filter(
      (row) => row.user_id === currentUser.id && row.origem_importacao === 'xlsx_historico'
    );

    if (!importados.length) continue;

    // Exclui por ID no Supabase. Assim a limpeza funciona inclusive para registros
    // importados em versões anteriores e não depende do campo origem_importacao
    // existir/estar preenchido remotamente.
    const ids = importados.map((row) => row.id).filter(Boolean);
    if (ids.length && isOnline()) {
      const { error } = await supabase
        .from(store)
        .delete()
        .eq('user_id', currentUser.id)
        .in('id', ids);

      if (error) {
        throw new Error(`Falha ao excluir ${store} no Supabase: ${error.message}`);
      }
    }

    // Só remove definitivamente do IndexedDB depois da exclusão remota.
    // Se estiver offline, preserva o fluxo de soft delete para sincronização posterior.
    for (const row of importados) {
      if (isOnline()) {
        await localDb.hardDelete(store, row.id);
      } else {
        await localDb.remove(store, row.id);
      }
      removidos += 1;
    }
  }

  if (isOnline()) {
    await syncAll(currentUser.id);
  }
  await refreshActiveView();
  atualizarListaPostos();
  showToast(`${removidos} registro(s) importado(s) excluído(s).`);
}
if (els.btnExcluirImportados) {
  els.btnExcluirImportados.addEventListener('click', async () => {
    const confirmado = window.confirm('Excluir somente os dados originados da importação XLSX? Lançamentos manuais serão preservados.');
    if (!confirmado) return;
    els.btnExcluirImportados.disabled = true;
    try { await excluirDadosImportados(); }
    catch (err) { console.error('[import] falha ao excluir dados importados:', err); showToast('Não foi possível excluir os dados importados.', 'error'); }
    finally { els.btnExcluirImportados.disabled = false; }
  });
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
  const titles = { contas: 'Contas', combustivel: 'Combustível', resumo: 'Resumo Mensal', config: 'Configurações' };
  els.tabTitle.textContent = titles[tab];

  els.tabButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tab));
  Object.entries(els.tabPanels).forEach(([name, panel]) => {
    panel.hidden = name !== tab;
  });

  els.btnNovo.hidden = tab === 'config' || tab === 'resumo';
  els.monthNav.hidden = tab === 'config';

  if (tab === 'resumo') {
    renderResumo();
  } else if (tab !== 'config') {
    renderTab(tab);
  }
}

// ---------------------------------------------------------
// Listagem
// ---------------------------------------------------------

const TIPO_LABEL = { agua: 'Água', luz: 'Luz', internet: 'Internet', mercado_livre: 'Nivel 6 Mercado Livre' };
const formatMoeda = (valor) =>
  valor == null ? '—' : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatData = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR') : '—');

async function refreshActiveView() {
  if (activeTab === 'resumo') {
    await renderResumo();
  } else if (activeTab !== 'config') {
    await renderTab(activeTab);
  }
}

async function atualizarListaPostos() {
  const rows = await localDb.listAll('abastecimentos');
  const postos = [...new Set(rows.map((r) => r.posto).filter(Boolean))].sort();
  els.listaPostos.innerHTML = postos.map((p) => `<option value="${p}"></option>`).join('');
}

function isNoMes(dataOrdenacao, ano, mes) {
  if (!dataOrdenacao) return false;
  const [anoData, mesData] = dataOrdenacao.split('-').map(Number);
  return anoData === ano && mesData === mes + 1;
}

function isNoMesAtivo(dataOrdenacao) {
  return isNoMes(dataOrdenacao, mesAtivo.ano, mesAtivo.mes);
}

function mesAnterior({ ano, mes }) {
  const data = new Date(ano, mes - 1, 1);
  return { ano: data.getFullYear(), mes: data.getMonth() };
}

function atualizarLabelMes() {
  const label = new Date(mesAtivo.ano, mesAtivo.mes, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  els.mesAtivoLabel.textContent = label;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function preencherSeletorPeriodo() {
  if (!els.monthPickerMonth || !els.monthPickerYear) return;

  els.monthPickerMonth.innerHTML = NOMES_MESES
    .map((nome, indice) => `<option value="${indice}">${nome}</option>`)
    .join('');

  const anoAtual = new Date().getFullYear();
  const primeiroAno = Math.min(2020, mesAtivo.ano);
  const ultimoAno = Math.max(anoAtual + 2, mesAtivo.ano);
  const anos = [];
  for (let ano = ultimoAno; ano >= primeiroAno; ano -= 1) anos.push(ano);
  els.monthPickerYear.innerHTML = anos.map((ano) => `<option value="${ano}">${ano}</option>`).join('');
}

function abrirSeletorPeriodo() {
  preencherSeletorPeriodo();
  els.monthPickerMonth.value = String(mesAtivo.mes);
  els.monthPickerYear.value = String(mesAtivo.ano);
  els.monthPicker.hidden = false;
  els.mesAtivoLabel.setAttribute('aria-expanded', 'true');
  els.monthPickerMonth.focus();
}

function fecharSeletorPeriodo() {
  els.monthPicker.hidden = true;
  els.mesAtivoLabel.setAttribute('aria-expanded', 'false');
}

function aplicarPeriodoSelecionado() {
  const mes = Number(els.monthPickerMonth.value);
  const ano = Number(els.monthPickerYear.value);
  if (!Number.isInteger(mes) || mes < 0 || mes > 11 || !Number.isInteger(ano)) return;

  mesAtivo = { ano, mes };
  atualizarLabelMes();
  fecharSeletorPeriodo();
  refreshActiveView();
}

els.btnMesAnterior.addEventListener('click', () => mudarMes(-1));
els.btnMesProximo.addEventListener('click', () => mudarMes(1));
els.mesAtivoLabel.addEventListener('click', (event) => {
  event.stopPropagation();
  if (els.monthPicker.hidden) abrirSeletorPeriodo();
  else fecharSeletorPeriodo();
});
els.monthPicker.addEventListener('click', (event) => event.stopPropagation());
els.monthPickerCancel.addEventListener('click', fecharSeletorPeriodo);
els.monthPickerApply.addEventListener('click', aplicarPeriodoSelecionado);
els.monthPickerMonth.addEventListener('change', () => els.monthPickerYear.focus());
els.monthPickerYear.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') aplicarPeriodoSelecionado();
});
document.addEventListener('click', fecharSeletorPeriodo);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.monthPicker.hidden) fecharSeletorPeriodo();
});

function mudarMes(delta) {
  const data = new Date(mesAtivo.ano, mesAtivo.mes + delta, 1);
  mesAtivo = { ano: data.getFullYear(), mes: data.getMonth() };
  atualizarLabelMes();
  refreshActiveView();
}

function somarCampo(rows, campo) {
  return rows.reduce((acc, row) => acc + (Number(row[campo]) || 0), 0);
}

function calcularVariacaoPercentual(atual, anterior) {
  if (anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

function aplicarVariacao(elemento, nota, atual, anterior) {
  elemento.classList.remove('is-positive', 'is-negative');

  const variacao = calcularVariacaoPercentual(atual, anterior);
  if (variacao == null) {
    elemento.textContent = '—';
    nota.textContent = atual > 0 ? 'Mês anterior sem valor para comparação' : 'Sem base de comparação';
    return;
  }

  const sinal = variacao > 0 ? '+' : '';
  elemento.textContent = `${sinal}${variacao.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  if (variacao > 0) elemento.classList.add('is-positive');
  if (variacao < 0) elemento.classList.add('is-negative');
  nota.textContent = `Anterior: ${formatMoeda(anterior)}`;
}

function calcularMediaMensalAno(rows, ano, campo = 'valor_total') {
  const totaisPorMes = new Map();

  rows.forEach((row) => {
    if (!row.data_ordenacao) return;
    const [anoRow, mesRow] = row.data_ordenacao.split('-').map(Number);
    if (anoRow !== ano || !mesRow) return;
    totaisPorMes.set(mesRow, (totaisPorMes.get(mesRow) || 0) + (Number(row[campo]) || 0));
  });

  if (totaisPorMes.size === 0) return { media: 0, meses: 0 };
  const totalAno = [...totaisPorMes.values()].reduce((acc, valor) => acc + valor, 0);
  return { media: totalAno / totaisPorMes.size, meses: totaisPorMes.size };
}

function renderIndicadoresMensais(prefixo, rows) {
  const rowsMes = rows.filter((row) => isNoMesAtivo(row.data_ordenacao));
  const anterior = mesAnterior(mesAtivo);
  const rowsAnterior = rows.filter((row) => isNoMes(row.data_ordenacao, anterior.ano, anterior.mes));

  const subtotal = somarCampo(rowsMes, 'valor_total');
  const subtotalRateado = somarCampo(rowsMes, 'valor_rateado');
  const totalAnterior = somarCampo(rowsAnterior, 'valor_total');
  const mediaAno = calcularMediaMensalAno(rows, mesAtivo.ano);

  const ids = prefixo === 'contas'
    ? { subtotal: els.contasSubtotal, rateado: els.contasSubtotalRateado, variacao: els.contasVariacao, variacaoNote: els.contasVariacaoNote, media: els.contasMediaAno, mediaNote: els.contasMediaAnoNote }
    : { subtotal: els.combustivelSubtotal, rateado: els.combustivelSubtotalRateado, variacao: els.combustivelVariacao, variacaoNote: els.combustivelVariacaoNote, media: els.combustivelMediaAno, mediaNote: els.combustivelMediaAnoNote };

  ids.subtotal.textContent = formatMoeda(subtotal);
  ids.rateado.textContent = formatMoeda(subtotalRateado);
  aplicarVariacao(ids.variacao, ids.variacaoNote, subtotal, totalAnterior);
  ids.media.textContent = formatMoeda(mediaAno.media);
  ids.mediaNote.textContent = mediaAno.meses === 0
    ? `Sem lançamentos em ${mesAtivo.ano}`
    : `Base: ${mediaAno.meses} ${mediaAno.meses === 1 ? 'mês' : 'meses'} com lançamentos em ${mesAtivo.ano}`;
}

async function renderTab(tab) {
  if (tab === 'config' || tab === 'resumo') return;

  if (tab === 'contas') {
    const allRows = await localDb.listAll('contas_consumo');
    const rows = allRows.filter((r) => isNoMesAtivo(r.data_ordenacao));
    renderIndicadoresMensais('contas', allRows);
    els.listaContasVazia.hidden = rows.length > 0;
    els.listaContas.innerHTML = rows.map(renderContaItem).join('');
  } else {
    const allRows = await localDb.listAll('abastecimentos');
    const rows = allRows.filter((r) => isNoMesAtivo(r.data_ordenacao));
    renderIndicadoresMensais('combustivel', allRows);
    els.listaCombustivelVazia.hidden = rows.length > 0;
    els.listaCombustivel.innerHTML = rows.map(renderCombustivelItem).join('');
  }
}

async function renderResumo() {
  const mesCombustivel = mesAnterior(mesAtivo);

  const contas = (await localDb.listAll('contas_consumo')).filter((r) => isNoMesAtivo(r.data_ordenacao));
  const abastecimentos = (await localDb.listAll('abastecimentos')).filter((r) =>
    isNoMes(r.data_ordenacao, mesCombustivel.ano, mesCombustivel.mes)
  );

  const somar = (rows, campo) => rows.reduce((acc, r) => acc + (Number(r[campo]) || 0), 0);

  const totalContas = somar(contas, 'valor_total');
  const totalCombustivel = somar(abastecimentos, 'valor_total');

  if (els.resumoTotalCombustivelLabel) {
    const referenciaCombustivel = `${NOMES_MESES[mesCombustivel.mes]}/${mesCombustivel.ano}`;
    els.resumoTotalCombustivelLabel.textContent = `Total Combustível (${referenciaCombustivel})`;
  }
  const contasRateado = somar(contas, 'valor_rateado');
  const combustivelRateado = somar(abastecimentos, 'valor_rateado');
  const totalLitros = somar(abastecimentos, 'litros');
  const litrosGasolina = somar(
    abastecimentos.filter((a) => a.tipo_combustivel === 'gasolina'),
    'litros'
  );
  const litrosEtanol = somar(
    abastecimentos.filter((a) => a.tipo_combustivel === 'etanol'),
    'litros'
  );

  els.resumoTotalContas.textContent = formatMoeda(totalContas);
  els.resumoTotalCombustivel.textContent = formatMoeda(totalCombustivel);
  els.resumoContasRateado.textContent = formatMoeda(contasRateado);
  els.resumoCombustivelRateado.textContent = formatMoeda(combustivelRateado);
  els.resumoTotalRateado.textContent = formatMoeda(contasRateado + combustivelRateado);
  els.resumoTotalLitros.textContent = `${totalLitros.toLocaleString('pt-BR')} L`;
  els.resumoLitrosPorTipo.textContent = `${litrosGasolina.toLocaleString('pt-BR')} L / ${litrosEtanol.toLocaleString('pt-BR')} L`;

  els.resumoVazio.hidden = contas.length + abastecimentos.length > 0;

  await loadFechamentoMes(abastecimentos);
}

function fechamentoId(userId, ano, mes) {
  return `${userId}::${ano}-${String(mes + 1).padStart(2, '0')}`;
}

async function loadFechamentoMes(abastecimentos = null) {
  if (!currentUser) return null;
  const id = fechamentoId(currentUser.id, mesAtivo.ano, mesAtivo.mes);
  const record = await localDb.get('fechamentos_mensais', id);

  els.fechamentoContasPago.checked = record?.contas_pago ?? false;
  els.fechamentoContasDataPagamento.value = record?.contas_data_pagamento ?? '';

  // A interface usa uma única data de transferência. Mantemos os dois campos
  // legados no Supabase por compatibilidade e aceitamos qualquer um deles ao ler.
  els.fechamentoDataRateio.value =
    record?.contas_data_rateio ?? record?.combustivel_data_rateio ?? '';

  const mesFechado = Boolean(record && !record.deleted);
  els.resumoFechadoBanner.hidden = !mesFechado;

  if (mesFechado) {
    const rows = abastecimentos ?? [];
    const percentuais = [...new Set(
      rows
        .map((item) => Number(item.percentual_rateado))
        .filter((valor) => Number.isFinite(valor))
        .map((valor) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 }))
    )];

    if (percentuais.length === 1) {
      els.resumoPercentualFechado.textContent = `Percentual de combustível usado neste mês: ${percentuais[0]}%`;
    } else if (percentuais.length > 1) {
      els.resumoPercentualFechado.textContent = `Percentuais de combustível usados neste mês: ${percentuais.join('%, ')}%`;
    } else {
      els.resumoPercentualFechado.textContent = 'Sem abastecimentos vinculados a este fechamento.';
    }
  } else {
    els.resumoPercentualFechado.textContent = '';
  }

  return record;
}

els.formFechamento.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser) return;

  const id = fechamentoId(currentUser.id, mesAtivo.ano, mesAtivo.mes);

  const dataRateio = els.fechamentoDataRateio.value || null;

  await localDb.putWithId('fechamentos_mensais', id, {
    user_id: currentUser.id,
    ano: mesAtivo.ano,
    mes: mesAtivo.mes + 1,
    contas_pago: els.fechamentoContasPago.checked,
    contas_data_pagamento: els.fechamentoContasDataPagamento.value || null,
    // Mantemos os dois campos legados sincronizados com a mesma data.
    contas_data_rateio: dataRateio,
    combustivel_data_rateio: dataRateio,
  });

  await renderResumo();
  showToast('Fechamento do mês salvo.');
  triggerBackgroundSync();
});

function renderContaItem(c) {
  return `
    <li class="entry-card">
      <div class="entry-main">
        <span class="entry-title">${TIPO_LABEL[c.tipo] || c.tipo}</span>
        <span class="entry-meta">${c.data_vencimento ? `Vence em ${formatData(c.data_vencimento)}` : `Referência ${formatCompetencia(c.competencia)}`}</span>
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
  const tipoLabel = a.tipo_combustivel === 'etanol' ? 'Etanol' : a.tipo_combustivel === 'gasolina' ? 'Gasolina' : 'Não informado';
  return `
    <li class="entry-card">
      <div class="entry-main">
        <span class="entry-title">${a.posto || 'Abastecimento'}</span>
        <span class="entry-meta">${formatData(a.data)} · ${tipoLabel}${a.litros ? ` · ${a.litros} L` : ''}</span>
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
    document.getElementById('combustivel-tipo').value = record.tipo_combustivel ?? 'gasolina';
    document.getElementById('combustivel-posto').value = record.posto ?? '';
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

  await refreshActiveView();
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

  const dataVencimento = parseOptionalText('conta-vencimento');
  const competencia = `${mesAtivo.ano}-${String(mesAtivo.mes + 1).padStart(2, '0')}-01`;
  const fields = {
    user_id: currentUser.id,
    tipo: document.getElementById('conta-tipo').value,
    valor_total: valorTotal,
    numero_participantes: participantes,
    valor_rateado: valorTotal / participantes,
    data_vencimento: dataVencimento,
    competencia,
    origem_importacao: null,
    data_ordenacao: competencia,
  };

  if (editingId) {
    await localDb.update('contas_consumo', editingId, fields);
  } else {
    await localDb.create('contas_consumo', fields);
  }

  editingId = null;
  els.modalConta.hidden = true;
  await refreshActiveView();
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
    tipo_combustivel: document.getElementById('combustivel-tipo').value,
    posto: parseOptionalText('combustivel-posto'),
    data_ordenacao: data,
  };

  if (editingId) {
    await localDb.update('abastecimentos', editingId, fields);
  } else {
    await localDb.create('abastecimentos', fields);
  }

  editingId = null;
  els.modalCombustivel.hidden = true;
  await refreshActiveView();
  triggerBackgroundSync();
  atualizarListaPostos();
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
  if (currentUser) syncAll(currentUser.id).then(() => refreshActiveView());
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
atualizarLabelMes();

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
