// Códigos promocionales para aplicar a compras

export interface Discount {
  id: string; // UUID del descuento
  code: string; // Código que debe ingresar el cliente (ej: 10OFF)
  description?: string; // Qué significa o aplica
  type: 'percentage' | 'fixed'; // Tipo de descuento (porcentaje o monto fijo)
  value: number; // Valor del descuento (ej: 10 o 5000)
  active: boolean; // Si está disponible
  startDate?: Date; // Desde cuándo está disponible
  endDate?: Date; // Hasta cuándo está disponible
  usageLimit?: number; // Máximo de usos permitidos (opcional)
  usedCount: number; // Cuántas veces ha sido usado
  minimumOrderAmount?: number; // Monto mínimo para aplicar descuento
  tenantId: string; // Propietario
  createdAt: Date;
  updatedAt: Date;
}
