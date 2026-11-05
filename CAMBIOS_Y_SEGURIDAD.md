# Cambios y seguridad — SonoGuard IA, asistente flotante y guardado automático

## Cambios implementados

1. `public/index.html`: integra el icono `✦ IA` y el diálogo de chat flotante. Visibles en el panel y sobre el módulo cámara dentro del `iframe`; solo cuando haya una sesión iniciada.
2. `public/sonoguard-chat.js` / `.css`: ventana de chat con saludo inicial, preguntas frecuentes, envío a Cloud Functions y cierre. Solo mantiene las últimas respuestas en memoria de esta página.
3. `functions/index.cjs`: añade `chatSonoGuard` como función autenticada de Firebase (30 preguntas por usuario y día; pausa mínima de ocho segundos). Reutiliza el secreto de OpenAI, `store:false`, límite de respuesta y advertencias sobre dBFS y denuncias.
4. `public/sonoguard-ia.js`: después de capturar se envía automáticamente el JPG a descargas y se guarda la foto en Firebase Storage y metadatos en `sgEvidence`; la interfaz muestra un estado de guardado en vivo. Se permite descargar JPG cuando falla la nube.
5. `public/sonoguard-ia.html`: explica ANTES de tomar la foto que esta se guardará automáticamente. Se elimina el botón «Guardar en historial» y su diálogo; el nombre se pide únicamente al preparar una copia para WhatsApp.
6. `firestore.rules`: mantiene exactamente los bloques preexistentes de `places` y `settings/global`; en el esquema **nuevo** de `sgEvidence` admite `ownerName:''` para permitir el guardado previo al nombre. No se permite modificar una evidencia guardada. `sgAiChatUsage` solo es accesible por Admin SDK.
7. `storage.rules`: no cambia; las fotos permanecen privadas para su dueño autenticado, sin URL pública persistente.

## Privacidad y límites

- **Guardado sin segundo permiso** significa que pulsar «Tomar foto» guarda inmediatamente la captura en el historial privado del usuario; no elimina los permisos obligatorios del navegador para cámara/micrófono/geolocalización.
- El guardado se informa previamente y durante la operación; el usuario puede borrar sus fotos desde «Mi historial».
- El nombre completo solicitado para WhatsApp no se guarda ni se envía a OpenAI. Solo aparece en la copia JPG destinada a compartir y en el mensaje prellenado.
- Si el usuario envía datos personales escritos en el chat, esos textos se transmiten al servicio OpenAI para responder. La interfaz recomienda no compartir información sensible. No hay envío de fotografías al modelo.
- Historial y fotos están separados por UID, sin sobreescribir la colección histórica `places` ni `settings/global`.
- WhatsApp abre el contacto de **prueba** +591 75830320; el usuario debe adjuntar manualmente la foto y pulsar enviar. No se remite a una autoridad ni se acusa a nadie automáticamente.
- Firebase Storage, Cloud Functions y OpenAI pueden tener costes; habilita alertas y límites de facturación.

## Despliegue y pruebas

Las pruebas locales comprueban JavaScript, estructura, guardado simulado sin formulario, y el chat flotante. **No representan una prueba de la base Firebase de producción**. Antes de desplegar, respalda las reglas reales y verifica el administrador/UID y las colecciones preexistentes. La implementación de App Check y las restricciones finales de cuota son tareas recomendadas antes de abrir el proyecto al público.


## Corrección automática
- Sin `lectura declarada`, `zona`, `selección de lugares` ni `posible fuente` escritos manualmente.
- Cámara + micrófono dBFS + geolocalización se activan desde «Abrir cámara y sensores»; vista previa en vivo.
- Lugar derivado de GPS y proximidad a lugares ya registrados (solo referencia); botón para ver en Google Maps.
- La captura se bloquea si falta sensor o GPS fresco, y se almacena la precisión reportada.
- Las reglas de las colecciones anteriores `places` y `settings/global` se mantienen.
- Historial previo se puede consultar; nuevos registros se validan con `gpsAccuracyM`.
- No garantiza integridad forense; navegador/ubicación pueden ser manipulados con herramientas especializadas.
