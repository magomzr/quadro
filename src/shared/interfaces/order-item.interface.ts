// Productos individuales dentro de un pedido

export interface OrderItem {
  id: string; // UUID único del ítem del pedido
  orderId: string; // Pedido al que pertenece
  productId: string; // Producto vendido
  quantity: number; // Cantidad de unidades
  unitPrice: number; // Precio unitario en el momento de la compra
  totalPrice: number; // Subtotal por este ítem (quantity * unitPrice)
  tenantId: string; // Para queries eficientes y seguridad
}
