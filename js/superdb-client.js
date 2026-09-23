// O SDK recebe o slug para enviar o schema correto no Accept-Profile.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@superdb/client/+esm';
import { superdbConfig } from './environment.js';

if (!/^[a-z0-9_-]+$/.test(superdbConfig.project) ||
    superdbConfig.project.startsWith('COLE_') ||
    !superdbConfig.key || superdbConfig.key.startsWith('COLE_')) {
  document.body.innerHTML = '<p style="margin:12vh auto;max-width:35rem;font:1rem system-ui">SuperDB DEV ainda não configurado. Preencha o slug e a chave anon em <code>js/environment.js</code>.</p>';
  throw new Error('[superdb] Configuração DEV pendente.');
}

export const superdb = createClient(superdbConfig.url, superdbConfig.key, {
  project: superdbConfig.project,
});
