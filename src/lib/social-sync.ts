import { createClient } from '@/lib/supabase/server'

interface AnalystSocialData {
  id: string
  twitterHandle?: string | null
  linkedinUrl?: string | null
  personalWebsite?: string | null
}

export class SocialHandleSync {
  private async getSupabase() {
    return await createClient()
  }

  /**
   * Sync social handles for an analyst
   */
  async syncAnalystSocialHandles(analystData: AnalystSocialData): Promise<void> {
    const { id, twitterHandle, linkedinUrl, personalWebsite } = analystData

    try {
      // Sync Twitter handle
      await this.syncPlatformHandle(id, 'TWITTER', twitterHandle, (handle) => 
        handle.startsWith('@') ? handle : `@${handle}`
      )

      // Sync LinkedIn handle
      await this.syncPlatformHandle(id, 'LINKEDIN', linkedinUrl, (url) => 
        this.extractLinkedInHandle(url)
      )

      // Sync personal website
      await this.syncPlatformHandle(id, 'BLOG', personalWebsite, (url) => url)

    } catch (error) {
      console.error('Error syncing social handles:', error)
      throw error
    }
  }

  /**
   * Sync a specific platform handle
   */
  private async syncPlatformHandle(
    analystId: string, 
    platform: 'TWITTER' | 'LINKEDIN' | 'BLOG',
    rawData: string | null | undefined,
    transformer: (data: string) => string
  ): Promise<void> {
    const supabase = await this.getSupabase()
    
    if (rawData && rawData.trim() !== '') {
      const handle = transformer(rawData.trim())
      const displayName = platform === 'TWITTER' ? handle : handle

      // Check if handle already exists
      const { data: existing, error: checkError } = await supabase
        .from('SocialHandle')
        .select('id')
        .eq('analystId', analystId)
        .eq('platform', platform)
        .limit(1)

      if (checkError) throw checkError

      if (existing && existing.length > 0) {
        // Update existing handle
        const { error: updateError } = await supabase
          .from('SocialHandle')
          .update({
            handle,
            displayName,
            updatedAt: new Date().toISOString()
          })
          .eq('analystId', analystId)
          .eq('platform', platform)

        if (updateError) throw updateError
      } else {
        // Create new handle
        const { error: insertError } = await supabase
          .from('SocialHandle')
          .insert({
            id: `sh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            analystId,
            platform,
            handle,
            displayName,
            isActive: true,
            updatedAt: new Date().toISOString()
          })

        if (insertError) throw insertError
      }
    } else {
      // Remove handle if data is null/empty
      const { error: deleteError } = await supabase
        .from('SocialHandle')
        .delete()
        .eq('analystId', analystId)
        .eq('platform', platform)

      if (deleteError) throw deleteError
    }
  }

  /**
   * Extract LinkedIn handle from URL
   */
  private extractLinkedInHandle(url: string): string {
    const match = url.match(/linkedin\.com\/in\/([^\/]+)/)
    return match ? match[1] : url
  }

  /**
   * Sync all analysts (for batch operations)
   */
  async syncAllAnalysts(): Promise<void> {
    const supabase = await this.getSupabase()
    const { data: analysts, error } = await supabase
      .from('analysts')
      .select('id, twitterHandle, linkedinUrl, personalWebsite')
      .or('twitterHandle.not.is.null,linkedinUrl.not.is.null,personalWebsite.not.is.null')

    if (error) throw error

    for (const analyst of analysts) {
      await this.syncAnalystSocialHandles(analyst)
    }
  }

  /**
   * Remove all social handles for an analyst
   */
  async removeAnalystSocialHandles(analystId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('SocialHandle')
      .delete()
      .eq('analystId', analystId)

    if (error) throw error
  }
}

// Export utility functions for use in API routes
export async function syncAnalystSocialHandlesOnUpdate(analystData: AnalystSocialData) {
  const socialHandleSync = new SocialHandleSync()
  return socialHandleSync.syncAnalystSocialHandles(analystData)
}

export async function removeAnalystSocialHandlesOnDelete(analystId: string) {
  const socialHandleSync = new SocialHandleSync()
  return socialHandleSync.removeAnalystSocialHandles(analystId)
}