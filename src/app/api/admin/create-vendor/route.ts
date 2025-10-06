import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdminAuth } from '@/lib/auth-utils'
import { spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(require('child_process').exec)

export async function POST(request: NextRequest) {
  try {
    // Require Super Admin authentication
    const authResult = await requireSuperAdminAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const { domain, adminEmail } = body

    if (!domain || !adminEmail) {
      return NextResponse.json(
        { success: false, error: 'Domain and admin email are required' },
        { status: 400 }
      )
    }

    // Validate that email domain matches the domain
    const emailDomain = adminEmail.split('@')[1]
    if (emailDomain !== domain) {
      return NextResponse.json(
        { success: false, error: 'Admin email domain must match the vendor domain' },
        { status: 400 }
      )
    }

    try {
      // Use the initialization script to create the vendor account
      const scriptPath = path.join(process.cwd(), 'scripts/initialize-new-account.js')
      
      // Run the script with the domain and admin email as environment variables
      const env = {
        ...process.env,
        INIT_DOMAIN: domain,
        INIT_ADMIN_EMAIL: adminEmail,
        INIT_AUTO_MODE: 'true' // Flag to run in non-interactive mode
      }

      const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, { 
        env,
        timeout: 120000 // 2 minute timeout
      })

      console.log('Script output:', stdout)
      if (stderr) {
        console.warn('Script stderr:', stderr)
      }

      // Check if the script succeeded
      if (stdout.includes('✅ Account initialization completed successfully')) {
        return NextResponse.json({
          success: true,
          message: 'Vendor account created successfully',
          details: {
            domain,
            adminEmail,
            output: stdout
          }
        })
      } else {
        throw new Error('Script did not complete successfully')
      }

    } catch (scriptError: any) {
      console.error('Error running initialization script:', scriptError)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create vendor account',
          details: scriptError.message || 'Script execution failed'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in create-vendor API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}







