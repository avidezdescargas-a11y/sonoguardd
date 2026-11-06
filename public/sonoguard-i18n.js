/**
 * SonoGuard ES / EN. Local-only bilingual UI: no translation API or extra charges.
 * Text changes are cosmetic; Firestore data, acoustic values and place names remain untouched.
 */
const translated = {
  "TU SONIDO. TU COMUNIDAD.": "YOUR SOUND. YOUR COMMUNITY.",
  "Que suene bien.": "Let it sound good.",
  "Que se viva mejor.": "Live better.",
  "Conoce tu sonido en tiempo real y cuida los lugares que necesitan tranquilidad.": "Discover your sound in real time and protect places that need peace and quiet.",
  "MONITOREO ✦ FRECUENCIAS ✦ ZONAS SENSIBLES": "MONITORING ✦ FREQUENCIES ✦ SENSITIVE AREAS",
  "✦ Un espacio para escuchar mejor": "✦ A better place to listen",
  "Bienvenido a tu panel": "Welcome to your dashboard",
  "Entra con tu correo y contraseña.": "Sign in with your email and password.",
  "Correo electrónico": "Email address",
  "Contraseña": "Password",
  "Entrar a SonoGuard ↗": "Sign in to SonoGuard ↗",
  "Crear cuenta": "Create account",
  "Olvidé mi contraseña": "Forgot my password",
  "Conectando…": "Connecting…",
  "El micrófono se activa solo cuando lo autorizas. El audio se procesa en tu dispositivo, sin grabarse.": "The microphone is activated only with your permission. Audio is processed on your device and is not recorded.",
  "ESCUCHA TU ENTORNO": "LISTEN TO YOUR ENVIRONMENT",
  "Cargando cuenta…": "Loading account…",
  "Salir ↗": "Sign out ↗",
  "● SIN CONEXIÓN · MICRÓFONO PC": "● DISCONNECTED · COMPUTER MICROPHONE",
  "✦ PROYECTO SONOGUARD · La Paz": "✦ SONOGUARD PROJECT · La Paz",
  "SONIDO CON CONCIENCIA ✦": "SOUND WITH A PURPOSE ✦",
  "Tu sonido en vivo. Tu comunidad en el mapa. Todo bajo control.": "Your live sound. Your community on the map. Everything in view.",
  "▶ Iniciar micrófono": "▶ Start microphone",
  "Detener": "Stop",
  "Probar demo": "Try demo",
  "📸 Evidencia + IA": "📸 Reports + AI",
  "↩ Volver a SonoGuard": "↩ Back to SonoGuard",
  "● Normal ≤80 dB": "● Normal ≤80 dB",
  "● Medio >80 y <90 dB": "● Moderate >80 and <90 dB",
  "● Alto/excedido ≥90 dB": "● High / exceeded ≥90 dB",
  "Listo para empezar. Autoriza el micrófono al iniciar. El audio se analiza en tu equipo y no se graba ni se envía.": "Ready to start. Allow microphone access to begin. Audio is analyzed locally; it is neither recorded nor sent.",
  "Nivel actual": "Current level",
  "índice /100": "index /100",
  "— índice /100": "— index /100",
  "Esperando medición": "Waiting for a measurement",
  "Índice relativo (0–100), no dB ambientales. Para dB SPL estimados se requiere calibración.": "Relative index (0–100), not environmental decibels. Calibration is required to estimate dB SPL.",
  "MÁXIMO": "MAXIMUM",
  "PROM. ENERGÉTICO": "ENERGY AVERAGE",
  "TIEMPO": "TIME",
  "GRAPHIC ANALYZER · 31 BANDAS": "GRAPHIC ANALYZER · 31 BANDS",
  "Espectro de frecuencias": "Frequency spectrum",
  "RTA · ⅓ OCTAVA · índice relativo /100": "RTA · ⅓ OCTAVE · relative index /100",
  "Selecciona una banda para inspeccionar su nivel": "Select a band to inspect its level",
  "Banda más fuerte: resaltada en amarillo": "Strongest band: highlighted in yellow",
  "SUBGRAVES": "SUB-BASS",
  "GRAVES": "BASS",
  "MEDIOS": "MIDRANGE",
  "PRESENCIA": "PRESENCE",
  "AGUDOS": "TREBLE",
  "Cada columna corresponde a una frecuencia central. Pulsa su etiqueta para ver el nivel. En celular, desliza lateralmente para recorrer las 31 bandas.": "Each column represents a center frequency. Tap its label to see the level. On mobile, swipe sideways to view all 31 bands.",
  ". Los avisos sugieren revisar el ecualizador; no modifican la salida de audio.": ". Alerts suggest checking the equalizer; they do not change audio output.",
  "ASÍ CAMBIA TU SONIDO": "HOW YOUR SOUND CHANGES",
  "Evolución del nivel": "Level over time",
  "Últimos 30 segundos · escala vertical automática": "Last 30 seconds · automatic vertical scale",
  "ÚLTIMA LECTURA": "LATEST READING",
  "Nivel captado por el micrófono": "Microphone reading",
  "Inicia el monitoreo para ver la evolución": "Start monitoring to see the trend",
  "Mapa de zonas sensibles": "Map of sensitive areas",
  "Haz clic para ubicar el punto de medición o registrar un lugar. Los círculos son referencias preventivas, no límites legales.": "Click to set the measurement point or register a place. The circles are precautionary reference areas, not legal boundaries.",
  "Usar mi ubicación": "Use my location",
  "Ubicar medición": "Set measurement point",
  "Añadir lugar sensible": "Add sensitive place",
  "✦ Administrar zonas sensibles": "✦ Manage sensitive areas",
  "Tipo": "Type",
  "Hospital": "Hospital",
  "Hogar de adultos mayores": "Senior care home",
  "Escuela": "School",
  "Salón de eventos": "Event venue",
  "Otro": "Other",
  "Radio preventivo (m)": "Precautionary radius (m)",
  "Latitud": "Latitude",
  "Longitud": "Longitude",
  "Límite de ruido del lugar (dB)": "Noise limit for this place (dB)",
  "Referencia, horario o condición": "Reference, schedule or condition",
  "Guardar lugar": "Save place",
  "Guardar cambios": "Save changes",
  "Importar zonas anteriores de este equipo": "Import previous areas from this device",
  "Cancelar edición": "Cancel editing",
  "Lugares y límites registrados por administración, compartidos con todos los usuarios. El nivel en otro edificio no se mide desde aquí. Mapa © OpenStreetMap.": "Places and limits registered by administrators are shared with all users. This microphone cannot measure sound inside another building. Map © OpenStreetMap.",
  "Centro de alertas": "Alert center",
  "Las alertas aparecerán al mantener un exceso durante el tiempo configurado.": "Alerts appear when an excessive level persists for the configured period.",
  "Ajustes de monitoreo": "Monitoring settings",
  "· control del administrador": "· administrator control",
  "Advertencia (escala actual)": "Warning (current scale)",
  "Exceso (escala actual)": "Excess (current scale)",
  "Umbral espectral (índice relativo 0–100)": "Spectrum threshold (relative index 0–100)",
  "Persistencia (segundos)": "Duration (seconds)",
  "Rangos del semáforo ambiental: normal hasta 80 dB; medio por encima de 80 y por debajo de 90 dB; alto/excedido desde 90 dB. Los límites de cada lugar se muestran aparte. Sin calibración se muestra un índice relativo positivo de 0 a 100, no decibelios ambientales.": "Environmental indicator ranges: normal up to 80 dB, moderate above 80 and below 90 dB, and high/exceeded at 90 dB and above. Place limits are shown separately. Without calibration, a positive 0–100 relative index is shown, not environmental decibels.",
  "Guardar ajustes para todos": "Save settings for everyone",
  "Calibrar este micrófono con sonómetro": "Calibrate this microphone using a sound level meter",
  "En un sonido estable, coloca el sonómetro junto al micrófono. Introduce su lectura y pulsa calibrar durante una medición real. Una referencia no reemplaza una calibración profesional.": "For a steady sound, place the sound level meter next to the microphone. Enter its reading and select Calibrate during a real measurement. One reference reading does not replace professional calibration.",
  "Lectura del sonómetro (dB SPL)": "Sound level meter reading (dB SPL)",
  "Calibrar": "Calibrate",
  "Quitar calibración": "Remove calibration",
  "Historial de eventos": "Event history",
  "Exportar CSV": "Export CSV",
  "Borrar historial": "Clear history",
  "Historial de este equipo. Zonas y ajustes compartidos desde administración. Las sesiones demo se identifican por separado.": "History from this device. Areas and settings are shared by administrators. Demo sessions are labeled separately.",
  "Fecha y hora · Bolivia": "Date and time · Bolivia",
  "Origen": ":Source:",
  "Nivel": "Level",
  "Evento": "Event",
  "SONOGUARD · Prototipo académico · Micrófono PC ahora, integración Arduino en la siguiente etapa.": "SONOGUARD · Academic prototype · Computer microphone now; Arduino integration planned for the next stage.",
  "📸 Evidencia acústica": "📸 Acoustic report",
  "← Volver al panel acústico": "← Back to sound dashboard",
  "Abre SonoGuard con tu sesión": "Open SonoGuard with your account",
  "Este módulo comparte la sesión de Firebase del panel principal. No necesitas iniciar sesión una segunda vez.": "This module shares the Firebase session of the main dashboard. You do not need to sign in again.",
  "Ir a SonoGuard e iniciar sesión": "Go to SonoGuard and sign in",
  "Integrado en tu cuenta actual": "Integrated with your current account",
  "Informar un problema de ruido": "Report a noise problem",
  "Abre la cámara y SonoGuard activará el micrófono y solicitará el GPS. Cuando la cámara esté lista, toma la foto: se descargará al dispositivo. En Firebase se guardarán solo los datos; si falla la ubicación se marcará como no disponible. El nombre se solicita únicamente si decides compartir el aviso por WhatsApp.": "Open the camera and SonoGuard will activate the microphone and request your location. Once the camera is ready, take a picture: it will be downloaded to your device. Only measurement data is saved to Firebase; if location fails, it will be marked unavailable. Your name is requested only if you decide to share via WhatsApp.",
  "Sesión activa": "Signed in",
  "1. Cámara en vivo para registrar la zona": "1. Live camera to record the area",
  "Activa la cámara para comenzar": "Turn on the camera to start",
  "Solo se captura una foto cuando pulsas «Tomar foto ahora».": "A photo is taken only when you press “Take photo now”.",
  "SONOGUARD IA · EN VIVO": "SONOGUARD AI · LIVE",
  "Micrófono digital · no certificado": "Digital microphone · not certified",
  "Ubicación GPS: esperando…": "GPS location: waiting…",
  "📷 Abrir cámara y sensores": "📷 Open camera and sensors",
  "Detener cámara": "Stop camera",
  "Al tomar la foto, se descarga un JPG en tu dispositivo. Firebase solo guarda los datos de la medición, nunca imágenes. La cámara requiere permiso; el micrófono y la ubicación también lo requieren para obtener sus datos. Si no responden, se indicará claramente y podrás fotografiar igualmente. No se introducen datos manuales.": "When you take a photo, a JPG is downloaded to your device. Firebase saves only measurement data, never images. The camera requires permission; the microphone and location also need permission to provide data. If unavailable, this is clearly indicated and you can still take a photo. No manual measurements are entered.",
  "📸 Tomar foto ahora": "📸 Take photo now",
  "Se descargará la fotografía al dispositivo. Firebase guardará solo fecha, lectura y ubicación si está disponible. No se sube la imagen.": "The photo will be downloaded to your device. Firebase will store only the date, reading and available location. The image is never uploaded.",
  "2. Datos automáticos del dispositivo": "2. Automatic device data",
  "Micrófono en vivo": "Live microphone",
  "Índice positivo de nivel digital, sin equivalencia a dB SPL certificado.": "Positive digital level index, not equivalent to certified dB SPL.",
  "Micrófono pendiente.": "Microphone pending.",
  "📍 Ubicación GPS automática": "📍 Automatic GPS location",
  "Esperando posición del dispositivo…": "Waiting for device location…",
  "Ver punto en Google Maps ↗": "View location in Google Maps ↗",
  "↻ Reintentar sensores": "↻ Retry sensors",
  "La ubicación viene del servicio de geolocalización del navegador y se abre en Google Maps. Si estás cerca de un lugar registrado en SonoGuard, se indica como referencia aproximada. No puedes introducir ni cambiar manualmente la lectura o las coordenadas.": "Location comes from the browser's geolocation service and opens in Google Maps. If you are near a place registered in SonoGuard, it is shown as an approximate reference. You cannot manually enter or change readings or coordinates.",
  "La ubicación y el micrófono dependen de los permisos y servicios del dispositivo. Puedes fotografiar aunque alguno falle: se indicará «Ubicación no disponible» o «Sin lectura de micrófono» en vez de inventar datos. No es evidencia certificada.": "Location and microphone depend on device permissions and services. You may still take a photo if one fails: “Location unavailable” or “No microphone reading” will appear instead of fabricated data. This is not certified evidence.",
  "3. Foto informativa de la zona": "3. Informational photo of the area",
  "WhatsApp no permite adjuntarla automáticamente mediante un enlace a un número específico": "WhatsApp cannot automatically attach it using a link to a specific number",
  "Descargar foto JPG": "Download JPG photo",
  "Informar problema por WhatsApp (prueba)": "Report issue via WhatsApp (test)",
  "Reporte PDF": "PDF report",
  "Analizar con IA": "Analyze with AI",
  "Pregunta a la IA sobre esta medición (sin datos personales)": "Ask AI about this measurement (no personal data)",
  "Preguntar a SonoGuard IA": "Ask SonoGuard AI",
  "Contacto para avisos de PRUEBA: 75830320": "TEST report contact: 75830320",
  "Referencia municipal publicada en 2022": ":Municipal reference published in 2022:",
  "(vigencia no confirmada).": " (current status unverified).",
  "Información municipal": "Municipal information",
  "AVISO INFORMATIVO DE PRUEBA · MEDICIÓN NO CERTIFICADA · NO ENVÍA MENSAJES NI SOLICITA VISITAS AUTOMÁTICAMENTE.": "TEST INFORMATIONAL REPORT · NON-CERTIFIED MEASUREMENT · DOES NOT AUTOMATICALLY SEND MESSAGES OR REQUEST VISITS.",
  "4. Mis registros informativos privados en Firebase": "4. My private informational records in Firebase",
  "Aquí se guarda únicamente el historial de datos: fecha, hora, lectura y ubicación disponible. No se suben fotos a Firebase. Puedes consultar y borrar tus registros. Los hospitales y lugares anteriores no se modifican.": "Only data history is stored here: date, time, reading and available location. Photos are not uploaded to Firebase. You can view and delete your records. Existing hospitals and places are not changed.",
  "Actualizar": "Refresh",
  "Aún no hay registros de datos.": "No data records yet.",
  "5. Tendencias": "5. Trends",
  "Valores de tus registros guardados (separados por escala, sin equivalencia legal).": "Values from your saved records (separated by scale; no legal equivalence).",
  "Guarda varias mediciones para ver tendencias.": "Save several readings to view trends.",
  "Registros administrativos · últimos datos": "Administrative records · latest data",
  "Solo metadatos; las fotos de otras cuentas siguen siendo privadas.": "Metadata only; photos from other accounts remain private.",
  "Nombre completo de quien informa": "Full name of person reporting",
  "Tu nombre aparecerá en la copia que vas a compartir y en el mensaje de prueba, no se añadirá al historial ya guardado.": "Your name will appear on the copy you share and in the test message. It will not be added to your previously saved history.",
  "Nombre y apellidos completos": "Full first and last name",
  "Acepto que mi nombre completo aparezca en la foto y en el mensaje que decida compartir.": "I agree to include my full name in the photo and message I choose to share.",
  "Continuar": "Continue",
  "Cancelar": "Cancel",
  "El 75830320 es un contacto de prueba, no un canal oficial de atención. WhatsApp prepara un aviso informativo: revísalo, adjunta la foto desde Descargas y decide si deseas enviarlo.": "75830320 is a test contact, not an official service channel. WhatsApp prepares an informational message: review it, attach your photo from Downloads and decide whether to send it.",
  "✦ SonoGuard IA": "✦ SonoGuard AI",
  "Tu asistente acústico · Proyecto de prueba": "Your sound assistant · Test project",
  "Escribe tu consulta": "Type your question",
  "Enviar": "Send",
  "No compartas nombres, fotografías ni direcciones personales. La IA es orientativa, no una autoridad.": "Do not share names, photos or personal addresses. AI provides general guidance; it is not an authority.",
  "SONOGUARD IA · Prototipo académico · Solo se guardan datos en Firebase; las fotos se descargan al dispositivo · No sustituye inspección oficial.": "SONOGUARD AI · Academic prototype · Only data is saved to Firebase; photos are downloaded to your device · Not a substitute for an official inspection.",
  "SonoGuard | Monitoreo acústico": "SonoGuard | Acoustic monitoring",
  "SonoGuard · Cámara y evidencia IA": "SonoGuard · Camera and AI reports",
  "Cámara en vivo · Proyecto ciudadano La Paz": "Live camera · La Paz community project",
  "← Panel principal": "← Main dashboard",
  "Tu contraseña": "Your password",
  "tu@correo.com": "you@email.com",
  "Nombre del hospital, escuela o salón": "Name of hospital, school or venue",
  "Ej.: 55": "E.g., 55",
  "Ej.: exterior, horario nocturno": "E.g., outdoors, evening hours",
  "Analizador de 31 bandas. Desliza horizontalmente en celular": "31-band analyzer. Swipe horizontally on mobile",
  "Índice relativo positivo por frecuencia": "Positive relative index by frequency",
  "Evolución del sonido durante los últimos 30 segundos, con escala automática": "Sound over the past 30 seconds, with automatic scale",
  "Cámara y evidencias SonoGuard IA": "SonoGuard AI camera and reports",
  "Vista previa de la cámara en tiempo real": "Live camera preview",
  "Pulsa para preparar el envío al contacto de prueba": "Click to prepare sharing with the test contact",
  "Foto de evidencia acústica con datos de la medición": "Acoustic report photo with measurement data",
  "Ej. ¿Qué significa esta lectura?": "E.g. What does this reading mean?",
  "Ej. María Pérez Mamani": "E.g. Maria Perez Mamani",
  "Hablar con SonoGuard IA": "Talk to SonoGuard AI",
  "Abrir asistente SonoGuard IA": "Open SonoGuard AI assistant",
  "Asistente SonoGuard IA": "SonoGuard AI assistant",
  "Cerrar asistente": "Close assistant",
  "¿Cómo puedo ayudarte?": "How can I help you?",
  "Abre la cámara para comenzar": "Open the camera to begin",
  "No hay una lectura reciente del micrófono. Activa sus permisos y espera el valor en vivo.": "No recent microphone reading. Allow access and wait for a live value.",
  "Sin lectura de micrófono": "No microphone reading",
  "Ubicación no disponible": "Location unavailable",
  "Sin ubicación": "No location",
  "Sin alertas sostenidas. Monitoreo activo.": "No sustained alerts. Monitoring active.",
  "Sin medición activa.": "No active measurement.",
  "No se pudo iniciar: ": "Could not start: ",
  "Alto / excedido": "High / exceeded",
  "Medio": "Moderate",
  "Normal": "Normal",
  "Micrófono": "Microphone",
  "Demo": "Demo",
  "● EN VIVO · MICRÓFONO PC": "● LIVE · COMPUTER MICROPHONE",
  "● DEMO · DATOS SIMULADOS": "● DEMO · SIMULATED DATA",
  "● MONITOREO DETENIDO": "● MONITORING STOPPED",
  "Monitoreo detenido": "Monitoring stopped",
  "Monitoreo detenido. Micrófono liberado.": "Monitoring stopped. Microphone released.",
  "Tu sonido aparecerá aquí": "Your sound will appear here",
  "Ahora": "Now",
  "Inicio del monitoreo": "Monitoring started",
  "Fin del monitoreo": "Monitoring ended",
  "Cambio de estado": "Status changed",
  "Lectura periódica": "Periodic reading",
  "BANDA": "BAND",
  "sin señal": "no signal",
  "SOBRE UMBRAL · revisar banda": "ABOVE THRESHOLD · check band",
  "bajo el umbral": "below threshold",
  "mayor nivel": "highest level",
  "índice relativo espectral /100": "relative spectral index /100",
  "Índice visual digital (0–100)": "Digital visual index (0–100)",
  "No es dB SPL ambiental": "Not environmental dB SPL",
  "Valores orientativos": "Indicative values",
  "● Índice visual digital (0–100)": "● Digital visual index (0–100)",
  "● No es dB SPL ambiental": "● Not environmental dB SPL",
  "● Valores orientativos": "● Indicative values",
  "● Normal ≤80 dB SPL est.": "● Normal ≤80 dB SPL est.",
  "● Alto ≥90 dB": "● High ≥90 dB",
  "Índice digital positivo de 0 a 100, sin equivalencia a dB SPL. Calibra con un sonómetro para estimar decibelios ambientales.": "Positive digital index from 0 to 100, not equivalent to dB SPL. Calibrate using a sound level meter to estimate environmental decibels.",
  "Estimación con referencia de sonómetro. No es una medición certificada.": "Estimate using a reference sound level meter. This is not a certified measurement.",
  "Todavía no hay eventos.": "No events yet.",
  "No se pudo guardar en este navegador. Exporta el historial para conservarlo.": "Could not save in this browser. Export the history to preserve it.",
  "Ajusta los umbrales: advertencia debe ser menor que exceso.": "Adjust thresholds: warning must be lower than excess.",
  "Nivel alto / excedido. Reduce el volumen y vuelve a medir.": "High/exceeded level. Reduce the volume and measure again.",
  "Modo demo: valores simulados, no son mediciones. Detén la demo para usar tu micrófono.": "Demo mode: simulated values, not measurements. Stop the demo to use your microphone.",
  "Micrófono activo. Audio procesado localmente, sin grabación. ": "Microphone active. Audio processed locally, without recording. ",
  "Calibra con sonómetro para estimar dB ambientales.": "Calibrate using a sound level meter to estimate environmental dB.",
  "Calibración aplicada; resultados estimados.": "Calibration applied; results are estimates.",
  "Este navegador no permite acceder al micrófono. Abre la página en Chrome o Edge mediante HTTPS.": "This browser cannot access the microphone. Open the site in Chrome or Edge over HTTPS.",
  "Revisa los permisos del micrófono.": "Check microphone permissions.",
  "Inicia el micrófono y usa un sonido estable antes de calibrar.": "Start the microphone and use a steady sound before calibrating.",
  "Introduce una referencia de 20 a 140 dB SPL.": "Enter a reference between 20 and 140 dB SPL.",
  "Referencia guardada. Se muestran dB SPL estimados; mantén el mismo micrófono y ganancia del sistema.": "Reference saved. Estimated dB SPL is shown; keep the same microphone and system gain.",
  "Calibración eliminada. Ahora se muestra el índice digital relativo de 0 a 100.": "Calibration removed. The 0–100 digital relative index is now shown.",
  "¿Borrar el historial guardado en este navegador?": "Clear history saved in this browser?",
  "Punto de medición": "Measurement point",
  "Límite": ":Limit:",
  "pendiente de definir": "not yet defined",
  "Medición": ":Measurement:",
  "Ubica primero tu punto de medición.": "First set your measurement point.",
  "m desde la medición ·": "m from measurement ·",
  "Radio preventivo": ":Precautionary radius:",
  "Editar": "Edit",
  "Eliminar": "Delete",
  "¿Eliminar la zona ": "Delete the area ",
  "para todos los usuarios?": "for all users?",
  "Zona eliminada.": "Area deleted.",
  "Ubicación seleccionada. Escribe el nombre y pulsa Guardar lugar.": "Location selected. Enter a name and select Save place.",
  "No se pudo cargar el mapa. Revisa tu conexión. Puedes registrar lugares por coordenadas.": "Could not load the map. Check your connection. You can register places using coordinates.",
  "✦ ADMIN ·": "✦ ADMIN ·",
  "● USUARIO ·": "● USER ·",
  "✦ Tu panel de administración está activo. Puedes crear, editar y eliminar zonas sensibles y guardar los ajustes generales.": "✦ Your administration dashboard is active. You can add, edit and delete sensitive areas and save shared settings.",
  "✦ Tu espacio de monitoreo. Puedes medir sonido y consultar el mapa; las zonas y los ajustes son gestionados por administración.": "✦ Your monitoring space. You can measure sound and view the map; administrators manage areas and settings.",
  "✓ Ajustes guardados para todos los usuarios.": "✓ Settings saved for all users.",
  "Configuración compartida actualizada.": "Shared settings updated.",
  "Crea tu cuenta": "Create your account",
  "Crear cuenta y entrar ↗": "Create account and sign in ↗",
  "Ya tengo una cuenta": "I already have an account",
  "Entra con tu cuenta o crea una nueva.": "Sign in or create an account.",
  "Cargando las zonas y los permisos…": "Loading areas and permissions…",
  "Sesión iniciada. Puedes comenzar el monitoreo.": "Signed in. You can start monitoring.",
  "Fecha Bolivia": "Bolivia date",
  "SIN CONEXIÓN": "DISCONNECTED",
  "Inicia el monitoreo": "Start monitoring",
  "Procesando…": "Processing…",
  "No se pudo crear la imagen.": "Could not create the image.",
  "No se pudo codificar la imagen.": "Could not encode the image.",
  "No existe la foto original de esta sesión.": "The original photo is not available in this session.",
  "Descargando foto al dispositivo… Guardando únicamente fecha, ubicación y lectura en Firestore (sin imagen)…": "Downloading photo to device… Saving only date, location and reading to Firestore (no image)…",
  "✓ Foto descargada. Solo datos guardados en Firestore; NO se subió ninguna imagen.": "✓ Photo downloaded. Only data saved to Firestore; NO image was uploaded.",
  "Foto lista para descargar, pero el registro de datos no se guardó en Firestore. Usa «Descargar foto JPG» y revisa las reglas.": "Photo ready to download, but the data record was not saved to Firestore. Select “Download JPG photo” and check the rules.",
  "Datos guardados en Firestore. La foto queda solo en tu dispositivo.": "Data saved to Firestore. The photo stays only on your device.",
  "Primero toma una foto o selecciona una evidencia.": "First take a photo or select an existing record.",
  "La fotografía ya no está abierta en esta sesión. Toma otra para compartir.": "The photo is no longer open in this session. Take another to share.",
  "Escribe nombre y apellido completos.": "Enter your full first and last name.",
  "Confirma el uso de tu nombre en la imagen que compartirás.": "Confirm use of your name in the image you will share.",
  "Preparar aviso y abrir WhatsApp": "Prepare report and open WhatsApp",
  "Aviso informativo preparado. Foto con tu nombre descargada y WhatsApp de PRUEBA abierto: adjunta la imagen, revisa el texto y decide si deseas enviarlo.": "Information report ready. Photo with your name downloaded and TEST WhatsApp opened: attach the photo, review the text and decide whether to send it.",
  "No se pudo preparar la imagen: ": "Could not prepare the image: ",
  "Para analizar esta lectura, primero deben guardarse los datos del registro en Firestore.": "To analyze this reading, the record must first be saved to Firestore.",
  "Este registro no tiene lectura del micrófono para analizar. Prueba de nuevo con el permiso activado.": "This record has no microphone reading to analyze. Try again with microphone permission enabled.",
  "Sin respuesta": "No response",
  "No hay lectura de micrófono para analizar con IA.": "No microphone reading available for AI analysis.",
  "IA no disponible: ": "AI unavailable: ",
  "No se pudo eliminar: ": "Could not delete: ",
  "No se pudo leer Firestore: publica las reglas actualizadas en tu proyecto y verifica que estés conectado.": "Could not read Firestore: publish the updated rules in your project and verify you are signed in.",
  "No se pudo cargar el historial: ": "Could not load history: ",
  "Error al cargar SonoGuard IA: ": "Error loading SonoGuard AI: ",
  "Cerca de": "Near",
  "(GPS aprox.)": "(approx. GPS)",
  "Punto GPS": "GPS point",
  "Lugar: ": "Place: ",
  "Lugar: ubicación no disponible (se puede fotografiar)": "Place: location unavailable (you can still take a photo)",
  "Ubicación no disponible; puedes tomar la foto.": "Location unavailable; you can still take a photo.",
  "precisión reportada ±": "reported accuracy ±",
  "Ubicación del navegador poco precisa o antigua": "Browser location inaccurate or outdated",
  "Puedes tomar la foto sin ubicación.": "You can take a photo without location.",
  "Buscando ubicación del navegador. La cámara puede funcionar sin GPS.": "Getting browser location. The camera can work without GPS.",
  "Índice relativo de micrófono (no dB SPL)": "Relative microphone index (not dB SPL)",
  "Esperando lectura digital del micrófono": "Waiting for digital microphone reading",
  "Lectura automática desde el micrófono del dispositivo.": "Automatic reading from the device microphone.",
  "Esperando audio del micrófono…": "Waiting for microphone audio…",
  "Micrófono no iniciado o permiso pendiente.": "Microphone not started or permission pending.",
  "Primero abre la cámara y espera la imagen en vivo.": "First open the camera and wait for live video.",
  "Capturar sin valor de ruido: el micrófono no está disponible. No se inventarán dB.": "Capture without a noise reading: the microphone is unavailable. No dB values will be fabricated.",
  "Capturar con lectura de micrófono y ubicación.": "Capture with microphone reading and location.",
  "Capturar con lectura de micrófono; ubicación no disponible.": "Capture with microphone reading; location unavailable.",
  "Cámara activada. Puedes fotografiar ya; las lecturas y la ubicación que estén disponibles se incluirán automáticamente.": "Camera enabled. You can take a photo; any available readings and location will be added automatically.",
  "No se pudo abrir la cámara: ": "Could not open camera: ",
  "Abre SonoGuard por HTTPS, concede permiso de cámara y usa un navegador compatible.": "Open SonoGuard over HTTPS, allow camera access and use a compatible browser.",
  "Se necesita HTTPS o localhost para el micrófono.": "HTTPS or localhost is required to use the microphone.",
  "No se pudieron consultar los lugares existentes: ": "Could not load registered places: ",
  "No proporcionado": "Not provided",
  "Fecha y hora (Bolivia)": ":Date and time (Bolivia):",
  "Lugar GPS": ":GPS location:",
  "Persona que informa": ":Person reporting:",
  "GPS aprox.": ":Approx. GPS:",
  "Contacto de PRUEBA": ":TEST contact:",
  "Referencia municipal 2022": ":2022 municipal reference:",
  "(sin confirmar)": "(unverified)",
  "SONOGUARD IA · REPORTE INFORMATIVO": "SONOGUARD AI · INFORMATION REPORT",
  "REGISTRO INFORMATIVO DE PRUEBA · NO ES MEDICIÓN CERTIFICADA": "TEST INFORMATION RECORD · NOT A CERTIFIED MEASUREMENT",
  "Preparar foto JPG": "Prepare JPG photo",
  "Ver datos": "View data",
  "Ocultar datos": "Hide data",
  "Explicar con IA": "Explain with AI",
  "Eliminar registro": "Delete record",
  "Registro de datos únicamente. No se almacenó una foto en esta sección.": "Data record only. No photo is stored here.",
  "micrófono del dispositivo": "device microphone",
  "sin lectura por falta de micrófono": "no reading (microphone unavailable)",
  "lectura histórica": "historical reading",
  "Escala original": ":Original scale:",
  "sin identificar": "unidentified",
  "Coordenadas": ":Coordinates:",
  "No disponibles": "Unavailable",
  "Precisión reportada": ":Reported accuracy:",
  "no disponible": "unavailable",
  "Abrir ubicación en Google Maps ↗": "Open location in Google Maps ↗",
  "¿Eliminar solo este registro de datos de Firebase? No afecta hospitales ni elimina fotos de tu celular.": "Delete only this data record from Firebase? This does not affect hospitals or photos on your phone.",
  "Registro de datos eliminado de Firebase.": "Data record deleted from Firebase.",
  "Sin registros de esta escala.": "No records on this scale.",
  "mediciones · Promedio": "readings · Average",
  "Mediana": "Median",
  "Resumen descriptivo: no determina infracciones ni permite comparar equipos no calibrados.": "Descriptive summary: it does not establish violations or allow comparisons between uncalibrated devices.",
  "Cargando datos…": "Loading data…",
  "Aún no hay registros de datos. Toma una foto para registrar fecha, hora, ubicación y lectura.": "No records yet. Take a photo to record the date, time, location and reading.",
  "Cargando…": "Loading…",
  "Sin registros.": "No records.",
  "No se pudo obtener la lista administrativa.": "Could not load the admin list.",
  "Cuenta autenticada": "Signed-in account",
  "Abre la cámara antes de reintentar sensores.": "Open the camera before retrying sensors.",
  "Reintentando ubicación y micrófono. Si el GPS falla, todavía puedes fotografiar con el micrófono.": "Retrying location and microphone. If GPS fails, you can still take a photo using the microphone.",
  "Escribe una pregunta breve.": "Type a short question.",
  "Hola": "Hello",
  "¡Hola! 👋 Soy SonoGuard IA. ¿En qué puedo ayudarte? Puedo explicarte las mediciones, orientarte para tomar una foto o preparar un aviso informativo sobre un problema de ruido en tu zona.": "Hello! 👋 I'm SonoGuard AI. How can I help you? I can explain readings, guide you through taking a photo, or help prepare an informational report about noise in your area.",
  "¿Qué significa dBFS?": "What does dBFS mean?",
  "¿Cómo tomo una evidencia?": "How do I take a report photo?",
  "¿Cómo funciona el historial?": "How does history work?",
  "Pensando…": "Thinking…",
  "No recibí respuesta.": "No response received.",
  "No pude comunicarme con el asistente. Revisa el Worker y sus configuraciones.": "I couldn't reach the assistant. Check the Worker and its settings.",
  "La IA se limita al administrador para proteger los $5 de saldo.": "AI is currently restricted to the administrator to protect the $5 credit balance.",
  "Falta configurar la URL de Cloudflare Worker en sonoguard-ai-config.js.": "The Cloudflare Worker URL is missing in sonoguard-ai-config.js.",
  "Inicia sesión en SonoGuard para usar la IA.": "Sign in to SonoGuard to use AI.",
  "No fue posible conectar con Cloudflare. Comprueba la URL del Worker y la conexión.": "Could not connect to Cloudflare. Check the Worker URL and your connection.",
  "Reporte SonoGuard": "SonoGuard report",
  "SonoGuard IA · Evidencia de prueba": "SonoGuard AI · Test report",
  "Fotografía de medición": "Measurement photo",
  "Nombre": ":Name:",
  "No declarado": "Not provided",
  "Lectura": ":Reading:",
  "Lugar": ":Place:",
  "Fecha y hora": ":Date and time:",
  "Registro ciudadano informativo de prueba. Medición no certificada. No activa visitas ni trámites oficiales. Contacto de prueba 75830320; referencia municipal publicada en 2022": "Informational citizen test record. Uncertified measurement. It does not initiate official visits or proceedings. Test contact: 75830320; municipal reference published in 2022:",
  "(vigencia sin confirmar).": "(status unverified).",
  "Imprimir / Guardar PDF": "Print / Save PDF",
  "Fuente": ":Source:",
  "✦ Frecuencia con mayor nivel:": "✦ Highest-level frequency:",
  "La foto informa de un problema de ruido en una zona, sin atribuir responsabilidad a nadie. Conserva fecha, hora, lectura digital y, si el dispositivo la entrega, la ubicación. Solo esos datos se guardan en Firebase: la fotografía permanece en tu dispositivo. Para compartirla se solicitará tu nombre completo y se creará una copia con el nombre. La foto se descarga:": "The photo documents a noise problem in an area without assigning blame. It includes the date, time, digital reading and, if available, device location. Only these data are saved to Firebase: the photo stays on your device. You will be asked for your full name only when sharing; a copy with your name will be created. The photo is downloaded:"
};
const fragments = [["No se pudo guardar en este navegador. Exporta el historial para conservarlo.", "Could not save in this browser. Export the history to preserve it."], ["Registro de datos únicamente. No se almacenó una foto en esta sección.", "Data record only. No photo is stored here."], ["Revisa los permisos del micrófono.", "Check microphone permissions."], ["No se pudo cargar el historial: ", "Could not load history: "], ["No se pudo preparar la imagen: ", "Could not prepare the image: "], ["índice relativo espectral /100", "relative spectral index /100"], ["Error al cargar SonoGuard IA: ", "Error loading SonoGuard AI: "], ["SOBRE UMBRAL · revisar banda", "ABOVE THRESHOLD · check band"], ["No se pudo abrir la cámara: ", "Could not open camera: "], ["Sin lectura de micrófono", "No microphone reading"], ["● EN VIVO · MICRÓFONO PC", "● LIVE · COMPUTER MICROPHONE"], ["● DEMO · DATOS SIMULADOS", "● DEMO · SIMULATED DATA"], ["Ubicación no disponible", "Location unavailable"], ["precisión reportada ±", "reported accuracy ±"], ["mediciones · Promedio", "readings · Average"], ["No se pudo eliminar: ", "Could not delete: "], ["Inicio del monitoreo", "Monitoring started"], ["No se pudo iniciar: ", "Could not start: "], ["pendiente de definir", "not yet defined"], ["● MONITOREO DETENIDO", "● MONITORING STOPPED"], ["IA no disponible: ", "AI unavailable: "], ["Lectura periódica", "Periodic reading"], ["Fin del monitoreo", "Monitoring ended"], ["Cambio de estado", "Status changed"], ["No proporcionado", "Not provided"], ["Alto / excedido", "High / exceeded"], ["(sin confirmar)", "(unverified)"], ["sin identificar", "unidentified"], ["bajo el umbral", "below threshold"], ["No disponibles", "Unavailable"], ["no disponible", "unavailable"], ["(GPS aprox.)", "(approx. GPS)"], ["No declarado", "Not provided"], ["mayor nivel", "highest level"], ["índice /100", "index /100"], ["● USUARIO ·", "● USER ·"], ["sin señal", "no signal"], ["Micrófono", "Microphone"], ["Punto GPS", "GPS point"], ["Cerca de", "Near"], ["Eliminar", "Delete"], ["Lugar: ", "Place: "], ["Mediana", "Median"], ["Editar", "Edit"], ["BANDA", "BAND"], ["Ahora", "Now"]];
const KEY = 'sonoguard-language-v1';
let lang = 'es';
try { lang = localStorage.getItem(KEY)==='en'?'en':'es'; } catch {}
export const getLanguage=()=>lang;

