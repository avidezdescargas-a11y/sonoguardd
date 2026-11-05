## Auditoría de integración de SonoGuard IA

Sin modificar archivos JS del panel original. Solo se inserta enlace en `public/index.html`; se añaden rutas `sgProfiles`, `sgEvidence` y `sgAiUsage` al final de las reglas Firestore; se añade un índice para el historial propio; se añade configuración de Storage y Cloud Functions al JSON sin alterar Hosting/Firestore existentes.

**Diferencia deliberada:** `adminUid()` en las reglas suministradas estaba en `REEMPLAZA_UID_ADMIN`. Se actualizó para coincidir con el UID existente en la configuración web suministrada. No se ejecutaron accesos a la base real. Confirmar manualmente UID actual y posibles reglas de producción diferentes.

Las fotos contienen datos personales; uso privado salvo descarga y difusión voluntaria. No hay módulo de sanciones ni envío automático de denuncias. El botón WhatsApp solo prepara mensaje al contacto de prueba.
