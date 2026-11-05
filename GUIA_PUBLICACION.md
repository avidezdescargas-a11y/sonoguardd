# Cómo subir SonoGuard IA directamente a GitHub Pages

**Esta versión guarda las fotos automáticamente en Firebase y agrega un chat flotante.** No se ha desplegado en tu Firebase real ni en tu GitHub. Conserva tu base de datos actual: las colecciones `places` y `settings/global` son las mismas.

## A. Subir a GitHub desde el navegador (sin GitHub Desktop)

1. Descarga el ZIP y **descomprímelo**. Abre la carpeta `SonoGuard_IA_Flotante_Autoguardado`.
2. En GitHub, entra al repositorio actual de SonoGuard y abre la rama `main`. **Haz una copia de seguridad o conserva el commit actual para revertir.**
3. Haz clic en **Add file → Upload files**. Arrastra **el contenido de la carpeta**, no el ZIP ni la carpeta exterior. Deben quedar `public/`, `functions/`, `firestore.rules`, `firebase.json` y `.github/` en la raíz.
4. Si la carpeta oculta `.github/` no se sube desde tu navegador, conserva la existente del repositorio (el archivo `.github/workflows/pages.yml`) o créala con **Add file → Create new file**.
5. Comprueba los archivos modificados y que no estés eliminando otros datos del repositorio. Pulsa **Commit changes**.
6. En tu repositorio abre **Settings → Pages → Source: GitHub Actions**. En **Actions**, comprueba que «Publicar SonoGuard» termina con marca verde. Publica **solo `public/`**.
7. Abre `https://TU_USUARIO.github.io/TU_REPOSITORIO/`. Inicia sesión con tu cuenta normal. Debes ver el icono flotante `✦ IA` abajo a la derecha; el botón «📸 Evidencia + IA» abre el módulo cámara en el mismo panel.

**La subida a GitHub NO activa la IA ni el guardado en nube por sí sola.** GitHub Pages solo aloja archivos web estáticos.

## B. Preparar Firebase sin tocar tus hospitales

Antes de desplegar reglas **haz un respaldo de tu Firestore** y **compara `firestore.rules` del ZIP con las reglas actualmente publicadas** en tu proyecto. El deploy reemplaza los permisos publicados. Confirma que `public/firebase-config.js` apunta a tu Firebase **original** y que `appConfig.adminUid` coincide con el administrador real. No crees otro Firebase.

En tu computadora, con Node.js compatible, dentro de la carpeta descomprimida:

```sh
npm install
npm run check
npm run check:ia
npx firebase-tools login
npx firebase-tools use --add
npm install --prefix functions
npx firebase-tools functions:secrets:set OPENAI_API_KEY
```

Para el último comando escribe **tu propia clave de OpenAI solo en la terminal**; no la compartas ni la subas a GitHub. Debes habilitar Cloud Firestore, Cloud Storage, Cloud Functions y el plan compatible con facturación (normalmente Blaze). Configura alertas de gasto.

**Únicamente tras respaldar y validar las reglas**, despliega desde la misma carpeta:

```sh
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage,functions
```

Esto requiere credenciales/permisos de tu proyecto real. Debes tener configurada la extensión de Storage y habilitadas las API de Google necesarias. El comando publica reglas y funciones; no elimina automáticamente documentos, pero sí puede alterar permisos si las reglas no coinciden con las que tenías publicadas.

## C. Comprobaciones

1. Accede a SonoGuard y verifica que todos los hospitales, escuelas y lugares anteriores sigan en el mapa. Comprueba los permisos de administración.
2. Comprueba que el icono flotante `✦ IA` siempre esté visible dentro del panel y sobre la cámara. Pulsa y verifica el saludo «¿En qué puedo ayudarte?».
3. Envía una pregunta. El chat debe responder después de instalar la Cloud Function y configurar la clave; no necesitas tomar ninguna foto ni volver a iniciar sesión.
4. Pulsa `📸 Evidencia + IA`, abre la cámara, inicia el micrófono o declara una lectura externa, selecciona lugar y pulsa `📸 Tomar foto ahora`.
5. Comprueba que **sin pedir nombre** aparece «Guardando fotografía…» y después «Foto guardada» en el historial y un JPG en descargas. La cámara/micrófono sí requiere autorización del navegador.
6. Toca la foto o `WhatsApp de prueba`. Escribe nombre completo y acepta mostrarlo en la **copia** para enviar. Se descarga un JPG con nombre y se abre WhatsApp al **75830320** con un borrador de prueba. Adjunta la imagen manualmente. No envíes denuncias reales durante las pruebas.
7. Verifica que puedes abrir, descargar y eliminar una foto propia. Revisa que otro usuario no pueda consultar fotos ajenas.

## Notas

- Si Firebase Storage no está activo o el despliegue de reglas falla, la captura se puede visualizar y se intenta descargar automáticamente, pero **no quedará guardada en la nube**. Corrige Firebase antes de confiar en el historial.
- Si WhatsApp no abre un chat en navegador/escritorio, puede requerir tener WhatsApp instalado y sesión activa.
- Las medidas de micrófono son dBFS y no justifican sanciones. Los valores SPL externos introducidos manualmente tampoco son certificados.
- La función flotante es un asistente de orientación y no sustituye a autoridades públicas ni a un sonómetro calibrado.
