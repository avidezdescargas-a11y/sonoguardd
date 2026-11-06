# Conexión existente de OpenAI sin Firebase Cloud Functions

La versión bilingüe conserva la arquitectura existente: **GitHub Pages → Cloudflare Worker → OpenAI**, con Firebase solo para autenticación y los metadatos del historial.

## Para actualizar el idioma de las respuestas de IA

1. Abre tu Worker actual en Cloudflare, `sonoguard-ia-api`.
2. Selecciona **Edit code** y reemplaza únicamente el contenido de `worker.js` por el archivo `cloudflare-worker/worker.js` de este paquete.
3. Pulsa **Deploy**. Confirma que sigan configurados `OPENAI_API_KEY` (**Secret**) y `AUTHORIZED_UID` (**Variable/Secret**). No compartas ni pegues esas claves en GitHub.
4. El Worker ahora interpreta `language: "es"` y `language: "en"`. Al activar inglés, el asistente responde en inglés. No requiere crear `AI_QUOTA` ni KV.
5. En GitHub, `public/sonoguard-ai-config.js` ya tiene la dirección `https://sonoguard-ia-api.avidezdescargas.workers.dev`.

La ruta `/health` solo confirma que existen las variables; la prueba real es abrir SonoGuard y enviar una pregunta. Cada pregunta consume créditos de OpenAI. La actualización de idioma no modifica datos ni reglas de Firebase.
