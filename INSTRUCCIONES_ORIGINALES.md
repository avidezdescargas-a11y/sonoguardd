# SonoGuard para GitHub Pages + Firebase

Esta adaptación conserva el panel de SonoGuard y reemplaza el servidor de Sites/Cloudflare por Firebase Authentication y Cloud Firestore. GitHub Pages sirve los archivos estáticos. También puedes usar Firebase Hosting con los mismos archivos.

No se ha conectado a un proyecto real porque faltan tu configuración web y el UID administrador. La página mostrará una indicación de configuración hasta completarlos. No incluye contraseñas ni una cuenta administradora precreada.

## 1. Crear el proyecto Firebase

1. Abre https://console.firebase.google.com/ y crea un proyecto para SonoGuard.
2. Dentro del proyecto, abre Configuración del proyecto y añade una aplicación Web (`</>`).
3. Copia el objeto `firebaseConfig` que aparece al registrar la app.
4. Abre `public/firebase-config.js` y reemplaza los valores de ejemplo con los de ese objeto. Mantén la estructura `export const firebaseConfig = {...}`.
5. No necesitas `databaseURL`: esta versión utiliza **Cloud Firestore**, no Realtime Database.

La configuración web se incluye en el navegador y no es una clave privada de servidor. No subas un archivo de cuenta de servicio ni credenciales del Admin SDK.

## 2. Activar el login y crear al administrador

1. En Firebase, entra a Build > Authentication > Get started.
2. En Sign-in method, activa **Email/Password** (correo y contraseña). No necesitas activar Email link.
3. En Users, pulsa Add user. Crea tu cuenta administradora con tu correo y una contraseña elegida por ti; puede ser `davidlimachipoma2016@gmail.com`.
4. Copia el **UID** de esa cuenta. No copies el correo como UID.
5. Pega el mismo UID en estos dos lugares:
   - `public/firebase-config.js`: propiedad `appConfig.adminUid`.
   - `firestore.rules`: texto que devuelve `adminUid()`.
6. En Authentication > Settings > Authorized domains añade `TU_USUARIO.github.io` (solo el dominio; sin https ni nombre del repositorio). Añade también tu dominio personalizado si usas uno. Para pruebas locales, añade `localhost` si no está presente.

Los demás usuarios pueden crear sus cuentas desde la pantalla de acceso; serán usuarios normales. No hay botón para asignarse administrador. La configuración visual por UID no concede permisos por sí sola: las reglas de Firestore deben contener el mismo UID.

## 3. Crear Cloud Firestore y publicar las reglas

1. En Build > Firestore Database pulsa Create database.
2. Usa la base de datos `(default)` y modo de producción. Elige una ubicación apropiada para tu proyecto.
3. Abre Rules y pega el contenido completo de `firestore.rules`, **con tu UID ya reemplazado**.
4. Pulsa Publish.

Las colecciones se crean al guardar el primer lugar o los ajustes; no debes crear tablas SQL ni importar las migraciones de la versión anterior.

Esta configuración es para un proyecto dedicado a SonoGuard. Si eliges un proyecto con otras apps, integra sus reglas sin reemplazar sus permisos ni permitir escrituras generales. Las rutas usadas aquí son `places/{id}` y `settings/global`.

### Datos compartidos

- `places/{id}`: nombre, tipo, coordenadas, radio, límite de ruido, nota/horario, revisión y fecha de actualización.
- `settings/global`: umbrales y ajustes, revisión y fecha de actualización.
- Historial: guardado por UID en el navegador, con exportación CSV.
- Calibración y punto de medición: locales al navegador.

## 4. Subir a GitHub Pages

1. Descomprime el ZIP.
2. Crea un repositorio en GitHub, por ejemplo `sonoguard`.
3. Sube **el contenido de la carpeta del proyecto**, incluyendo `public/` y `.github/workflows/pages.yml`. No subas el ZIP cerrado ni una carpeta adicional que envuelva todo el proyecto.
4. Guarda los cambios en la rama `main`.
5. En el repositorio entra a **Settings > Pages > Build and deployment > Source: GitHub Actions**.
6. En la pestaña Actions abre “Publicar SonoGuard en GitHub Pages”. Espera que termine correctamente. Si es necesario, pulsa Run workflow.
7. En Settings > Pages abre la URL publicada, normalmente `https://TU_USUARIO.github.io/sonoguard/`.
8. Comprueba que `TU_USUARIO.github.io` ya esté en los dominios autorizados de Firebase.

El flujo publica solo `public/`; no publica las reglas de Firestore. Si modificas las reglas después, publícalas de nuevo desde Firebase Console o la CLI. Los scripts usan rutas relativas para funcionar incluso dentro de `/sonoguard/`. No hay compilación del frontend y no hace falta instalar Node para publicarlo por este método.

Si al subir con la web de GitHub no aparece `.github/`, usa Git o crea `.github/workflows/pages.yml` desde Add file > Create new file. La carpeta `.github` no debe omitirse.

### Alternativa con Git en tu PC

Después de crear un repositorio vacío, abre una terminal en esta carpeta y adapta la URL:

```sh
git init
git add .
git commit -m "SonoGuard con GitHub Pages y Firebase"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sonoguard.git
git push -u origin main
```

Luego selecciona GitHub Actions en Settings > Pages. La autenticación con GitHub se realiza desde tus herramientas; no pegues contraseñas dentro de los archivos.

## 5. Alternativa: publicar también en Firebase Hosting

