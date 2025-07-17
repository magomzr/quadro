// Preferencias y configuración global del tenant

export interface Settings {
  id: string; // UUID único del registro
  tenantId: string; // A qué tenant pertenecen estas configuraciones
  companyName: string; // Nombre de la empresa o tienda
  companyLogoUrl?: string; // URL del logo de la empresa
  currency: string; // Moneda utilizada (ej: COP, USD, EUR)
  locale: string; // Localización o idioma preferido (ej: es-CO)
  timezone: string; // Zona horaria del tenant (ej: America/Bogota)
  invoicePrefix?: string; // Prefijo para numeración de facturas (ej: INV-)
  createdAt: Date; // Creado
  updatedAt: Date; // Última modificación
}
