// =========================================================
// Importação histórica de planilhas XLSX
// Perfil inicial: "Contas de Consumo" (2021-2026)
// =========================================================

const MESES = {
  janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};

function normalizarTexto(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function numeroPositivo(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isoDate(ano, mes, dia = 1) {
  const d = new Date(Date.UTC(ano, mes, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes || d.getUTCDate() !== dia) return null;
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function excelDateToIso(value, fallbackAno, fallbackMes) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  if (typeof value === 'number' && globalThis.XLSX?.SSF?.parse_date_code) {
    const parsed = globalThis.XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  const dia = Number(value);
  if (Number.isInteger(dia) && dia >= 1 && dia <= 31) {
    return isoDate(fallbackAno, fallbackMes, dia);
  }
  return null;
}

function planilhaParaMatriz(sheet) {
  return globalThis.XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });
}

function localizarLinha(matriz, nomes) {
  return matriz.find((row) => nomes.includes(normalizarTexto(row?.[0])));
}

function parseContasSheet(sheetName, sheet, participantesPadrao) {
  const match = sheetName.match(/^contas\s+consumo\s+(\d{4})$/i);
  if (!match) return null;

  const ano = Number(match[1]);
  const matriz = planilhaParaMatriz(sheet);
  const header = matriz[0] || [];
  const tipos = [
    { tipo: 'agua', nomes: ['agua'] },
    { tipo: 'luz', nomes: ['luz'] },
    { tipo: 'internet', nomes: ['internet'] },
  ];
  const rows = [];
  const warnings = [];

  for (const def of tipos) {
    const linha = localizarLinha(matriz, def.nomes);
    if (!linha) {
      warnings.push(`${sheetName}: linha de ${def.tipo} não encontrada.`);
      continue;
    }

    for (let col = 1; col < header.length; col += 1) {
      const mesNome = normalizarTexto(header[col]);
      const mes = MESES[mesNome];
      if (mes == null) continue;
      const valor = numeroPositivo(linha[col]);
      if (valor == null) continue;

      rows.push({
        tipo: def.tipo,
        valor_total: valor,
        numero_participantes: participantesPadrao,
        valor_rateado: valor / participantesPadrao,
        data_vencimento: null,
        competencia: isoDate(ano, mes, 1),
        origem_importacao: 'xlsx_historico',
        data_ordenacao: isoDate(ano, mes, 1),
        source: `${sheetName} · ${header[col]}`,
      });
    }
  }

  const linhaTransferencia = localizarLinha(matriz, ['data transf. leo', 'data transf leo']);
  if (linhaTransferencia) {
    for (let col = 1; col < header.length; col += 1) {
      const mes = MESES[normalizarTexto(header[col])];
      const value = linhaTransferencia[col];
      if (mes == null || value == null) continue;
      const parsed = excelDateToIso(value, ano, mes);
      if (parsed && Number(parsed.slice(0, 4)) !== ano) {
        warnings.push(`${sheetName}: data de transferência ${parsed} não corresponde ao ano ${ano}.`);
      }
    }
  }

  return { rows, warnings };
}

function percentualDoBloco(total, totalRateado, fallbackPercentual, warnings, label) {
  const totalN = Number(total);
  const rateadoN = Number(totalRateado);
  if (Number.isFinite(totalN) && totalN > 0 && Number.isFinite(rateadoN) && rateadoN >= 0) {
    const pct = (rateadoN / totalN) * 100;
    if (pct >= 0 && pct <= 100) return pct;
  }
  warnings.push(`${label}: percentual histórico não pôde ser inferido; usado o percentual padrão atual (${fallbackPercentual}%).`);
  return fallbackPercentual;
}

function parseCombustivelGrid(sheetName, matriz, ano, fallbackPercentual) {
  const rows = [];
  const warnings = [];

  for (let r = 0; r < matriz.length - 3; r += 1) {
    const mes = MESES[normalizarTexto(matriz[r]?.[0])];
    if (mes == null) continue;
    if (!normalizarTexto(matriz[r + 1]?.[0]).includes('total abastecimento')) continue;

    const lancamentos = [];
    for (let c = 1; c < matriz[r].length; c += 1) {
      const dia = Number(matriz[r][c]);
      const valor = numeroPositivo(matriz[r + 1]?.[c]);
      if (!Number.isInteger(dia) || dia < 1 || dia > 31 || valor == null) continue;
      const data = isoDate(ano, mes, dia);
      if (data) lancamentos.push({ data, valor });
    }
    if (!lancamentos.length) continue;

    const total = matriz[r + 2]?.[1];
    const totalRateado = matriz[r + 3]?.[1];
    const pct = percentualDoBloco(total, totalRateado, fallbackPercentual, warnings, `${sheetName} · ${Object.keys(MESES)[mes]}`);

    for (const lancamento of lancamentos) {
      rows.push({
        data: lancamento.data,
        valor_total: lancamento.valor,
        percentual_rateado: pct,
        valor_rateado: lancamento.valor * (pct / 100),
        litros: null,
        tipo_combustivel: null,
        posto: null,
        origem_importacao: 'xlsx_historico',
        data_ordenacao: lancamento.data,
        source: `${sheetName} · ${lancamento.data}`,
      });
    }
  }

  return { rows, warnings };
}

function proximaAncoraMesNaLinha(row, startCol) {
  for (let c = startCol + 1; c < row.length; c += 1) {
    if (MESES[normalizarTexto(row[c])] != null) return c;
  }
  return row.length;
}

function parseCombustivelBlocos(sheetName, matriz, ano, fallbackPercentual) {
  const rows = [];
  const warnings = [];

  for (let r = 0; r < matriz.length - 4; r += 1) {
    const row = matriz[r] || [];
    for (let c = 0; c < row.length; c += 1) {
      const mes = MESES[normalizarTexto(row[c])];
      if (mes == null) continue;
      if (!normalizarTexto(matriz[r + 1]?.[c]).includes('dias abastecimento')) continue;
      if (normalizarTexto(matriz[r + 2]?.[c]) !== 'valor') continue;

      const endCol = proximaAncoraMesNaLinha(row, c);
      const lancamentos = [];
      for (let x = c + 1; x < endCol; x += 1) {
        const valor = numeroPositivo(matriz[r + 2]?.[x]);
        if (valor == null) continue;
        const data = excelDateToIso(matriz[r + 1]?.[x], ano, mes);
        if (!data) {
          warnings.push(`${sheetName}: não foi possível interpretar uma data de abastecimento no bloco ${Object.keys(MESES)[mes]}.`);
          continue;
        }
        lancamentos.push({ data, valor });
      }
      if (!lancamentos.length) continue;

      const total = matriz[r + 3]?.[c + 1];
      const totalRateado = matriz[r + 4]?.[c + 1];
      const pct = percentualDoBloco(total, totalRateado, fallbackPercentual, warnings, `${sheetName} · ${Object.keys(MESES)[mes]}`);

      for (const lancamento of lancamentos) {
        rows.push({
          data: lancamento.data,
          valor_total: lancamento.valor,
          percentual_rateado: pct,
          valor_rateado: lancamento.valor * (pct / 100),
          litros: null,
          tipo_combustivel: null,
          posto: null,
          origem_importacao: 'xlsx_historico',
          data_ordenacao: lancamento.data,
          source: `${sheetName} · ${lancamento.data}`,
        });
      }
    }
  }

  return { rows, warnings };
}

function parseCombustivelSheet(sheetName, sheet, fallbackPercentual) {
  const match = sheetName.match(/^combustivel\s+(\d{4})$/i);
  if (!match) return null;
  const ano = Number(match[1]);
  const matriz = planilhaParaMatriz(sheet);
  const temGrid = matriz.some((row, idx) =>
    MESES[normalizarTexto(row?.[0])] != null && normalizarTexto(matriz[idx + 1]?.[0]).includes('total abastecimento')
  );
  return temGrid
    ? parseCombustivelGrid(sheetName, matriz, ano, fallbackPercentual)
    : parseCombustivelBlocos(sheetName, matriz, ano, fallbackPercentual);
}

export async function analisarPlanilhaHistorica(file, options = {}) {
  if (!globalThis.XLSX) throw new Error('Biblioteca XLSX não carregada. Verifique sua conexão e recarregue a página.');
  if (!file) throw new Error('Selecione uma planilha XLSX.');

  const participantesPadrao = Math.max(1, Number(options.participantesPadrao) || 2);
  const percentualPadrao = Math.min(100, Math.max(0, Number(options.percentualPadrao) || 50));
  const buffer = await file.arrayBuffer();
  const workbook = globalThis.XLSX.read(buffer, { type: 'array', cellDates: true });

  const contas = [];
  const combustivel = [];
  const warnings = [];
  const recognizedSheets = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const contasResult = parseContasSheet(sheetName, sheet, participantesPadrao);
    if (contasResult) {
      contas.push(...contasResult.rows);
      warnings.push(...contasResult.warnings);
      recognizedSheets.push(sheetName);
      continue;
    }

    const combustivelResult = parseCombustivelSheet(sheetName, sheet, percentualPadrao);
    if (combustivelResult) {
      combustivel.push(...combustivelResult.rows);
      warnings.push(...combustivelResult.warnings);
      recognizedSheets.push(sheetName);
    }
  }

  if (!recognizedSheets.length) {
    throw new Error('Nenhuma aba compatível foi reconhecida. O perfil atual espera abas “Contas Consumo AAAA” e/ou “Combustivel AAAA”.');
  }

  return {
    fileName: file.name,
    recognizedSheets,
    contas,
    combustivel,
    warnings,
    summary: {
      sheets: recognizedSheets.length,
      contas: contas.length,
      combustivel: combustivel.length,
      total: contas.length + combustivel.length,
    },
  };
}
