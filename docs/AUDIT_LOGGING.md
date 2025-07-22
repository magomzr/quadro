# Quadro Audit Logging System

This document describes the comprehensive audit logging system implemented in Quadro for tracking all important business operations.

## Overview

The logging system captures all major business operations including:
- CRUD operations on products, categories, customers, discounts, orders, tenants, and settings
- User actions with before/after data for updates and deletions
- Error events with context for debugging
- System events like payment gateway failures

## Architecture

### LogService
The main service (`src/shared/services/log.service.ts`) provides methods for creating different types of audit logs:

- `logSuccess()` - For successful operations
- `logError()` - For failed operations with error details
- `logUpdate()` - For updates with before/after data
- `logDelete()` - For deletions with preserved data

### Log Actions Constants
Standardized action codes and messages are defined in `src/shared/constants/log-actions.constants.ts`:

- `PRODUCT_ACTIONS`: CREATE, UPDATE, DELETE, STOCK_UPDATE, PUBLISH, UNPUBLISH
- `CATEGORY_ACTIONS`: CREATE, UPDATE, DELETE
- `DISCOUNT_ACTIONS`: CREATE, UPDATE, DELETE, VALIDATE, APPLY
- `ORDER_ACTIONS`: CREATE, UPDATE, STATUS_UPDATE, CANCEL, PAYMENT_SUCCESS, PAYMENT_FAILED
- `CUSTOMER_ACTIONS`: CREATE, UPDATE, DELETE
- `TENANT_ACTIONS`: CREATE, UPDATE, ACTIVATE, DEACTIVATE
- `SETTINGS_ACTIONS`: CREATE, UPDATE, DELETE

## Database Schema

The `Log` model in `schema.prisma` includes:
- `id`: Unique identifier
- `tenantId`: Tenant context
- `userId`: User who performed the action (optional)
- `action`: Standardized action code
- `resource`: Type of entity affected
- `resourceId`: ID of specific entity (optional)
- `metadata`: Additional context (JSON)
- `ipAddress`: Client IP (optional)
- `userAgent`: Client browser (optional)
- `createdAt`: Timestamp

## Usage Examples

### Product Operations
```typescript
// Product creation
await this.catalogService.createProduct(tenantId, productData, userId);
// Logs: "PRODUCT_CREATE" with product details

// Product update
await this.catalogService.updateProduct(tenantId, productId, updateData, userId);
// Logs: "PRODUCT_UPDATE" with before/after data

// Stock update
await this.catalogService.updateProductStock(tenantId, productId, newStock, userId);
// Logs: "PRODUCT_STOCK_UPDATE" with stock change

// Publish/Unpublish
await this.catalogService.updateProductPublishStatus(tenantId, productId, true, userId);
// Logs: "PRODUCT_PUBLISH" or "PRODUCT_UNPUBLISH"
```

### Order Operations
```typescript
// Order creation
await this.ordersService.create(tenantId, orderData, userId);
// Logs: "ORDER_CREATE" with order details
// Also logs: "DISCOUNT_APPLY" if discount used

// Status update
await this.ordersService.updateStatus(tenantId, orderId, 'paid', userId);
// Logs: "ORDER_STATUS_UPDATE" or "ORDER_CANCEL"
// Also logs: "ORDER_PAYMENT_SUCCESS" for paid orders
```

### Discount Operations
```typescript
// Discount creation
await this.discountsService.create(tenantId, discountData, userId);
// Logs: "DISCOUNT_CREATE" with discount details (% or fixed amount)

// Validation
await this.discountsService.validateDiscountCode(tenantId, code, orderAmount, userId);
// Logs: "DISCOUNT_VALIDATE" for successful validation
// Logs: "DISCOUNT_VALIDATE_FAILED" for invalid codes
```

## Log Metadata Examples

### Product Update Log
```json
{
  "before": {
    "name": "Old Product Name",
    "price": 99.99,
    "stock": 10,
    "isPublished": false
  },
  "after": {
    "name": "New Product Name", 
    "price": 89.99,
    "stock": 15,
    "isPublished": true
  }
}
```

### Discount Application Log
```json
{
  "discountCode": "SAVE20",
  "discountType": "percentage",
  "discountValue": 20,
  "orderSubtotal": 100.00,
  "discountAmount": 20.00,
  "customerName": "John Doe"
}
```

### Order Creation Log
```json
{
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "itemCount": 3,
  "subtotal": 150.00,
  "total": 135.00,
  "discountCode": "SAVE10",
  "discountAmount": 15.00
}
```

## Error Logging

All failed operations are automatically logged with error context:

```json
{
  "error": {
    "message": "Product SKU already exists for this tenant",
    "code": "P2002"
  },
  "attemptedData": {
    "name": "Duplicate Product",
    "sku": "EXISTING-SKU"
  }
}
```

## Integration Points

### Service Layer
All service methods have been updated to include optional `userId` parameter and automatic logging.

### Module Configuration
Each module includes the `LogService` provider:
```typescript
@Module({
  providers: [SomeService, LogService],
})
```

### Controller Integration
Controllers should pass user information when available:
```typescript
@Post()
async createProduct(
  @Param('tenantId') tenantId: string,
  @Body() productData: CreateProductDto,
  @CurrentUser() user: User, // From auth middleware
) {
  return this.catalogService.createProduct(tenantId, productData, user.id);
}
```

## Benefits

1. **Complete Audit Trail**: Every business operation is logged with context
2. **Compliance**: Supports regulatory requirements for data tracking
3. **Debugging**: Error logs help identify and resolve issues
4. **Analytics**: Business intelligence on user actions and patterns
5. **Security**: Track suspicious activities and data changes
6. **Data Recovery**: Before/after data helps with rollbacks

## Best Practices

1. Always pass `userId` when available for accountability
2. Include relevant metadata for context
3. Use standardized action constants for consistency
4. Log both successful and failed operations
5. Never log sensitive data like passwords or payment details
6. The logging service is designed to never disrupt business operations (errors are caught and logged)

## Querying Logs

Example queries for common audit needs:

```sql
-- All actions by a specific user
SELECT * FROM logs WHERE "userId" = 'user-id' ORDER BY "createdAt" DESC;

-- All product changes in a tenant
SELECT * FROM logs WHERE "tenantId" = 'tenant-id' AND resource = 'Product' ORDER BY "createdAt" DESC;

-- Failed operations
SELECT * FROM logs WHERE action LIKE '%_FAILED' ORDER BY "createdAt" DESC;

-- Discount usage analytics
SELECT * FROM logs WHERE action = 'DISCOUNT_APPLY' AND "createdAt" > NOW() - INTERVAL '30 days';
```

This comprehensive logging system ensures full traceability of all business operations in Quadro while maintaining performance and reliability.