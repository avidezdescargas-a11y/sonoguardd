# Publicar SonoGuard IA en GitHub Pages sin perder los hospitales

## 0. Protege tu proyecto

**No subas el ZIP como archivo único a Pages.** Descomprímelo y conserva la estructura con `public/`, `firestore.rules`, `functions/` y `.github/workflows/pages.yml`.

- Primero haz un respaldo **de tu repositorio** y revisa las reglas *actualmente publicadas* en Firebase Console. Si son distintas de este paquete, NO las reemplaces sin comparar los cambios.
- Este ZIP **no contiene ni exporta los documentos de la base de datos remota**, porque no tenemos conexión a tu cuenta. No se crearon ni borraron hospitales. Los registros en `places` se mantienen en el proyecto Firebase existente; no cambies de proyecto ni borres su base de datos.
- Se recibió un `firestore.rules` con `adminUid()` apuntando a `REEMPLAZA_UID_ADMIN`; en este ZIP se corrigió solo ese valor usando el UID ya presente en `public/firebase-config.js`. Confirma que sea el UID administrador real antes de publicar.

## 1. Configuración y comprobaciones locales

Necesitas Node.js >=22, acceso a Internet, y el CLI de Firebase.

```bash
npm install
npm run check
node --check public/sonoguard-ia.js
node --test functions/test/logic.test.cjs
```

Si tienes Java 21+ también puedes probar reglas con `npm run test:rules` después de instalar las dependencias. El comando corre en un emulador local, NO modifica la base real.

Verifica que `public/firebase-config.js` use el proyecto Firebase correcto. Activa en **el mismo proyecto**: Authentication Email/Password, Firestore, Cloud Storage y Cloud Functions. **Storage y Functions pueden requerir Blaze/facturación**: define alertas y límites de consumo.

## 2. Crear secreto de OpenAI, sin publicarlo

En la raíz del proyecto:

```bash
npx firebase-tools login
npx firebase-tools use --add
npm install --prefix functions
npx firebase-tools functions:secrets:set OPENAI_API_KEY
```

Selecciona el proyecto que ya tiene hospitales. El último comando solicita la API Key en consola. NO la incluyas en `public/`, `firebase-config.js`, GitHub o ChatGPT.

## 3. Verifica reglas y publica servicios Firebase (NO es parte de GitHub Pages)

Si antes usabas otras reglas de Storage o Functions, revisa y fusiona manualmente: el archivo `storage.rules` de este paquete **deniega acceso fuera de `sgEvidence/`**, así que NO lo despliegues sin integrar las reglas anteriores si utilizabas otros archivos en Storage.

Después de revisar las reglas y hacer el respaldo:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage,functions
```

Este despliegue actualiza reglas y funciones, pero **no borra documentos** en `places` o `settings/global`. Revisa la salida de consola y los índices creados. Para reducir riesgo puedes primero desplegar solo las reglas en un proyecto Firebase de pruebas.

Configura el dominio `TU_USUARIO.github.io` en Authentication > Settings > Authorized domains. Si el navegador reporta problemas CORS al leer fotos desde GitHub Pages, revisa la configuración de CORS del bucket de Storage: https://cloud.google.com/storage/docs/using-cors . Mantén siempre las imágenes privadas mediante reglas, no las hagas públicas para saltar CORS.

## 4. Subir a GitHub Pages

En tu repositorio actual, sube los archivos descomprimidos respetando estas rutas, o desde Git si lo tienes configurado:

```bash
git add .
git commit -m "Integrar SonoGuard IA: evidencia, historial, geolocalización y OpenAI"
git push origin main
```

GitHub > Settings > Pages > Source: **GitHub Actions**. El flujo incluido `.github/workflows/pages.yml` publica **solo** `public/`, es decir, no expone reglas, funciones ni secretos.

Sitio: `https://TU_USUARIO.github.io/TU_REPOSITORIO/`.
Nueva sección: `https://TU_USUARIO.github.io/TU_REPOSITORIO/sonoguard-ia.html`.

## 5. Pruebas de seguridad y funcionales

1. Inicia sesión con un usuario existente. Debes ver hospitales, mapa y gráficas como antes.
2. Abre **📸 Evidencia + IA**, guarda tu perfil con nombre completo y acepta consentimiento.
3. Activa el micrófono y concede permiso (obtendrás dBFS), o usa lectura externa *declarada*, sin inventar una conversión.
4. Toma una foto y confirma el lugar. El GPS solo se usará si das permiso.
5. La imagen generada debe mostrar nombre, valor con su unidad, hora local, lugar y aviso de prueba.
6. Guarda y consulta en el historial; la foto debe ser privada para otros usuarios.
7. Al pulsar la imagen se debe abrir `wa.me/59175830320` con texto prellenado. No se envía ningún mensaje sin tu intervención ni se adjunta automáticamente la imagen.
8. Comprueba que el número 67123590 solo figura como **referencia municipal publicada en 2022, sin confirmar**.
9. Activa el análisis con IA tras configurar el secreto y desplegar la función. Se limita a 10 llamadas diarias por cuenta, espaciadas al menos 30 segundos. La IA recibe número y escala; el texto de tu pregunta se envía también, así que no escribas datos personales.
10. Prueba un usuario normal para confirmar que no puede modificar `places` ni `settings/global`.

## Protección, alcance y advertencias

- El historial anterior que `app.js` guardaba en el navegador permanece allí; este módulo añade uno nuevo en Firestore, no migra automáticamente CSV anteriores.
- Un administrador puede leer los metadatos de evidencias, no las fotos privadas de otros usuarios.
- El nombre del denunciante no está verificado; una fotografía puede ser editada y NO demuestra por sí sola quién generó el ruido.
- **NO ES UN CANAL OFICIAL DE DENUNCIAS** ni un sonómetro certificado. No afirmes que se ha infringido un límite legal.
- Una vez que el proyecto se use con personas reales, publica una política de privacidad, define retención de datos y explica cómo se eliminan fotos/mediciones. Habilita Firebase App Check antes de un despliegue público amplio y activa su cumplimiento también en la función.
- Si publicas las reglas en el proyecto actual, puede cambiar el acceso, así que conviene validarlas con el emulador y tu configuración real.
