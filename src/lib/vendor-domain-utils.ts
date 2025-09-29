import { createClient } from '@/lib/supabase/server'

/**
 * Get vendor domain ID from user email
 * @param email - User's email address
 * @returns Promise<string | null> - The vendor domain ID or null if not found
 */
export async function getVendorDomainId(email: string): Promise<string | null> {
  try {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) {
      return null
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vendor_domains')
      .select('id')
      .eq('protected_domain', domain)
      .single()

    if (error) {
      console.error('Error fetching vendor domain ID:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Error in getVendorDomainId:', error)
    return null
  }
}

/**
 * Get vendor domain ID from authenticated user session
 * @returns Promise<string | null> - The vendor domain ID or null if not found
 */
export async function getCurrentVendorDomainId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user?.email) {
      return null
    }

    return await getVendorDomainId(user.email)
  } catch (error) {
    console.error('Error in getCurrentVendorDomainId:', error)
    return null
  }
}

/**
 * Validate that a user has access to a specific vendor domain
 * @param email - User's email address
 * @param vendorDomainId - The vendor domain ID to check access for
 * @returns Promise<boolean> - True if user has access, false otherwise
 */
export async function validateVendorDomainAccess(email: string, vendorDomainId: string): Promise<boolean> {
  try {
    const userDomainId = await getVendorDomainId(email)
    return userDomainId === vendorDomainId
  } catch (error) {
    console.error('Error in validateVendorDomainAccess:', error)
    return false
  }
}
