> **ACTUALIZACIÓN:** para conectar la IA de esta versión SIN Blaze, sigue primero `CONECTAR_SONOGUARD_OPENAI_SIN_BLAZE.md`. Los pasos anteriores sobre Cloud Functions no aplican a esta entrega.

# Publicar SonoGuard IA sin guardar fotos en Firebase

## 1. GitHub Pages
1. Haz copia del repositorio original y guarda una copia de tus reglas actuales de Firestore desde la consola.
2. Descomprime este ZIP.
3. En tu repositorio GitHub **sonoguardd**, pestaña **Code → Add file → Upload files**, arrastra **el contenido de la carpeta** (no el ZIP, ni la carpeta envolvente). Respeta `.github/workflows/pages.yml` y `public/` en la raíz.
4. **Commit changes**. En **Settings → Pages** asegúrate de usar **GitHub Actions** y verifica la pestaña **Actions**. Usa Ctrl+F5 o recarga sin caché.
5. Abre `https://avidezdescargas-a11y.github.io/sonoguardd/` y usa la cámara. En el primer uso, acepta permisos de cámara, micrófono y ubicación; en Windows habilita servicios de ubicación para el navegador. Es necesaria conexión HTTPS.

## 2. Firestore: indispensable para guardar y borrar los datos
Este proyecto **no usa Cloud Storage**. Las fotos quedan solo en Descargas del dispositivo. `firebase.json` no contiene el apartado `storage`.

GitHub Pages no actualiza las reglas de Firestore. **Sin publicar las reglas del ZIP, puede aparecer `permission-denied` y no se guardará ni mostrará el historial.**

- En [Firebase Console](https://console.firebase.google.com/) elige `sonoguard-da942` → Firestore Database → Rules.
- **Copia y guarda** el texto de las reglas actuales primero (y verifica que administran tu base real).
- Compara el bloque `places` y `settings/global` con `firestore.rules` de este paquete; preserva cualquier permiso personalizado que no esté en el ZIP.
- Copia las reglas verificadas del paquete en Rules y pulsa **Publish**, o si tienes Node.js y Firebase CLI, desde la raíz del proyecto:

```powershell
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project sonoguard-da942
```

**No uses** `firebase deploy --only storage`, ni configures un bucket para este módulo. No hace falta crear índices compuestos: el historial filtra por `ownerUid` y ordena los resultados en el navegador.

## 3. Pruebas
- Entra en el mismo usuario de SonoGuard; verifica que los hospitales sigan apareciendo.
- Abre «Evidencia + IA» y luego «Abrir cámara y sensores». Permite cámara, micrófono y ubicación. Si la ubicación falla, prueba «Reintentar sensores».
- Si el navegador no obtiene ubicación, puedes fotografiar cuando la cámara muestre imagen: si falta el micrófono se indicará «Sin lectura»; la foto y el historial indicarán «Ubicación no disponible».
- Pulsa «Tomar foto ahora»: se descargará JPG y, si Firestore está configurado, se guardará **solo el registro de datos**.
- Revisa «Mis registros de datos». Pulsa «Ver datos», «Eliminar registro» y comprueba que desaparece. El borrado no elimina tus hospitales ni una foto que ya guardaste en tu dispositivo.
- Pulsa «Informar problema por WhatsApp (prueba)»: introduce tu nombre completo; se descarga una copia con nombre, abre WhatsApp y **tú adjuntas manualmente el JPG**.
- Si el navegador bloquea descargas automáticas, usa el botón «Descargar foto JPG» tras capturar.
- Si el historial da error, revisa la consola del navegador (F12) y publica reglas. Esta versión **no necesita el índice compuesto antiguo**.

## 4. IA flotante y costos
El asistente flotante sigue en el proyecto. Para conectarlo a OpenAI con una API Key privada necesitas un backend seguro. **Firebase Cloud Functions (2.ª generación) requiere Blaze**; una cuenta de ChatGPT no cubre el uso de API. No pongas claves en `public/`, GitHub ni el navegador. La versión de registros, cámara y GPS funciona con Firestore Spark dentro de las cuotas gratuitas.

## 5. Datos anteriores en Storage
Si alguna versión anterior ya subió imágenes a Storage, **esta actualización no las borra automáticamente**. Los registros viejos seguirán visibles como datos; borrar sus filas en esta versión no borra los archivos históricos en Storage. Si deseas eliminarlos, debes revisarlos por separado en Firebase Storage, preservando un respaldo de lo que quieras conservar.
