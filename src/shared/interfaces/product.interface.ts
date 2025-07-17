// Productos que puede vender un tenant

export interface Product {
  id: string; // UUID del producto
  name: string; // Nombre del producto (ej: Camiseta blanca)
  description?: string; // Descripción larga opcional
  price: number; // Precio unitario
  stock: number; // Unidades disponibles
  minStock?: number; // Para alertas de inventario bajo
  sku?: string; // Código único de inventario interno
  imageUrl?: string; // URL de la imagen principal
  isPublished: boolean; // Si está visible para el público
  categoryId?: string; // Relación opcional con una categoría
  tenantId: string; // Tenant propietario
  createdAt: Date; // Creación
  updatedAt: Date; // Modificación
}
