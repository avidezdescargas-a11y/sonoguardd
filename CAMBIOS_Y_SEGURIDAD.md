# Cambios en esta revisión

- `public/index.html`: el antiguo enlace externo a IA es ahora un botón que abre un panel integrado con `iframe` **del mismo origen**; el panel principal y su sesión siguen presentes.
- `public/sonoguard-shell.js`: nuevo controlador de panel; al cerrar IA, libera cámara y micrófono vía mensaje del mismo origen.
- `public/sonoguard-ia.html` y `.css`: cámara en vivo y superposición visible. Se elimina el segundo login y el input de subida de imágenes.
- `public/sonoguard-ia.js`: captura un frame real del video; conserva la medición, hora (America/La_Paz), lugar; nombre solo bajo consentimiento al preparar WhatsApp o guardar historial. Genera JPG local y enlace de prueba; guardar en Firebase es opcional. Mantiene asistente IA tras guardar.
- `firestore.rules` y `storage.rules`: se conservan sin cambios respecto del ZIP integrado anterior, incluidas las rutas actuales `places`/`settings/global`. No se despliegan automáticamente.
- `.github/workflows/pages.yml`: sin cambios. Continúa publicando solo `public/`.

**Privacidad:** la cámara y el micrófono solo se activan por acción del usuario; no se transmite el video en tiempo real ni se sube una foto automáticamente. Al elegir WhatsApp el usuario puede descargar su foto y decidir adjuntarla. Se requiere el consentimiento explícito para guardar datos en la nube. Una lectura dBFS no equivale a dB SPL ni certifica una infracción.
