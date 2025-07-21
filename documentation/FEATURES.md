# Quadro - Características y Funcionalidades

## Arquitectura General

### Multi-tenancy

- **Aislamiento completo**: Cada tenant opera independientemente con sus propios datos
- **Escalabilidad**: Soporta múltiples organizaciones en una sola instancia
- **Seguridad**: Validación de tenant en cada operación para prevenir acceso cruzado

### Stack Tecnológico

- **Backend**: NestJS con TypeScript
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Validación**: Tipos automáticos de Prisma (sin DTOs personalizados)
- **Transacciones**: Operaciones atómicas para consistencia de datos

## Módulos Implementados

### 1. Gestión de Tenants

**Funcionalidades:**

- ✅ CRUD completo de tenants
- ✅ Validación de slugs únicos
- ✅ Soft delete (desactivación en lugar de eliminación)
- ✅ Creación automática de settings por defecto

**Características especiales:**

- **Settings automáticas**: Al crear un tenant, se generan configuraciones por defecto usando transacciones atómicas
- **Valores sensatos**: Moneda COP, timezone UTC, prefijo de factura "INV-"
- **Rollback automático**: Si falla la creación de settings, se revierte la creación del tenant

### 2. Catálogo de Productos

#### Categorías

**Funcionalidades:**

- ✅ CRUD completo con aislamiento por tenant
- ✅ Nombres únicos por tenant (no globalmente únicos)
- ✅ Validación de eliminación: No permite borrar categorías con productos asociados

**Restricciones de negocio:**

- **Índice único compuesto**: `[name, tenantId]` permite nombres duplicados entre tenants
- **Protección de datos**: Validación antes de eliminar categorías con productos

#### Productos

**Funcionalidades:**

- ✅ Gestión completa de inventario
- ✅ Control de stock en tiempo real
- ✅ Estados de publicación (publicado/borrador)
- ✅ Categorización opcional
- ✅ SKUs únicos por tenant

**Características avanzadas:**

- **Validación de stock**: Verificación automática en creación de órdenes
- **Actualización de stock**: Reducción/restauración automática según estado de órdenes
- **Filtros avanzados**: Por categoría, estado de publicación, stock bajo, búsqueda por texto

### 3. Gestión de Clientes

**Funcionalidades:**

- ✅ CRUD completo con paginación
- ✅ Búsqueda por nombre y email (case-insensitive)
- ✅ Email único por tenant
- ✅ Protección ante eliminación con órdenes asociadas

**Características de negocio:**

- **Flexibilidad**: Permite guest checkout sin requerir registro
- **Historial**: Agrupa todas las órdenes de un cliente para análisis
- **Integridad**: No permite eliminar clientes con órdenes activas

### 4. Sistema de Órdenes (E-commerce Completo)

#### Lógica de Negocio Implementada

**Validaciones automáticas:**

- ✅ **Stock suficiente**: Verifica disponibilidad antes de crear orden
- ✅ **Productos publicados**: Solo permite vender productos activos
- ✅ **Cálculos automáticos**: Subtotal, descuentos y total
- ✅ **Códigos de descuento**: Validación de vigencia, límites y requisitos

**Transacciones atómicas:**

- ✅ **Creación de orden**: Todo o nada (orden + items + reducción de stock)
- ✅ **Cancelación**: Restaura stock y revierte contadores de descuento
- ✅ **Rollback automático**: Si cualquier paso falla, se revierte toda la operación

#### Gestión de Descuentos

**Validaciones implementadas:**

- **Fecha de vigencia**: `startDate` y `endDate`
- **Límites de uso**: `usageLimit` y contador `usedCount`
- **Monto mínimo**: `minimumOrderAmount`
- **Tipos soportados**: Porcentaje y monto fijo
- **Contador automático**: Incremento/decremento según estado de orden

#### Estados de Orden

- **pending**: Orden creada, stock reducido
- **paid**: Orden pagada y confirmada
- **cancelled**: Orden cancelada, stock restaurado automáticamente

#### Guest Checkout vs Customers Registrados

**¿Por qué permitir órdenes sin validar customer existente?**

**1. Guest Checkout (Compra como invitado):**

- **Menor fricción**: Reduce abandono de carrito
- **Compras impulsivas**: Facilita decisiones rápidas
- **Primera compra**: Permite probar sin compromiso de registro

**2. Flexibilidad en flujos de compra:**

```typescript
// Usuario registrado
{
  customerId: "uuid-del-customer",
  customerName: "Juan Pérez",
  customerEmail: "juan@example.com"
}

// Guest checkout
{
  customerId: null,
  customerName: "María García",
  customerEmail: "maria@example.com"
}

// Venta presencial/telefónica
{
  customerId: null,
  customerName: "Cliente Walk-in",
  customerEmail: null
}
```

**¿Para qué sirve tener Customer entonces?**

- **Historial de compras**: Análisis de comportamiento y fidelización
- **Marketing dirigido**: Promociones personalizadas
- **Gestión centralizada**: Una fuente de verdad para datos del cliente

