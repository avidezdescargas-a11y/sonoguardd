
import { getLanguage } from './sonoguard-i18n.js';
import { SONOGUARD_WORKER_URL } from './sonoguard-ai-config.js';

export async function consultarSonoGuardIA(
  auth,
  mode,
  payload = {}
) {
  const base = String(
    SONOGUARD_WORKER_URL || ''
  ).replace(/\/$/, '');

  if (
    !base.startsWith('https://') ||
    base.includes('REEMPLAZA')
  ) {
    throw Error(
      'Falta configurar la URL de Cloudflare Worker en sonoguard-ai-config.js.'
    );
  }

  const current = auth.currentUser;

  if (!current) {
    throw Error('Inicia sesión en SonoGuard para usar la IA.');
  }

  const token = await current.getIdToken();

  const language =
    payload.language === 'en' ||
    payload.language === 'es'
      ? payload.language
      : getLanguage();

  let response;

  try {
    response = await fetch(base + '/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        mode,
        ...payload,
        language
      })
    });
  } catch {
    throw Error(
      'No fue posible conectar con Cloudflare. Comprueba la URL del Worker y la conexión.'
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Error(
      result.error ||
      'Error de la IA (' + response.status + ').'
    );
  }

  return result;
}
