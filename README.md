# SonoGuard IA · Español / English

Versión bilingüe de SonoGuard con **botón 🌐 EN / 🌐 ES**, incluida la pantalla de acceso, el monitor acústico, el mapa, la cámara, el historial sin fotos, el asistente flotante y los informes. El idioma se recuerda en este navegador. No requiere una API de traducción.

**Instrucciones paso a paso:** [`ACTIVAR_INGLES_EN_GITHUB.md`](ACTIVAR_INGLES_EN_GITHUB.md).

## Publicación

- GitHub Pages publica la carpeta `public/` mediante `.github/workflows/pages.yml`.
- El enlace público a Cloudflare ya está configurado en `public/sonoguard-ai-config.js`.
- Para que las **respuestas generadas por la IA** estén en inglés al escoger EN, actualiza también `cloudflare-worker/worker.js` en Cloudflare **sin tocar los secretos**.
- El Worker no incluye un límite diario de consultas. OpenAI cobra por uso; desactiva las recargas automáticas si quieres evitar compras de saldo adicionales.

## Integridad del proyecto

Este paquete conserva el flujo de monitoreo original, los lugares de Firestore (`places`), `settings/global`, perfiles e historial de metadatos. No elimina datos ni sube fotografías a Firebase. Las traducciones afectan exclusivamente a la presentación, no a los valores acústicos ni a los identificadores y datos guardados. Los nombres y contenidos aportados por los usuarios no se traducen automáticamente.

Pruebas: `npm run check`, `npm run check:ia`, `npm run check:solo-datos`. Para reglas reales de Firestore, aplica el procedimiento de respaldos y comprobaciones; esta actualización de idioma **no necesita cambios de reglas**.
