// Pedido de un cliente

export interface Order {
  id: string; // UUID del pedido
  customerName: string; // Nombre del cliente
  customerEmail?: string; // Email del cliente (opcional)
  status: 'pending' | 'paid' | 'cancelled'; // Estado del pedido
  subtotal: number; // Subtotal antes de descuentos
  total: number; // Total final del pedido (con descuentos)
  discountId?: string; // Descuento aplicado (si hay)
  discountAmount?: number; // Monto del descuento aplicado
  shippingAddress?: string; // Para envíos
  notes?: string; // Notas del cliente o admin
  tenantId: string; // A quién pertenece el pedido
  createdAt: Date;
  updatedAt: Date;
}
