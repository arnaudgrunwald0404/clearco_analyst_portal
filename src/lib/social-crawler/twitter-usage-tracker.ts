/**
 * Twitter API Usage Tracker
 * Tracks API usage to stay within 500 requests/month limit
 */

import { createClient } from '@/lib/supabase/server'

interface UsageRecord {
  id: string
  date: string // YYYY-MM-DD format
  requests_used: number
  endpoint: string
  user_id?: string
  analyst_id?: string // TEXT type to avoid constraint issues
  created_at: string
}

interface MonthlyUsage {
  totalRequests: number
  remainingRequests: number
  dailyAverage: number
  projectedMonthly: number
  canMakeRequest: boolean
  warning?: string
}

export class TwitterUsageTracker {
  private readonly MONTHLY_LIMIT = 500
  private readonly DAILY_SAFE_LIMIT = 16 // ~500/31 days, leaving buffer
  private readonly WEEKLY_BUDGET = 115 // ~500/4.3 weeks, leaving buffer

  /**
   * Check if we can make a request based on current usage
   */
  async canMakeRequest(requestCount: number = 1): Promise<{
    allowed: boolean
    usage: MonthlyUsage
    reason?: string
  }> {
    const usage = await this.getMonthlyUsage()
    
    if (usage.totalRequests + requestCount > this.MONTHLY_LIMIT) {
      return {
        allowed: false,
        usage,
        reason: `Would exceed monthly limit (${usage.totalRequests + requestCount}/${this.MONTHLY_LIMIT})`
      }
    }

    const today = new Date().toISOString().split('T')[0]
    const todayUsage = await this.getDailyUsage(today)
    
    if (todayUsage + requestCount > this.DAILY_SAFE_LIMIT) {
      return {
        allowed: false,
        usage,
        reason: `Would exceed daily safe limit (${todayUsage + requestCount}/${this.DAILY_SAFE_LIMIT})`
      }
    }

    return { allowed: true, usage }
  }

  /**
   * Record API usage
   */
  async recordUsage(
    endpoint: string,
    requestCount: number = 1,
    userId?: string,
    analystId?: string
  ): Promise<void> {
    try {
      const supabase = await createClient()
      const today = new Date().toISOString().split('T')[0]

      // Check if we already have a record for today + endpoint
      const { data: existing } = await supabase
        .from('twitter_api_usage')
        .select('*')
        .eq('date', today)
        .eq('endpoint', endpoint)
        .eq('user_id', userId || '')
        .eq('analyst_id', analystId || '')
        .single()

      if (existing) {
        // Update existing record
        await supabase
          .from('twitter_api_usage')
          .update({
            requests_used: existing.requests_used + requestCount
          })
          .eq('id', existing.id)
      } else {
        // Create new record
        await supabase
          .from('twitter_api_usage')
          .insert({
            date: today,
            requests_used: requestCount,
            endpoint,
            user_id: userId,
            analyst_id: analystId,
            created_at: new Date().toISOString()
          })
      }
    } catch (error) {
      console.error('Failed to record Twitter API usage:', error)
      // Don't throw - usage tracking failure shouldn't break the API
    }
  }

