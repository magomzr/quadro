// Clientes que realizan pedidos

export interface Customer {
  id: string; // UUID del cliente
  email: string; // Email del cliente
  name: string; // Nombre completo
  phone?: string; // Teléfono de contacto
  address?: string; // Dirección del cliente
  tenantId: string; // A qué tenant pertenece
  createdAt: Date; // Fecha de creación
  updatedAt: Date; // Última actualización
}
