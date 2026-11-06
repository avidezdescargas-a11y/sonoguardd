# SonoGuard – botón ES / EN

Esta versión integra un botón **🌐 EN / 🌐 ES** en el acceso y el panel principal. El idioma se recuerda en este navegador sin afectar los datos, Firebase ni tus hospitales. Traduce el panel, las evidencias, el historial, los controles, los mensajes y las etiquetas de la fotografía/PDF. En el idioma inglés también se prepara el texto de WhatsApp en inglés. No utiliza otra API de traducción.

## Publicar la página en GitHub (desde el navegador)
1. Descarga y descomprime el ZIP.
2. Abre el repositorio `avidezdescargas-a11y/sonoguardd` y conserva un respaldo.
3. En **Code → Add file → Upload files**, arrastra **el contenido** de `SonoGuard_IA_Bilingue_ES_EN/` (no la carpeta exterior ni el ZIP). La carpeta `public/` debe quedar en la raíz del repositorio.
4. Asegura que se actualicen `public/index.html`, `public/sonoguard-i18n.js`, `public/app.js`, `public/sonoguard-ia.js`, `public/sonoguard-chat.js` y `public/sonoguard-ai-client.js`; pulsa **Commit changes**.
5. En **Actions**, comprueba la publicación. Entra a la web y recarga con Ctrl+F5.

El archivo `public/sonoguard-ai-config.js` ya contiene la URL pública de Worker que proporcionaste. No subas claves secretas a GitHub.

## Respuestas de la IA en inglés
El sitio envía `language: "en"` al Worker. Para que OpenAI conteste también en inglés, en **Cloudflare → Workers & Pages → sonoguard-ia-api → Edit code**, reemplaza el código actual por `cloudflare-worker/worker.js` incluido en el ZIP y pulsa **Deploy**. **Conserva** los Secrets `OPENAI_API_KEY` y `AUTHORIZED_UID`, no hay que pegarlos de nuevo si ya existen. La página puede cambiar de idioma incluso si aún no actualizaste el Worker; lo que podría seguir contestando en español es la IA.

## Precauciones
- No se cambian las colecciones de Firestore `places`, `settings`, `sgEvidence`, ni las reglas existentes.
- No se suben fotografías a Firebase, se descargan al dispositivo. La precisión y permisos de cámara, GPS y micrófono siguen dependiendo del navegador.
- La IA utiliza tu saldo OpenAI existente; cada consulta es de pago. No hay límite diario en el Worker de este paquete.
- Al cambiar el idioma, las mediciones y los lugares permanecen intactos; los textos escritos por usuarios y las respuestas antiguas de IA no se traducen automáticamente.
