// Registro de eventos administrativos (logging seguro)

export interface Log {
  id: string; // UUID del log
  tenantId: string; // A quién pertenece el log
  userId?: string; // Usuario que generó la acción (puede ser null si es automática)
  action: string; // Descripción corta de la acción (ej: "DELETE_PRODUCT")
  resource: string; // Tipo de entidad afectada (ej: "Product", "Order")
  resourceId?: string; // ID de la entidad específica afectada (si aplica)
  metadata?: Record<string, any>; // Información adicional (payload, IP, etc.)
  ipAddress?: string; // IP desde donde se hizo la acción
  userAgent?: string; // Navegador o dispositivo (opcional)
  createdAt: Date; // Cuándo ocurrió el evento
}
