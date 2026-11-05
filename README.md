# SonoGuard IA · Proyecto integrado para GitHub Pages + Firebase

**Actualizado:** 5 de noviembre de 2026. **No está desplegado.** Este paquete se genera a partir de los archivos originales que compartiste y de la ampliación SonoGuard IA.

## Funciones conservadas

- `public/app.js`, `public/firebase-service.js` y `public/data-model.js` del proyecto original están **intactos**.
- Análisis de 31 bandas, semáforo, mapa, usuarios, administración y CSV de historial local.
- Las reglas originales de `places/{id}` (hospitales, escuelas y demás lugares) y `settings/global` permanecen idénticas en estructura. Se corrigió **únicamente el UID administrador de ejemplo** para que coincida con `public/firebase-config.js`. No se ejecutó ninguna operación en Firebase remoto.
- `public/index.html` solo agrega el botón **📸 Evidencia + IA** dentro de la sesión existente.

## Funciones nuevas

- `public/sonoguard-ia.html` y `sonoguard-ia.js`: perfil, captura de foto, lectura digital de micrófono, GPS opcional, imagen con nombre (completo o protegido), fecha, hora, lugar, contacto de prueba 75830320 y referencia municipal histórica 67123590 (vigencia no verificada).
- Historial privado en `sgProfiles` / `sgEvidence`, fotos en Firebase Storage, tendencias descriptivas, exportación JPG/PDF desde el navegador y análisis con IA mediante una Cloud Function protegida.
- El contacto de prueba abre WhatsApp con un mensaje propuesto; **nunca envía automáticamente ni presenta denuncias reales**.

## Instalación

**Lee `GUIA_PUBLICACION.md` antes de subir a GitHub o desplegar reglas.** La configuración web Firebase viene en `public/firebase-config.js`, pero debes revisar tu Firebase Console. La clave de OpenAI se debe configurar con Firebase Secret Manager y nunca subirla al repositorio.

**Aviso técnico:** dBFS representa nivel digital, no dB SPL; la lectura declarada de otro instrumento tampoco equivale a medición certificada. El nombre de la persona es declarado, no verificado.
