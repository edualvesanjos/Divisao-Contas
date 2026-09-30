# Testes v0.9.6 DEV — conflitos de sincronização

## Pré-condições
- Usar o projeto DEV novo já validado.
- Usar duas sessões (normal e anônima) com o mesmo usuário.
- Escolher um único registro não crítico e anotar seu valor original.

## Sem conflito
1. Editar o registro na sessão A e sincronizar.
2. Atualizar/sincronizar B.
3. Confirmar que B recebeu a alteração sem aviso de conflito.

## Conflito real
1. A e B devem partir da mesma versão do registro.
2. Colocar A offline.
3. Alterar o registro em A e salvar.
4. Em B, alterar o mesmo registro para outro valor e aguardar sincronização.
5. Reconectar A.
6. A deve detectar que a versão remota mudou antes do envio e apresentar escolha explícita.

### Escolha: usar SuperDB
- Cancelar na caixa de conflito.
- A deve descartar sua alteração pendente e assumir a versão de B/SuperDB.
- Nova sincronização não deve reapresentar o conflito.

### Escolha: manter este dispositivo
- Repetir o cenário com novos valores.
- Confirmar OK na caixa de conflito.
- A deve enviar conscientemente sua versão.
- B deve receber essa versão na sincronização seguinte.

## Regressão
- Importação, edição comum, soft delete e offline/reconexão devem continuar funcionando.
- Nenhum campo `_sync_*` pode existir nas tabelas do SuperDB.