export function tr(value) {
  if(lang!=='en'||typeof value!=='string') return value;
  const match=value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if(!match) return value;
  const [,left,raw,right]=match;
  if(Object.prototype.hasOwnProperty.call(translated,raw))return left+translated[raw]+right;
  let out=raw;
  for(const [es,en] of fragments){
    if(es.length<4||!out.includes(es))continue;
    out=out.split(es).join(en);
  }
  return left+out+right;
}
const textCache=new WeakMap(),attrCache=new WeakMap();
const ATTRS=['placeholder','title','aria-label','alt'];
function ignored(el){
  return !!el?.closest('script,style,svg,textarea,[data-sg-i18n-ignore],.sgChatUser,.sgChatAssistant,#user-tag');
}
function setText(node){
  const parent=node.parentElement;
  if(!parent||ignored(parent))return;
  const value=node.nodeValue;
  if(!value?.trim())return;
  let data=textCache.get(node);
  if(!data||value!==data.original&&value!==data.english){data={original:value,english:''};textCache.set(node,data);}
  const next=lang==='en'?tr(data.original):data.original;
  if(lang==='en')data.english=next;
  if(value!==next)node.nodeValue=next;
}
function setAttrs(el){
  if(ignored(el))return;
  let cache=attrCache.get(el);if(!cache){cache=new Map();attrCache.set(el,cache);}
  for(const attr of ATTRS){
    if(!el.hasAttribute(attr))continue;
    const value=el.getAttribute(attr);
    let data=cache.get(attr);
    if(!data||value!==data.original&&value!==data.english){data={original:value,english:''};cache.set(attr,data);}
    const next=lang==='en'?tr(data.original):data.original;
    if(lang==='en')data.english=next;
    if(value!==next)el.setAttribute(attr,next);
  }
}
function applyTree(root){
  if(root.nodeType===Node.TEXT_NODE){setText(root);return;}
  if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE){if(ignored(root))return;setAttrs(root);}
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  while(walker.nextNode()){
    const node=walker.currentNode;
    if(node.nodeType===Node.TEXT_NODE)setText(node);
    else if(node.nodeType===Node.ELEMENT_NODE)setAttrs(node);
  }
}
function updateButtons(){
  document.querySelectorAll('.sg-lang-toggle').forEach(btn=>{
    btn.textContent=lang==='es'?'🌐 EN':'🌐 ES';
    btn.setAttribute('aria-label',lang==='es'?'Switch to English':'Cambiar a español');
    btn.title=lang==='es'?'Switch to English':'Cambiar a español';
    btn.setAttribute('aria-pressed',String(lang==='en'));
  });
}
let observer;
function translateDocument(){
  observer?.disconnect();
  document.documentElement.lang=lang;
  applyTree(document.body||document);
  updateButtons();
  observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
}
export function setLanguage(next){
  if(!['es','en'].includes(next))return;
  lang=next;
  try{localStorage.setItem(KEY,next);}catch{}
  translateDocument();
  document.dispatchEvent(new CustomEvent('sonoguard:language-change',{detail:{language:next}}));
}
function init(){
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.sg-lang-toggle');
    if(btn){e.preventDefault();setLanguage(lang==='es'?'en':'es');}
  });
  observer=new MutationObserver(records=>{
    observer.disconnect();
    for(const rec of records){
      if(rec.type==='characterData')setText(rec.target);
      else if(rec.type==='attributes')setAttrs(rec.target);
      else for(const node of rec.addedNodes)applyTree(node);
    }
    updateButtons();
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  });
  translateDocument();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
