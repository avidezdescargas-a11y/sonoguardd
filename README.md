# SonoGuard IA · Versión gratuita de registros (sin subir fotos)

Ampliación integrada de SonoGuard para GitHub Pages. Mantiene `places/{id}`, `settings/global`, analizador, mapa, usuarios y panel único.

## Qué hace
- Cámara del navegador en vivo; lectura acústica del micrófono (índice relativo 0–100, **no** dB SPL certificado).
- Intenta obtener ubicación del navegador (GPS/Wi-Fi/sistema) y muestra acceso a Google Maps. **Si no se obtiene ubicación, la foto se puede tomar pero el registro indica que no está disponible.** No inventa coordenadas.
- Guarda el JPG en **Descargas** del usuario, nunca sube el archivo a Firebase. Puede volver a descargarse mientras está abierta la captura.
- WhatsApp al número de prueba 75830320; pide nombre completo solo al compartir; la persona debe **adjuntar manualmente** la foto descargada y pulsar enviar.
- Historial de **solo datos** privados por UID en la colección `sgEvidence`, con lectura por propietario, detalles y eliminación de cada registro.
- Consultas de historial sin índice compuesto (filtro `ownerUid` y orden local), para evitar el error de índice mostrado previamente.
- IA flotante (solo disponible si se configura un backend seguro con funciones y secreto `OPENAI_API_KEY`; **Cloud Functions y OpenAI no forman parte del plan Firebase gratuito Spark**).

## Instalación
Lee **GUIA_PUBLICACION_GRATIS.md**. Antes de modificar las reglas de tu proyecto remoto, haz copia de sus reglas actuales, verifica el UID de administrador, ejecuta las pruebas y despliega solo `firestore:rules`. GitHub Pages solo publica `public/`.

**Importante**: los datos anteriores (hospitales, zonas, configuración y antiguos registros) permanecen en Firebase; esta aplicación no hace migraciones ni borrados masivos. Si ya subiste fotos con una versión anterior, siguen en Storage hasta que las elimines allí de forma separada: eliminarlas del historial de datos no borra archivos antiguos en Storage.
