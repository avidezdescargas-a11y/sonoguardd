# SonoGuard IA — panel único y números positivos

## Qué cambió

- La pestaña **Evidencia + IA** se muestra dentro del documento principal, **sin iframe**: no se duplican barras, menús ni el panel al ir y volver.
- El asistente flotante sigue disponible mientras estás autenticado.
- Con calibración existente: el panel principal muestra **dB SPL estimados**, con números positivos.
- Sin calibración: los datos digitales se presentan como **índice relativo visual 0–100 (no dB SPL)** en lectura, bandas, gráfica, historial y controles. El audio interno y los umbrales de Firebase siguen en dBFS para respetar los ajustes.
- Las fotografías de cámara y su historial también muestran el índice visual positivo; en Firestore se conserva la lectura original dBFS para análisis serio y auditoría.
- El sitio standalone `sonoguard-ia.html` sigue disponible por compatibilidad, pero **el botón del panel no lo carga ni usa iframe**.
- No se han modificado colecciones de lugares (`places`) ni los ajustes (`settings/global`), reglas, claves de Firebase ni usuarios. No se han conectado ni cambiado datos de producción.

## Cómo subir desde GitHub web

1. Descarga y **descomprime** el ZIP.
2. Haz copia de seguridad del repositorio y las reglas actuales en Firebase.
3. En GitHub abre el repositorio existente, pestaña **Code** -> **Add file** -> **Upload files**.
4. Arrastra el **contenido** de esta carpeta al repositorio (especialmente `public/` y `.github/workflows/pages.yml`), no la carpeta exterior ni el ZIP.
5. Revisa rutas, confirma con **Commit changes** y en **Actions** comprueba la publicación de GitHub Pages.
6. Recarga con Ctrl+F5. La nueva `public/index.html` ya integra la cámara sin marcos.

Si hay archivos nuevos de backend aún no desplegados, GitHub Pages no despliega funciones o reglas: para usar IA/historial es necesario configurar Firebase (Storage, Cloud Functions, índice y seguridad) por separado, siguiendo la guía incluida. **No hagas un despliegue general de Firebase sin respaldo y revisión de reglas.**

La geolocalización necesita permiso del navegador, las lecturas no son certificadas y la foto de prueba se adjunta manualmente a WhatsApp 75830320.
