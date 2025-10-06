// Client-side auth utilities (safe for client components)

export const SUPER_ADMIN_EMAILS = [
  'agrunwald@clearcompany.com'
]

export function isSuperAdmin(user: any): boolean {
  if (!user || !user.email) return false
  
  return SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase()) || 
         user.role === 'SUPER_ADMIN'
}

export function isVendorAdmin(user: any): boolean {
  if (!user) return false
  return user.role === 'VENDOR_ADMIN' || user.role === 'SUPER_ADMIN'
}

export function isVendorUser(user: any): boolean {
  if (!user) return false
  return user.role === 'VENDOR_USER' || user.role === 'VENDOR_ADMIN' || user.role === 'SUPER_ADMIN'
}







