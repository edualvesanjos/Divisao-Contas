# Testes v0.9.4 DEV — exclusão lógica

## Objetivo
Validar a propagação de exclusões entre sessões/dispositivos sem exclusão física no SuperDB.

## Pré-condições
- Mesmo usuário DEV autenticado nas duas sessões.
- Uma sessão no StackBlitz e outra no GitHub Pages de homologação.
- Ambas exibindo status Sincronizado.

## Cenário principal
1. Criar um registro de teste na Sessão A e aguardar sincronização.
2. Confirmar que o registro aparece automaticamente na Sessão B.
3. Excluir o registro na Sessão A e aguardar sincronização.
4. Confirmar que ele desaparece automaticamente da Sessão B.
5. Recarregar a Sessão B e confirmar que o registro continua oculto.
6. Consultar o SuperDB e confirmar que o registro ainda existe com `deleted = true`.
7. Confirmar que não existe uma segunda linha ativa com o mesmo `id`.

## Offline
1. Desconectar a Sessão B.
2. Excluir um registro na Sessão A.
3. Reconectar a Sessão B.
4. Confirmar que a exclusão lógica é recebida e o registro deixa de ser exibido.

## Regressão
Repetir inclusão, alteração e exclusão em Contas e Abastecimentos. Conferir Configurações e Fechamentos Mensais.
