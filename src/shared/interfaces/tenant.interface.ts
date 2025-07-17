// Representa a cada empresa o tienda

export interface Tenant {
  id: string; // UUID único para identificar internamente al tenant
  name: string; // Nombre completo de la tienda o empresa
  slug: string; // Identificador único público, usado en URLs (ej: tienda123.quadro.com)
  isActive: boolean; // Para activar/desactivar el tenant sin eliminarlo
  createdAt: Date; // Fecha de creación del tenant
  updatedAt: Date; // Fecha de última modificación
}
