# Checklist de regressão — v0.8.6 DEV

A v0.8.6 DEV é uma versão de consolidação. O objetivo é confirmar que as
funcionalidades já validadas continuam funcionando antes do próximo release PROD.

## 1. Autenticação e sincronização
- Login existente abre o aplicativo normalmente.
- Badge DEV aparece no ambiente de desenvolvimento.
- "Forçar sincronização de tudo" conclui sem erros 400/401/403 no console.
- Alterar um lançamento e recarregar a página preserva a alteração.
- Executar `supabase/verificar_release.sql` no DEV e, antes da PROD, também no PROD.

## 2. Contas de consumo
- Criar, editar e excluir uma conta.
- Rateio por participantes permanece correto.
- Categorias Água, Luz, Internet e Nivel 6 Mercado Livre continuam legíveis.

## 3. Combustível
- Criar, editar e excluir abastecimento.
- Selecionar Gasolina ou Etanol.
- Informar litros e posto.
- Gerenciador de Postos abre sobre Novo Abastecimento e fecha sem fechar o lançamento.
- Adicionar/renomear/excluir posto afeta a lista futura sem alterar históricos.

## 4. Resumo mensal e fechamento
- Totais de Contas, Combustível e Rateados conferem com os lançamentos.
- Referência do combustível permanece no mês anterior no Resumo Mensal.
- Fechar um mês preserva percentual histórico e datas.
- Alterar percentual padrão não recalcula meses já fechados.

## 5. Imagem para compartilhamento
- "Compartilhar imagem" gera o resumo do mês.
- "Baixar PNG" gera arquivo legível.
- Competência, valores rateados, total a transferir e fechamento aparecem corretamente.

## 6. Visão anual
- Alternar o ano base e o ano de comparação.
- Conferir totais, diferenças e categorias.
- Alternar gráfico entre Totais, Rateados e Litros.
- Indicadores de Gasolina/Etanol e litros permanecem coerentes.
- "Imprimir / Salvar PDF" abre a impressão com layout anual.

## 7. Importações
- Análise histórica XLSX classifica Novo/Duplicado/Conflito.
- Reimportar a mesma planilha não duplica registros.
- Importação complementar atualiza somente tipo, litros e posto com correspondência data + valor.
- "Excluir dados importados" não elimina lançamentos manuais.

## 8. PWA / arquivos estáticos
- Aplicativo abre após Ctrl+F5 sem erro de sintaxe.
- `favicon.ico` carrega sem 404.
- Service Worker atualiza para o cache da v0.8.6.
