# Cambios de SonoGuard IA · Versión sin fotos en la nube

- **Foto**: se crea desde la cámara en vivo y se ofrece como JPG descargable; no se sube a Firebase Storage ni se guarda como base64 en Firestore.
- **Ubicación**: intenta dos métodos automáticos del navegador y abre Google Maps cuando hay coordenadas. Si falla o está bloqueada, el registro indica «Ubicación no disponible».
- **Micrófono**: utiliza lectura automática y la muestra en un índice positivo /100 (sin equivalencia a dB SPL). Si falla o se deniega, la foto puede tomarse y el registro dice «Sin lectura de micrófono».
- **Historial**: muestra solo lectura, fecha, hora y coordenadas cuando existen, con botones «Ver datos», «Explicar con IA» y «Eliminar registro»; no muestra ni descarga imágenes antiguas.
- **Base de datos**: solo metadatos en `sgEvidence`, asociados al UID; sin fotos, rutas ni URLs. Conserva registros anteriores y las colecciones `places` y `settings/global`.
- **Lectura de historial**: consulta por dueño `ownerUid` y ordena localmente, sin exigir el índice compuesto antiguo. Publicar las reglas actualizadas en Firebase es indispensable.
- **Compartir**: al abrir WhatsApp de prueba al 75830320 se solicita nombre completo, se descarga una versión con nombre y el usuario debe adjuntarla manualmente desde Descargas y confirmar el envío.
- **Modo gratuito**: Cloud Storage no se usa ni se despliega. Firestore puede operar dentro de Spark/cuota gratuita. El asistente que llama a OpenAI sigue necesitando un backend seguro y puede generar costos; la versión de cámara e historial funciona independientemente de eso.

## Limitaciones importantes
No podemos eludir permisos del navegador para cámara, micrófono o ubicación. Una ubicación no disponible no puede inferirse legítimamente. El sensor del micrófono sin calibración no produce dB SPL ambiental certificado. El historial registra datos del dispositivo, no pruebas a prueba de manipulación. Si una versión anterior guardó fotos en Firebase Storage, esas imágenes **no se eliminan automáticamente** con esta actualización.
