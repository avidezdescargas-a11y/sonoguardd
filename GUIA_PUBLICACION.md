# SonoGuard IA — nueva cámara en vivo, integrada en el mismo panel

## Cambios principales

- **No hay segundo formulario de inicio de sesión**: SonoGuard IA se abre dentro del panel principal usando la misma cuenta de Firebase Authentication. Si se abre su URL por separado sin sesión, se dirige al login original.
- **Cámara en directo**: pulsa **📸 Evidencia + IA**, después **Abrir cámara en vivo**. La vista muestra hora de Bolivia, lugar indicado y lectura actual en dBFS, o valor SPL externo *declarado*.
- **Tomar foto ahora** captura un fotograma de la cámara en ese instante, junto con el valor/hora/lugar congelados de ese momento. No solicita subir una foto desde la galería y **no la sube automáticamente**.
- **WhatsApp de prueba**: tras tomar la foto pulsa **WhatsApp de prueba · pedir nombre**. Se solicitarán nombre y apellidos completos y consentimiento, se pondrá el nombre **dentro de la imagen JPG**, se descargará esa imagen y se abrirá un mensaje preparado al **+591 75830320**.
- **La foto NO se adjunta automáticamente a WhatsApp.** El usuario debe adjuntar manualmente el JPG descargado y confirmar si quiere enviar el mensaje. El contacto es una simulación académica; no se envían denuncias oficiales.
- **Guardado opcional**: el usuario puede marcar «También autorizo guardar» durante el envío o pulsar **Guardar en historial privado**. Solo entonces se crea un registro en `sgProfiles`, `sgEvidence` y Storage con las reglas nuevas.
- **IA**: el análisis mediante OpenAI requiere guardar primero la evidencia y desplegar Cloud Functions con el secreto `OPENAI_API_KEY`.

## Importante: base de datos anterior

El proyecto usa el **mismo `firebase-config.js`** que recibimos. No se cambian ni se migran los documentos actuales de hospitales/escuelas/zonas en `places/`, ni `settings/global`. La aplicación conserva el analizador de 31 bandas, mapa, roles, historia local y configuración de Firebase. No se realizó ninguna operación remota. Las reglas del ZIP son una copia aditiva de las reglas *que compartiste*; **compráralas con las reglas actualmente publicadas** en tu Firebase antes de desplegar para evitar perder otros permisos.

## Subir directamente desde GitHub web (sin GitHub Desktop)

1. **Descarga** y descomprime el ZIP nuevo. Haz copia de seguridad de tu repositorio actual y exporta/respalda las reglas actualmente publicadas en Firebase.
2. En GitHub, abre tu repositorio SonoGuard actual y la rama `main`. Ve a **Add file → Upload files**.
3. Arrastra **el contenido interno** de la carpeta del proyecto, NO el ZIP: las rutas `public/index.html`, `public/app.js`, `public/sonoguard-ia.html`, `public/sonoguard-ia.js`, `public/sonoguard-shell.js`, `functions/`, `firestore.rules` y `.github/workflows/pages.yml` deben quedar en la raíz correcta. Si no puedes subir carpetas ocultas, crea `.github/workflows/pages.yml` mediante **Add file → Create new file** o conserva la existente.
4. Comprueba la lista de archivos a cambiar, confirma el commit y ve a **Actions**. El flujo existente de Pages publica **solo `public/`**.
5. En **Settings → Pages → Source** selecciona **GitHub Actions**. Abre `https://USUARIO.github.io/REPOSITORIO/`, inicia sesión una sola vez y pulsa **📸 Evidencia + IA**.

> Publicar en GitHub Pages no publica reglas ni funciones de Firebase. La cámara funcionará con permisos del navegador en HTTPS. Si aún no despliegas el backend, el historial nuevo, almacenamiento en nube y OpenAI podrían dar error, pero la captura y descarga local de JPG pueden usarse con la sesión existente.

## Firebase: solo después de respaldo y revisión de permisos

En tu computadora, desde la raíz del proyecto, después de seleccionar el proyecto Firebase **actual** (el que ya tiene hospitales):

```bash
npm install
npm run check
node --check public/sonoguard-ia.js
node --check public/sonoguard-shell.js
node --test functions/test/logic.test.cjs
npx firebase-tools login
npx firebase-tools use --add
npm install --prefix functions
npx firebase-tools functions:secrets:set OPENAI_API_KEY
# SOLO después de validar los archivos de reglas contra los publicados:
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage,functions
```

Se requiere configurar Storage, Functions y posiblemente plan Blaze/facturación. No subas la clave de OpenAI a GitHub ni a `public/`. El despliegue de reglas **sustituye** los permisos publicados en Firebase, por lo que debes comparar/respaldar antes. GitHub Pages no ejecuta el backend.

## Prueba final

1. En el SonoGuard principal, inicia sesión una vez. Comprueba que el mapa conserva tus hospitales registrados.
2. Pulsa el botón **📸 Evidencia + IA**; debe aparecer el módulo dentro de la misma página **sin volver a pedir usuario/contraseña**.
3. Escribe zona (o elige un lugar registrado), activa micrófono, pulsa **Abrir cámara en vivo**. Acepta permisos de navegador.
4. Verifica la hora, lugar y valor sobre el video. Pulsa **Tomar foto ahora** y confirma que la foto muestre los mismos datos congelados en el JPG.
5. Pulsa WhatsApp, introduce el **nombre completo**, da consentimiento; se descargará JPG con nombre y abrirá la conversación de **prueba 75830320**. **Adjunta manualmente** la foto. No envíes una denuncia oficial.
6. Si deseas historial, guarda con autorización en Firebase. Para IA, configura y despliega el backend primero.

## Notas éticas y técnicas

El número municipal `67123590` aparece únicamente como referencia publicada en 2022, con vigencia pendiente de confirmar. Son lecturas orientativas; dBFS del micrófono del navegador **no** son decibelios ambientales dB SPL. No se acusa ni sanciona automáticamente a establecimientos. No publiques rostros, matrículas ni datos personales ajenos sin fundamento. No se garantiza que los datos y fotografías sean prueba legal.