Si quieres alojar la página en Firebase en lugar de GitHub Pages, el proyecto ya incluye `firebase.json`:

```sh
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,firestore:indexes,hosting
```

Selecciona tu proyecto cuando lo solicite. No vuelvas a ejecutar `firebase init` sobreescribiendo archivos de esta entrega. Si solo usas GitHub Pages, puedes publicar las reglas desde la consola y omitir Firebase Hosting por completo.

## 6. Probar en tu computadora

No abras `index.html` con doble clic: los módulos JavaScript deben servirse mediante HTTP/HTTPS.

Con Python instalado:

```sh
python -m http.server 8000 --directory public
```

En Linux/macOS puede llamarse `python3`. Entra a `http://localhost:8000/`. El proyecto Firebase debe estar configurado y conectado a Internet.

El micrófono requiere HTTPS o localhost y autorización del navegador. En celular usa la URL HTTPS de GitHub Pages o Firebase Hosting. HTTP desde una IP de red local no es equivalente a localhost para los permisos de micrófono.

## 7. Prueba de funcionamiento

1. Entra con tu cuenta administradora de Firebase: arriba debe aparecer ADMIN.
2. Registra un hospital o un salón con nombre, coordenadas, radio, límite y nota/horario.
3. Abre otra sesión o navegador y crea una cuenta diferente.
4. Esa cuenta debe ver el lugar y su límite, pero no los controles de edición.
5. Cambia el límite desde administración: la otra sesión recibe el cambio en vivo.
6. Usa Probar demo para comprobar las gráficas sin micrófono.
7. Pulsa Iniciar micrófono y autoriza el acceso. Usa Detener para liberarlo.
8. Entra a Calibrar desde administración solo si cuentas con una referencia real de sonómetro.

Las zonas de la app original no se copian automáticamente de Cloudflare a Firestore. El botón “Importar zonas anteriores” recupera únicamente los lugares de versiones antiguas guardados en `sg-places` **en el navegador y dominio actuales**. GitHub Pages y el sitio anterior tienen almacenamientos locales diferentes. No incluye el historial local del dominio anterior ni datos de producción.

## 8. Archivos

| Archivo | Uso |
|---|---|
| `public/index.html` | Interfaz, login y estilos. |
| `public/app.js` | Audio, analizador, evolución, semáforo, mapa e interacción. |
| `public/firebase-config.js` | Tu configuración web y UID administrador. |
| `public/firebase-service.js` | Firebase Auth, consultas y transacciones de Firestore. |
| `public/data-model.js` | Valores iniciales y validación de datos. |
| `firestore.rules` | Autorización y validación en Firebase. |
| `firebase.json` | Despliegue opcional con Firebase Hosting y emulador. |
| `.github/workflows/pages.yml` | Publicación automática de `public/`. |
| `tests/` | Validación y pruebas de reglas para el emulador. |

## 9. Comprobaciones de código y permisos

Con Node.js compatible con las herramientas Firebase instaladas:

```sh
npm run check
```

Para probar reglas con el emulador, instala las herramientas de desarrollo y Java 21 o superior para el emulador de Firestore:

```sh
npm install
npm run test:rules
```

Las pruebas usan un proyecto `demo-sonoguard` y un UID de prueba en memoria; no modifican tu proyecto real. Verifican lectura autenticada, rechazo de escrituras de usuarios normales, restricciones del esquema y operaciones de administración.

## 10. Si aparece un error

- “Configura firebase-config.js”: faltan los valores reales de tu proyecto.
- “operation-not-allowed”: activa Email/Password en Authentication.
- “unauthorized-domain”: añade el dominio publicado a Authorized domains.
- “permission-denied”: comprueba que publicaste `firestore.rules` en el mismo proyecto de tu configuración y que el UID admin coincide en ambos archivos.
- Ves USUARIO con la cuenta administradora: compara el UID de Authentication con `appConfig.adminUid`; no basta con escribir el correo.
- Login correcto pero no cargan zonas: verifica que creaste Cloud Firestore `(default)` y publicaste las reglas. Revisa también la conexión.
- GitHub muestra README o un 404: selecciona GitHub Actions como fuente y comprueba que el flujo publique `public/`.
- No llega recuperación de contraseña: revisa Spam, que la dirección corresponda al proyecto y las plantillas de Authentication.

## Medición

La escala dBFS es digital. La estimación dB SPL requiere calibración con sonómetro y no equivale a una medición certificada ni incluye ponderación A. Los límites de cada lugar se introducen por administración; el micrófono no mide el ruido recibido en edificios distantes. Se conservan las bandas y rangos del panel que solicitaste.

## Referencias oficiales

- Firebase Authentication: https://firebase.google.com/docs/auth/web/password-auth
- SDK web desde CDN: https://firebase.google.com/docs/web/alt-setup
- Reglas y autenticación: https://firebase.google.com/docs/rules/rules-and-auth
- Transacciones Firestore: https://firebase.google.com/docs/firestore/manage-data/transactions
- GitHub Pages con Actions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Comprobaciones realizadas en esta entrega

- Sintaxis de los módulos JavaScript: correcta.
- Validación de lugares y ajustes con pruebas locales: correcta.
- Pantalla de acceso y aviso de configuración: revisados en navegador.
- Pruebas de reglas: incluidas; el emulador no pudo iniciar por un error del runtime Java de este entorno, por lo que no se ejecutaron contra Firestore aquí.
- Conexión con Firebase real y publicación en tu GitHub: pendientes de tu configuración y cuentas.
