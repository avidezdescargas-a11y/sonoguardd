# SonoGuard IA — Publicar y conectar OpenAI + Firebase (Windows)

## Cambios de este paquete

- En la cámara y el chat se habla de **informar un problema de ruido**, no de acusar a nadie.
- Al elegir compartir, se prepara un aviso que **pide amablemente revisar la zona y considerar una visita de verificación si corresponde**.
- WhatsApp abre exclusivamente **75830320 (PRUEBA)**: es un número de práctica; **no contacta a la Alcaldía ni solicita inspecciones automáticamente**. La foto se adjunta manualmente.
- Cámara, micrófono y GPS siguen automáticos; la captura se guarda como antes (si Firebase Storage está correctamente habilitado).
- El asistente flotante mantiene la misma sesión Firebase. No se cambió la base original de `places` ni `settings/global`.

## 1. Publicar el sitio en GitHub Pages

1. En GitHub, crea un respaldo del repositorio actual (por ejemplo descargando el ZIP del código o conservando el commit anterior).
2. Descarga y descomprime este proyecto. **Sube el contenido de la carpeta**, no el archivo ZIP ni la carpeta exterior.
3. Abre el repositorio existente `sonoguardd` en la rama `main` → **Add file → Upload files**. Arrastra los archivos y carpetas descomprimidos. Comprueba que `.github/workflows/pages.yml` esté dentro de `.github`.
4. Revisa la lista de cambios antes de **Commit changes**. No elimines otros archivos de tu repositorio.
5. En **Settings → Pages**, selecciona **GitHub Actions**. En **Actions**, espera a que «Publicar SonoGuard» termine correctamente.
6. Abre `https://avidezdescargas-a11y.github.io/sonoguardd/` y recarga con Ctrl+F5.

> GitHub Pages publica solamente la carpeta `public/`. El chat y el historial en la nube dependen además de los servicios de Firebase que siguen abajo.

## 2. Conservar la base Firebase que ya tienes

Este paquete ya lleva `public/firebase-config.js` del proyecto **sonoguard-da942** y el UID administrador que aparece en la copia que enviaste. El objeto `firebaseConfig` del navegador es público por diseño: **no es la clave secreta de OpenAI**.

Entra a https://console.firebase.google.com/ y abre **sonoguard-da942**. Comprueba que los lugares actuales aparecen en **Firestore Database → Datos → `places`**, y conserva una copia de tus reglas publicadas antes de actualizarlas. NO crees otro proyecto ni otra base de datos. Revisa que Authentication → Sign-in method tenga correo/contraseña y que tu dominio `avidezdescargas-a11y.github.io` esté permitido en Authentication → Settings → Authorized domains, si Firebase lo requiere.

Para guardar fotos en el historial, **Cloud Storage** debe estar habilitado para ese mismo proyecto. Revisa su bucket y las reglas del paquete (`storage.rules`). Las funciones necesitan habilitar facturación (plan Blaze). Configura presupuestos y alertas. Los archivos no eliminan registros en producción; desplegar reglas sí reemplaza las reglas publicadas y hay que revisarlas antes.

## 3. Crear o verificar la clave OpenAI

Entra a https://platform.openai.com/api-keys, selecciona tu proyecto de API y verifica que exista una clave con permisos para la API. La facturación de OpenAI API es independiente de ChatGPT Plus; controla límites y consumo en https://platform.openai.com/usage y https://platform.openai.com/settings/organization/billing/overview.

**Nunca pegues la clave** en `public/firebase-config.js`, `public/app.js`, GitHub, el chat ni una captura de pantalla.

## 4. Conectar la API Key como secreto en Firebase Functions

Esto se hace una vez en **tu computadora**, no desde GitHub Pages (que es estático).

Necesitas Node.js 22, internet y una terminal PowerShell. Abre PowerShell dentro de la carpeta descomprimida donde está `firebase.json` y ejecuta:

```powershell
node --version
npm install
npm install --prefix functions
npx firebase-tools login
npx firebase-tools projects:list
npx firebase-tools functions:secrets:set OPENAI_API_KEY --project sonoguard-da942
```

Cuando la terminal solicite el valor de `OPENAI_API_KEY`, **pégalo allí**, sin enviármelo. Firebase lo guarda en Secret Manager y las Functions lo leen de modo seguro. Si cambias la clave tendrás que volver a publicar las funciones.

Comprueba localmente:

```powershell
npm run check
npm run check:ia
```

## 5. Publicar las Cloud Functions de OpenAI

Desde esa misma carpeta ejecuta:

```powershell
npx firebase-tools deploy --only functions --project sonoguard-da942
```

Se publican `chatSonoGuard` y `analyzeSonoGuardEvidence` en `us-central1`. Si la instalación solicita habilitar servicios de Google Cloud, sigue la consola de Firebase. Comprueba **Firebase Console → Build → Functions**. En la web, entra a SonoGuard, pulsa el icono flotante `✦ IA` y pregunta «¿Qué significa el índice digital?». Debe responder sin abrir otro login.

## 6. Habilitar historial y fotografías (Firestore + Storage)

En la consola de Firebase, habilita **Cloud Firestore** y **Cloud Storage** para ese mismo proyecto. Confirma que ya están activos; no crees bases o buckets nuevos sin necesidad. Antes de desplegar copia las reglas actuales de Firestore y Storage de la consola, compáralas con `firestore.rules` y `storage.rules` del ZIP y valida que mantengan permisos de `places` y `settings/global`. Si tus reglas en producción son distintas, integra los bloques aditivos con cuidado; no sobrescribas directamente.

Una vez respaldadas y revisadas, ejecuta:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project sonoguard-da942
```

Esto publica reglas/índices, NO publica la web en Firebase Hosting ni borra automáticamente documentos. **Sí cambia los permisos publicados**; hazlo solo después de revisar. Verifica que puedes seguir viendo los hospitales del mapa y guardar una foto privada en `sgEvidence` y Cloud Storage.

## 7. Prueba completa

1. En la web de GitHub Pages inicia sesión como siempre y confirma que aparecen hospitales y lugares existentes.
2. Pulsa `✦ IA` y haz una pregunta.
3. Abre `Evidencia + IA`, habilita cámara, micrófono y geolocalización en el navegador y toma una foto.
4. Confirma que el JPG muestra la lectura, hora y zona; verifica el guardado en el historial privado.
5. Elige **Informar problema por WhatsApp (prueba)**, escribe tu nombre completo y comprueba que WhatsApp abre el **75830320** con un aviso que pide revisar la zona. Adjunta manualmente la foto si deseas enviar el mensaje.

## Seguridad, privacidad y límites

- La cámara, el micrófono y el GPS requieren permisos del navegador. El usuario decide qué comparte por WhatsApp.
- La IA procesa un resumen numérico sin enviar nombres, fotografías ni coordenadas exactas.
- La medición digital no es prueba oficial ni certificación ambiental; no se debe atribuir ruido a una persona o negocio por cercanía.
- El número de referencia municipal 67123590 se publicó en 2022 y su vigencia no está confirmada. Aparece únicamente como información, separado del WhatsApp de prueba.
- `firebase-config.js` es configuración web pública; **`OPENAI_API_KEY` siempre queda en Firebase Secret Manager**.
- Si falla la publicación o tu Firebase es diferente, detente antes de cambiar reglas y revisa las diferencias.