**¿Por qué guardar nombre/email en Order?**

- **Snapshot temporal**: Datos inmutables del momento de compra
- **Integridad histórica**: Facturación y auditoría requieren datos originales
- **Regulaciones**: Algunos países exigen mantener datos de transacción inalterados

### 5. Configuraciones (Settings)

**Funcionalidades:**

- ✅ Configuración automática al crear tenant
- ✅ CRUD para gestión posterior (sin endpoint POST)
- ✅ Valores por defecto sensatos para Colombia

**Configuraciones incluidas:**

- **Empresa**: Nombre y logo
- **Regionalización**: Moneda (COP), idioma (es-CO), timezone (UTC)
- **Facturación**: Prefijo personalizable (INV-)

## Características Técnicas Avanzadas

### Manejo de Errores Robusto

**Códigos Prisma manejados:**

- **P2002**: Violación de restricción única (conflictos)
- **P2003**: Violación de llave foránea (entidades no encontradas)
- **P2025**: Registro no encontrado para operación

**Respuestas HTTP apropiadas:**

- **409 Conflict**: Para duplicados y restricciones de negocio
- **404 Not Found**: Para entidades inexistentes
- **400 Bad Request**: Para violaciones de reglas de negocio

### Paginación Consistente

**Metadatos incluidos:**

- `currentPage`, `totalPages`, `totalItems`
- `itemsPerPage`, `hasNextPage`, `hasPreviousPage`
- Implementación uniforme en todos los módulos

### Filtros y Búsquedas

**Implementados por módulo:**

- **Products**: Categoría, estado, stock bajo, búsqueda por texto
- **Customers**: Búsqueda por nombre/email
- **Orders**: Estado, cliente, rango de fechas
- **Todas**: Case-insensitive y paginación

### Seguridad Multi-tenant

**Validaciones implementadas:**

- **Aislamiento de datos**: Validación de `tenantId` en cada consulta
- **Relaciones seguras**: Verificación de pertenencia antes de operaciones
- **UUIDs**: Identificadores no secuenciales para mayor seguridad

## Casos de Uso Recomendados

### 1. E-commerce Público

- ✅ **Guest checkout habilitado**
- ✅ **Registro opcional post-compra**
- ✅ **Gestión de inventario en tiempo real**

### 2. B2B/Empresarial

- ✅ **Clientes registrados requeridos**
- ✅ **Códigos de descuento corporativos**
- ✅ **Facturación con datos completos**

### 3. Híbrido (Recomendado)

- ✅ **Guest checkout para nuevos usuarios**
- ✅ **Creación automática de customer en primera compra**
- ✅ **Migración gradual a cuenta registrada**

## Ventajas de la Implementación Actual

### ✅ **Flexibilidad de Negocio**

- Permite guest checkout
- Mantiene snapshot de datos históricos
- Escalable a diferentes modelos de negocio

### ✅ **Integridad de Datos**

- Transacciones atómicas previenen inconsistencias
- Validaciones de stock en tiempo real
- Rollback automático en errores

### ✅ **Simplicidad de Desarrollo**

- Sin DTOs personalizados (usa tipos de Prisma)
- Manejo de errores estandarizado
- Código limpio y mantenible

### ✅ **Performance y Escalabilidad**

- Consultas optimizadas con índices apropiados
- Paginación en todos los listados
- Transacciones eficientes

### ✅ **Cumplimiento Regulatorio**

- Datos inmutables de transacciones
- Auditoría completa de operaciones
- Aislamiento multi-tenant seguro

## API Endpoints Disponibles

### Tenants

- `POST /v1/tenants` - Crear tenant (con settings automáticas)
- `GET /v1/tenants/{slug}` - Obtener por slug
- `PATCH /v1/tenants/{tenantId}` - Actualizar tenant

### Catálogo

- `POST/GET/PATCH/DELETE /v1/tenants/{tenantId}/catalog/categories`
- `POST/GET/PATCH/DELETE /v1/tenants/{tenantId}/catalog/products`
- Filtros: categoría, estado, stock, búsqueda

### Clientes

- `POST/GET/PATCH/DELETE /v1/tenants/{tenantId}/customers`
- Búsqueda por nombre/email con paginación

### Órdenes

- `POST /v1/tenants/{tenantId}/orders` - Checkout completo
- `GET /v1/tenants/{tenantId}/orders` - Listar con filtros
- `PATCH /v1/tenants/{tenantId}/orders/{id}/status` - Cambiar estado
- `DELETE /v1/tenants/{tenantId}/orders/{id}` - Cancelar (restaura stock)

### Configuraciones

- `GET/PATCH/DELETE /v1/tenants/{tenantId}/settings`
- Sin POST (se crean automáticamente con tenant)

---

**Notas de Implementación:**

- Todos los endpoints requieren validación de `tenantId`
- UUIDs obligatorios para identificadores
- Respuestas consistentes con metadatos de paginación
- Manejo de errores estandarizado con códigos
