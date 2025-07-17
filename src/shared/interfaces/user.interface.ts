// Representa usuarios de administración por tenant

export interface User {
  id: string; // UUID del usuario
  email: string; // Correo electrónico (login)
  passwordHash: string; // Contraseña encriptada (nunca se guarda texto plano)
  name: string; // Nombre completo para mostrar en paneles
  role: 'admin' | 'staff'; // Rol del usuario (admin controla toda la herramienta; staff puede ser limitado)
  tenantId: string; // Referencia al tenant al que pertenece
  isActive: boolean; // Controlar acceso del usuario sin eliminarlo
  lastLoginAt?: Date; // Para auditoría
  emailVerifiedAt?: Date; // Para verificación de email
  resetPasswordToken?: string; // Para reset de contraseña
  resetPasswordExpiresAt?: Date; // Expiración del token
  createdAt: Date; // Fecha de creación
  updatedAt: Date; // Última actualización
}
