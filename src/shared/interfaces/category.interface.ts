// Clasifica productos para navegación

export interface Category {
  id: string; // UUID de la categoría
  name: string; // Nombre de la categoría (ej: Electrónica, Ropa)
  description?: string; // Detalles opcionales sobre la categoría
  tenantId: string; // Referencia al tenant
  createdAt: Date; // Fecha de creación
  updatedAt: Date; // Última modificación
}