  /**
   * Get current month's usage
   */
  async getMonthlyUsage(): Promise<MonthlyUsage> {
    try {
      const supabase = await createClient()
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startDate = startOfMonth.toISOString().split('T')[0]

      const { data: records, error } = await supabase
        .from('twitter_api_usage')
        .select('requests_used')
        .gte('date', startDate)

      if (error) throw error

      const totalRequests = records?.reduce((sum, record) => sum + record.requests_used, 0) || 0
      const remainingRequests = this.MONTHLY_LIMIT - totalRequests
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const daysPassed = now.getDate()
      const dailyAverage = daysPassed > 0 ? totalRequests / daysPassed : 0
      const projectedMonthly = dailyAverage * daysInMonth

      let warning: string | undefined
      if (projectedMonthly > this.MONTHLY_LIMIT) {
        warning = `Current usage pace will exceed monthly limit (projected: ${Math.round(projectedMonthly)})`
      } else if (totalRequests > this.MONTHLY_LIMIT * 0.8) {
        warning = `Approaching monthly limit (${totalRequests}/${this.MONTHLY_LIMIT})`
      }

      return {
        totalRequests,
        remainingRequests,
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        projectedMonthly: Math.round(projectedMonthly),
        canMakeRequest: remainingRequests > 0,
        warning
      }
    } catch (error) {
      console.error('Failed to get monthly usage:', error)
      // Return conservative estimate if tracking fails
      return {
        totalRequests: this.MONTHLY_LIMIT, // Assume we're at limit to be safe
        remainingRequests: 0,
        dailyAverage: this.DAILY_SAFE_LIMIT,
        projectedMonthly: this.MONTHLY_LIMIT,
        canMakeRequest: false,
        warning: 'Usage tracking unavailable - being conservative'
      }
    }
  }

  /**
   * Get daily usage
   */
  async getDailyUsage(date: string): Promise<number> {
    try {
      const supabase = await createClient()
      
      const { data: records, error } = await supabase
        .from('twitter_api_usage')
        .select('requests_used')
        .eq('date', date)

      if (error) throw error

      return records?.reduce((sum, record) => sum + record.requests_used, 0) || 0
    } catch (error) {
      console.error('Failed to get daily usage:', error)
      return this.DAILY_SAFE_LIMIT // Return max to be safe
    }
  }

  /**
   * Get weekly usage summary
   */
  async getWeeklyUsage(): Promise<{
    thisWeek: number
    lastWeek: number
    weeklyBudget: number
    canRunWeeklySync: boolean
  }> {
    try {
      const supabase = await createClient()
      const now = new Date()
      
      // Get start of this week (Monday)
      const thisWeekStart = new Date(now)
      thisWeekStart.setDate(now.getDate() - now.getDay() + 1)
      
      // Get start of last week
      const lastWeekStart = new Date(thisWeekStart)
      lastWeekStart.setDate(thisWeekStart.getDate() - 7)
      
      const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0]
      const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0]
      const thisWeekEndStr = thisWeekStart.toISOString().split('T')[0]

      // Get this week's usage
      const { data: thisWeekRecords } = await supabase
        .from('twitter_api_usage')
        .select('requests_used')
        .gte('date', thisWeekStartStr)

      // Get last week's usage  
      const { data: lastWeekRecords } = await supabase
        .from('twitter_api_usage')
        .select('requests_used')
        .gte('date', lastWeekStartStr)
        .lt('date', thisWeekStartStr)

      const thisWeek = thisWeekRecords?.reduce((sum, r) => sum + r.requests_used, 0) || 0
      const lastWeek = lastWeekRecords?.reduce((sum, r) => sum + r.requests_used, 0) || 0

      return {
        thisWeek,
        lastWeek,
        weeklyBudget: this.WEEKLY_BUDGET,
        canRunWeeklySync: thisWeek < this.WEEKLY_BUDGET
      }
    } catch (error) {
      console.error('Failed to get weekly usage:', error)
      return {
        thisWeek: this.WEEKLY_BUDGET,
        lastWeek: this.WEEKLY_BUDGET,
        weeklyBudget: this.WEEKLY_BUDGET,
        canRunWeeklySync: false
      }
    }
  }

  /**
   * Reset usage (for testing or new month)
   */
  async resetUsage(confirm: string): Promise<boolean> {
    if (confirm !== 'RESET_TWITTER_USAGE') {
      throw new Error('Invalid confirmation string')
    }

    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('twitter_api_usage')
        .delete()
        .neq('id', '') // Delete all records

      return !error
    } catch (error) {
      console.error('Failed to reset usage:', error)
      return false
    }
  }
}

// Export singleton
export const twitterUsageTracker = new TwitterUsageTracker()
