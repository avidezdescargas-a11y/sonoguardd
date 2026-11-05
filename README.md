# SonoGuard IA — avisos informativos de ruido, asistente flotante y foto automática

Versión integrada con el SonoGuard original. Publicación: GitHub Pages para la interfaz; Firebase Authentication, Firestore, Storage y Cloud Functions para funciones privadas y OpenAI.

## Qué cambió en esta versión

- **IA flotante en todo el panel** (esquina inferior derecha): al tocar el icono `✦ IA` se abre el chat con «¡Hola! Soy SonoGuard IA. ¿En qué puedo ayudarte?». Se usa la sesión actual de Firebase; **no hay segundo login ni es necesario tomar una foto para conversar**.
- **Cámara en vivo** en `📸 Evidencia + IA`. Fotograma con hora, lugar y lectura acústica (dBFS digital o SPL declarado). No admite subir fotos desde la galería.
- **Guardado automático al pulsar «Tomar foto ahora»**, sin diálogo de confirmación extra (el navegador aún puede consultar dónde guardar las descargas). Se ve el aviso «Guardando…» y después «Foto guardada» o un error. La imagen se guarda **privadamente en Firebase Storage**, y el registro en `sgEvidence`. Se puede eliminar en «Mi historial». Antes de pulsar el botón, la pantalla advierte el guardado. Si Firebase falla, la imagen permanece visible y se puede descargar como JPG.
- **Nombre completo solo al compartir**: al pulsar la foto o el botón de WhatsApp se pide nombre y apellidos, se descarga una **copia** de la imagen con el nombre y se abre una conversación con un **aviso informativo de prueba** al **75830320**, que pide una revisión de la zona si procede. El usuario adjunta el JPG manualmente y decide si enviar; nada se envía automáticamente. La foto del historial conserva el campo `ownerName` vacío hasta ese momento; la copia para WhatsApp no modifica el original guardado.
- Mantiene analizador, mapa, hospitales, escuelas, lugares, umbrales, inicio de sesión y roles originales.

**Permisos:** la aplicación no muestra un consentimiento adicional de guardado cada vez, pero el navegador debe autorizar el acceso a cámara y micrófono, y a geolocalización si se solicita. El navegador o dispositivo también podría pedir confirmación para descargar archivos. No se pueden eludir esos permisos.

**Alcance:** Es un prototipo ciudadano para informar problemas de ruido, sin trámites oficiales ni promesas de visita de inspección. Los datos dBFS **no** son decibelios ambientales certificados. El contacto 75830320 es de prueba. El teléfono municipal que figura en la plantilla es una referencia antigua sin vigencia verificada.

## Cómo publicar

Lee **`GUIA_PUBLICACION.md`** antes de subir el contenido a tu repositorio GitHub.

**IMPORTANTE:** GitHub Pages publica la interfaz, pero no las reglas de Firestore/Storage ni las Cloud Functions. Sin configurar Firebase y el secreto `OPENAI_API_KEY`, la IA flotante no podrá responder y el guardado automático en nube fallará (la foto quedará disponible para descargar manualmente). La clave privada de OpenAI nunca va en `public/` ni en GitHub.

No hemos conectado ni modificado los documentos de tu proyecto Firebase real. La actualización deja **sin cambios** los permisos existentes en `places/` y `settings/global` **dentro de los archivos de este paquete**; compara las reglas con las publicadas antes de desplegarlas. Respalda tu repositorio y Firestore antes de cambiar reglas.


## Versión: captura totalmente automática (micrófono y GPS)
No hay entrada manual de dB ni de zona. Al abrir la cámara se solicitan los permisos de cámara, micrófono y ubicación del navegador. Solo se habilita «Tomar foto» si hay lectura de micrófono reciente y posición GPS de menos de 45 segundos con precisión declarada de hasta 1 km. Los datos se superponen en la foto; Google Maps se abre con la posición informada por el dispositivo. Si está dentro del radio de un lugar registrado, la zona se rotula «Cerca de…» (no afirma que ese lugar produjo el ruido). No se pueden garantizar datos antifalsificación mediante un navegador: la aplicación no es un sonómetro certificado.
