/**
 * Standardized log action constants for audit logging
 * These provide consistent messaging for different business operations
 */

// Product actions
export const PRODUCT_ACTIONS = {
  CREATE: 'PRODUCT_CREATE',
  UPDATE: 'PRODUCT_UPDATE',
  DELETE: 'PRODUCT_DELETE',
  STOCK_UPDATE: 'PRODUCT_STOCK_UPDATE',
  PUBLISH: 'PRODUCT_PUBLISH',
  UNPUBLISH: 'PRODUCT_UNPUBLISH',
} as const;

// Category actions
export const CATEGORY_ACTIONS = {
  CREATE: 'CATEGORY_CREATE',
  UPDATE: 'CATEGORY_UPDATE',
  DELETE: 'CATEGORY_DELETE',
} as const;

// Discount actions
export const DISCOUNT_ACTIONS = {
  CREATE: 'DISCOUNT_CREATE',
  UPDATE: 'DISCOUNT_UPDATE',
  DELETE: 'DISCOUNT_DELETE',
  VALIDATE: 'DISCOUNT_VALIDATE',
  APPLY: 'DISCOUNT_APPLY',
} as const;

// Order actions
export const ORDER_ACTIONS = {
  CREATE: 'ORDER_CREATE',
  UPDATE: 'ORDER_UPDATE',
  STATUS_UPDATE: 'ORDER_STATUS_UPDATE',
  CANCEL: 'ORDER_CANCEL',
  PAYMENT_SUCCESS: 'ORDER_PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'ORDER_PAYMENT_FAILED',
} as const;

// Customer actions
export const CUSTOMER_ACTIONS = {
  CREATE: 'CUSTOMER_CREATE',
  UPDATE: 'CUSTOMER_UPDATE',
  DELETE: 'CUSTOMER_DELETE',
} as const;

// Tenant actions
export const TENANT_ACTIONS = {
  CREATE: 'TENANT_CREATE',
  UPDATE: 'TENANT_UPDATE',
  ACTIVATE: 'TENANT_ACTIVATE',
  DEACTIVATE: 'TENANT_DEACTIVATE',
} as const;

// Settings actions
export const SETTINGS_ACTIONS = {
  CREATE: 'SETTINGS_CREATE',
  UPDATE: 'SETTINGS_UPDATE',
  DELETE: 'SETTINGS_DELETE',
} as const;

// User actions
export const USER_ACTIONS = {
  LOGIN: 'USER_LOGIN',
  LOGOUT: 'USER_LOGOUT',
  CREATE: 'USER_CREATE',
  UPDATE: 'USER_UPDATE',
  DELETE: 'USER_DELETE',
  PASSWORD_RESET: 'USER_PASSWORD_RESET',
} as const;

// System actions
export const SYSTEM_ACTIONS = {
  DATABASE_ERROR: 'SYSTEM_DATABASE_ERROR',
  PAYMENT_GATEWAY_ERROR: 'SYSTEM_PAYMENT_GATEWAY_ERROR',
  EXTERNAL_SERVICE_ERROR: 'SYSTEM_EXTERNAL_SERVICE_ERROR',
} as const;

// Resource names
export const RESOURCES = {
  PRODUCT: 'Product',
  CATEGORY: 'Category',
  DISCOUNT: 'Discount',
  ORDER: 'Order',
  CUSTOMER: 'Customer',
  TENANT: 'Tenant',
  SETTINGS: 'Settings',
  USER: 'User',
  SYSTEM: 'System',
} as const;

// Human-readable log messages
export const LOG_MESSAGES = {
  // Product messages
  [PRODUCT_ACTIONS.CREATE]: 'Product created',
  [PRODUCT_ACTIONS.UPDATE]: 'Product updated',
  [PRODUCT_ACTIONS.DELETE]: 'Product deleted',
  [PRODUCT_ACTIONS.STOCK_UPDATE]: 'Product stock updated',
  [PRODUCT_ACTIONS.PUBLISH]: 'Product published',
  [PRODUCT_ACTIONS.UNPUBLISH]: 'Product unpublished',

  // Category messages
  [CATEGORY_ACTIONS.CREATE]: 'Category created',
  [CATEGORY_ACTIONS.UPDATE]: 'Category updated',
  [CATEGORY_ACTIONS.DELETE]: 'Category deleted',

  // Discount messages
  [DISCOUNT_ACTIONS.CREATE]: 'Discount created',
  [DISCOUNT_ACTIONS.UPDATE]: 'Discount updated',
  [DISCOUNT_ACTIONS.DELETE]: 'Discount deleted',
  [DISCOUNT_ACTIONS.VALIDATE]: 'Discount code validated',
  [DISCOUNT_ACTIONS.APPLY]: 'Discount applied to order',

  // Order messages
  [ORDER_ACTIONS.CREATE]: 'Order created',
  [ORDER_ACTIONS.UPDATE]: 'Order updated',
  [ORDER_ACTIONS.STATUS_UPDATE]: 'Order status updated',
  [ORDER_ACTIONS.CANCEL]: 'Order cancelled',
  [ORDER_ACTIONS.PAYMENT_SUCCESS]: 'Order payment successful',
  [ORDER_ACTIONS.PAYMENT_FAILED]: 'Order payment failed',

  // Customer messages
  [CUSTOMER_ACTIONS.CREATE]: 'Customer created',
  [CUSTOMER_ACTIONS.UPDATE]: 'Customer updated',
  [CUSTOMER_ACTIONS.DELETE]: 'Customer deleted',

  // Tenant messages
  [TENANT_ACTIONS.CREATE]: 'Tenant created',
  [TENANT_ACTIONS.UPDATE]: 'Tenant updated',
  [TENANT_ACTIONS.ACTIVATE]: 'Tenant activated',
  [TENANT_ACTIONS.DEACTIVATE]: 'Tenant deactivated',

  // Settings messages
  [SETTINGS_ACTIONS.CREATE]: 'Settings created',
  [SETTINGS_ACTIONS.UPDATE]: 'Settings updated',
  [SETTINGS_ACTIONS.DELETE]: 'Settings deleted',

  // User messages
  [USER_ACTIONS.LOGIN]: 'User logged in',
  [USER_ACTIONS.LOGOUT]: 'User logged out',
  [USER_ACTIONS.CREATE]: 'User created',
  [USER_ACTIONS.UPDATE]: 'User updated',
  [USER_ACTIONS.DELETE]: 'User deleted',
  [USER_ACTIONS.PASSWORD_RESET]: 'User password reset',

  // System messages
  [SYSTEM_ACTIONS.DATABASE_ERROR]: 'Database error occurred',
  [SYSTEM_ACTIONS.PAYMENT_GATEWAY_ERROR]: 'Failed to connect to payment gateway',
  [SYSTEM_ACTIONS.EXTERNAL_SERVICE_ERROR]: 'External service error',
} as const;