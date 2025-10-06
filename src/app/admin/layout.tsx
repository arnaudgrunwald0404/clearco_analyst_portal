import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SUPER_ADMIN_EMAILS } from '@/lib/auth-utils'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/')
  }

  // Check if user is super admin by email
  const isSuperAdmin = user.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())
  
  // Also check user profile role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const hasAdminRole = profile?.role === 'SUPER_ADMIN'

  if (!isSuperAdmin && !hasAdminRole) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        {children}
      </div>
    </div>
  )
}
