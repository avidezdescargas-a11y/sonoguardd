# Conectar la API Key de OpenAI a SonoGuard sin Firebase Cloud Functions

**Este paquete está listo a nivel de código, pero NO está desplegado en tus cuentas.** Tu Firebase actual seguirá siendo `sonoguard-da942` (Authentication + Firestore, no Functions).

## 1. Crea el intermediario gratis en Cloudflare

1. Abre https://dash.cloudflare.com/ y entra en **Workers & Pages**.
2. Selecciona **Create application → Create Worker → Deploy** y asígnale un nombre, por ejemplo `sonoguard-ia-api`.
3. En el Worker publicado, pulsa **Edit code**. Sustituye el ejemplo con el contenido **completo** del archivo `cloudflare-worker/worker.js` y pulsa **Deploy**.
4. Copia la URL pública con forma `https://sonoguard-ia-api.<tu-subdominio>.workers.dev`. Es un ejemplo, no una dirección asignada previamente.

## 2. Guarda la API Key como secreto (nunca en GitHub)

En Cloudflare, entra al Worker → **Settings → Variables and Secrets → Add**. Añade:

- `OPENAI_API_KEY`: tipo **Secret**, valor = tu API Key de OpenAI (`sk-...`). No pegues la clave en este chat ni en `public/`.
- `AUTHORIZED_UID`: tipo **Text**, valor = el mismo UID de administrador que ya figura en `public/firebase-config.js` bajo `appConfig.adminUid`. Se utiliza para impedir que otros usuarios agoten tus créditos.

Pulsa **Deploy** para aplicar los cambios.

## 3. Activa una cuota diaria gratuita con Workers KV

1. En Cloudflare ve a **Storage & Databases → KV → Create a namespace**. Ponle nombre `sonoguard_ia_cupo`.
2. Regresa a **Workers & Pages → tu Worker → Settings → Bindings → Add → KV Namespace**.
3. En **Variable name**, escribe exactamente `AI_QUOTA`; selecciona el namespace `sonoguard_ia_cupo` y pulsa **Deploy**.
4. El Worker tiene un límite *aproximado* de **8 solicitudes de IA por día para la cuenta administradora**. Si falta esta vinculación, no cobrará llamadas de OpenAI y mostrará error de configuración.

**Importante:** Cloudflare KV tiene consistencia eventual y este límite no garantiza detenerse en un dólar exacto, especialmente con solicitudes simultáneas. Evita la recarga automática y revisa los límites de uso en https://platform.openai.com/settings/organization/limits.

## 4. Conecta GitHub Pages (se hace con un archivo de texto)

1. Descomprime este ZIP. Dentro de `public/sonoguard-ai-config.js`, reemplaza:

   `https://REEMPLAZA.workers.dev`

   por la URL de tu Worker copiada en el paso 1. Conserva comillas simples, `https://` y no agregues `/api/ai`.

2. En GitHub, repositorio `sonoguardd` → **Code → Add file → Upload files**; sube el contenido del proyecto descomprimido (no el ZIP cerrado). Verifica que `public/` esté en la raíz.
3. Confirma y mira **Actions**; el workflow publica `public/`.
4. Abre https://avidezdescargas-a11y.github.io/sonoguardd/ y pulsa **Ctrl+F5**.
5. Entra con tu cuenta administradora y abre el icono flotante **✦ IA**. Pregunta `¿Qué es un índice acústico de 0 a 100?`.

## 5. Comprueba el Worker y resuelve errores

Abre **tu propia URL** del Worker seguida de `/health` (ejemplo: `https://sonoguard-ia-api.<tu-subdominio>.workers.dev/health`). Debe responder:

`{"ok":true,"service":"SonoGuard IA","keyConfigured":true,"uidConfigured":true,"quotaConfigured":true}`

- `keyConfigured:false`: falta `OPENAI_API_KEY` en **Secrets**.
- `uidConfigured:false`: falta `AUTHORIZED_UID`.
- `quotaConfigured:false`: falta vincular el KV `AI_QUOTA`.
- `Sesión ... inválida`: comprueba que iniciaste sesión en la versión real de SonoGuard y que `sonoguard-da942` es el proyecto correcto.
- `Reservada al administrador`: comprueba el UID usado en `AUTHORIZED_UID` (no uses el correo).
- `OpenAI ... 429`: saldo o límites insuficientes.
- `No fue posible conectar con Cloudflare`: comprueba la URL y que el Worker esté desplegado.

## 6. ¿Qué queda gratis y qué consume los $5?

- GitHub Pages sirve la interfaz; Firebase Spark sigue como antes para Authentication y Firestore dentro de sus cuotas.
- Cloudflare Workers y Workers KV pueden operar dentro de sus cuotas **Free**, pero revisa los planes.
- Sólo la llamada del Worker a la API OpenAI consume saldo. Se usa **GPT-6 Luna**, 240 tokens máximos de salida, historial de chat corto y acceso restringido al administrador.
- **Las fotos no se suben**: se descargan en el dispositivo. Firestore conserva sólo los datos existentes y los hospitales.
- Esta versión no necesita ejecutar `firebase deploy --only functions` ni activar Blaze.

### Seguridad

Nunca pongas la clave en `sonoguard-ai-config.js`, `firebase-config.js`, `.github` o cualquier archivo `public`. `sonoguard-ai-config.js` almacena **sólo la URL pública del Worker**.
El Worker confirma la firma RS256 de Firebase antes de llamar a OpenAI. No uses el Worker como proxy abierto sin validar el token.
