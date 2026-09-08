// =========================================================
// Complementação de abastecimentos a partir de planilha XLS/XLSX
// v0.8.3.1 — não cria lançamentos: apenas localiza por data + valor
// =========================================================

function texto(value) {
  return String(value ?? '').trim();
}

function normalizarCabecalho(value) {
  return texto(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function numeroBR(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = texto(value)
    .replace(/\s/g, '')
    .replace(/BRL/gi, '')
    .replace(/R\$/gi, '')
    .replace(/\/l/gi, '')
    .replace(/km.*$/gi, '')
    .replace(/l$/i, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9+.-]/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function dataIso(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'number' && globalThis.XLSX?.SSF?.parse_date_code) {
    const p = globalThis.XLSX.SSF.parse_date_code(value);
    if (p?.y && p?.m && p?.d) return `${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`;
  }
  const raw = texto(value);
  let m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  return null;
}

function mapearTipo(value) {
  const raw = texto(value).toLowerCase();
  if (!raw) return null;
  if (raw.includes('etanol')) return 'etanol';
  if (raw.includes('gasolina') || raw === 'dt clean') return 'gasolina';
  return null;
}

function normalizarPosto(value) {
  const raw = texto(value).replace(/\s+/g, ' ');
  if (!raw) return null;
  if (raw.toLowerCase() === 'posto big') return 'Posto Big Atibaia';
  return raw;
}

function cents(value) {
  return Math.round(Number(value) * 100);
}

function chave(data, valor) {
  return `${data}|${cents(valor)}`;
}

export async function lerPlanilhaComplementarCombustivel(file) {
  if (!globalThis.XLSX) throw new Error('Biblioteca XLSX não carregada.');
  const buffer = await file.arrayBuffer();
  const wb = globalThis.XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('A planilha não possui abas legíveis.');
  const matrix = globalThis.XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1, raw: true, defval: null, blankrows: false,
  });
  if (!matrix.length) throw new Error('A primeira aba está vazia.');

  const headers = matrix[0].map(normalizarCabecalho);
  const idx = (name) => headers.indexOf(name);
  const required = ['DATE', 'PRICE', 'FUEL_TYPE', 'VOLUME', 'STATION'];
  const missing = required.filter((name) => idx(name) < 0);
  if (missing.length) throw new Error(`Colunas obrigatórias não encontradas: ${missing.join(', ')}.`);

  const rows = [];
  const warnings = [];
  for (let i = 1; i < matrix.length; i += 1) {
    const row = matrix[i];
    const data = dataIso(row[idx('DATE')]);
    const valorTotal = numeroBR(row[idx('PRICE')]);
    if (!data || valorTotal == null) {
      warnings.push(`Linha ${i + 1}: data ou valor inválido; registro ignorado.`);
      continue;
    }
    const tipoOriginal = texto(row[idx('FUEL_TYPE')]);
    const tipo = mapearTipo(tipoOriginal);
    const litros = numeroBR(row[idx('VOLUME')]);
    const postoOriginal = texto(row[idx('STATION')]);
    const posto = normalizarPosto(postoOriginal);
    if (!tipo) warnings.push(`Linha ${i + 1}: tipo de combustível “${tipoOriginal || 'vazio'}” não reconhecido.`);
    rows.push({
      data,
      valor_total: Number(valorTotal.toFixed(2)),
      litros: litros == null ? null : Number(litros.toFixed(3)),
      tipo_combustivel: tipo,
      posto,
      tipo_original: tipoOriginal,
      posto_original: postoOriginal,
      source_row: i + 1,
      _key: chave(data, valorTotal),
    });
  }

  return { sheetName, rows, warnings };
}

export function classificarComplementoCombustivel(planilha, existentes) {
  const existingByKey = new Map();
  for (const row of existentes.filter((r) => !r.deleted && r.data && Number.isFinite(Number(r.valor_total)))) {
    const key = chave(row.data, row.valor_total);
    if (!existingByKey.has(key)) existingByKey.set(key, []);
    existingByKey.get(key).push(row);
  }
  const sheetCounts = new Map();
  for (const row of planilha.rows) sheetCounts.set(row._key, (sheetCounts.get(row._key) || 0) + 1);

  const rows = planilha.rows.map((row) => {
    const matches = existingByKey.get(row._key) || [];
    if ((sheetCounts.get(row._key) || 0) > 1 || matches.length > 1) {
      return { ...row, _status: 'ambiguo', _reason: 'Mais de um registro usa a mesma combinação de data e valor.' };
    }
    if (!matches.length) return { ...row, _status: 'nao_localizado', _reason: 'Nenhum lançamento existente possui a mesma data e o mesmo valor.' };
    const existing = matches[0];
    const mesmosDados =
      (row.tipo_combustivel ?? null) === (existing.tipo_combustivel ?? null) &&
      (row.posto ?? null) === (existing.posto ?? null) &&
      (row.litros == null ? existing.litros == null : Math.abs(Number(existing.litros ?? 0) - row.litros) < 0.0005);
    return {
      ...row,
      _status: mesmosDados ? 'ja_atualizado' : 'atualizar',
      _existingId: existing.id,
      _existing: existing,
    };
  });

  const count = (status) => rows.filter((r) => r._status === status).length;
  return {
    ...planilha,
    rows,
    summary: {
      total: rows.length,
      atualizar: count('atualizar'),
      ja_atualizado: count('ja_atualizado'),
      nao_localizado: count('nao_localizado'),
      ambiguo: count('ambiguo'),
    },
  };
}
