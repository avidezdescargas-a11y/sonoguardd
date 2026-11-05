# SonoGuard IA — conexión con OpenAI mediante Cloudflare Workers Free

**Esta entrega sustituye Firebase Cloud Functions para el chatbot y el análisis.**
Mantiene Firebase Authentication y Cloud Firestore para los perfiles, hospitales y registros sin fotos; no activa plan Blaze.

## Empieza aquí

Lee **CONECTAR_SONOGUARD_OPENAI_SIN_BLAZE.md**.

- `cloudflare-worker/worker.js`: pega el código en un Cloudflare Worker Free.
- En Cloudflare, configura `OPENAI_API_KEY` como **Secret** y `AUTHORIZED_UID` como variable.
- Crea un namespace Workers KV y vincúlalo con nombre **AI_QUOTA**: límite aproximado de 8 llamadas por día.
- `public/sonoguard-ai-config.js`: cambia únicamente la URL del Worker.
- Publica el contenido completo del proyecto en GitHub; `.github/workflows/pages.yml` sirve `public/`.

## Seguridad y costes

La clave **NUNCA** va en `public/` ni en el repositorio. El Worker valida firma, audiencia y vigencia de tokens Firebase.
Sólo permite el UID administrador. Modelo `gpt-6-luna`, máximo 240 tokens de salida por consulta y cuota aproximada de 8 consultas/día con KV.
**KV no es un límite monetario exacto ni transaccional.** Desactiva recarga automática en OpenAI y revisa los límites de consumo.
La IA no recibe fotos, nombres, emails ni coordenadas a través del análisis de evidencias. No envíes datos personales al chatbot.

El código no modifica ni borra ningún registro remoto de Firestore. Se deben conservar las reglas actuales que ya permiten el historial.
