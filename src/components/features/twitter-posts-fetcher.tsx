'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Twitter, ExternalLink, Heart, Repeat, MessageCircle, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TwitterPost {
  id: string
  content: string
  url: string
  platform: 'TWITTER'
  published_at: string
  engagement_metrics: {
    likes: number
    retweets: number
    replies: number
    quotes: number
  }
  user_data: {
    username: string
    display_name: string
    followers_count: number
    verified: boolean
    profile_image_url: string
  }
}

interface FetchResult {
  tweets: TwitterPost[]
  total: number
  stored?: number
}

export default function TwitterPostsFetcher() {
  const [userId, setUserId] = useState('')
  const [count, setCount] = useState(10) // Reduced default from 20 to 10
  const [loading, setLoading] = useState(false)
  const [tweets, setTweets] = useState<TwitterPost[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<{ userId: string; count: number } | null>(null)
  const [usageWarning, setUsageWarning] = useState<string | null>(null)

  // Check usage on component mount
  useEffect(() => {
    checkUsage()
  }, [])

  const checkUsage = async () => {
    try {
      const response = await fetch('/api/social-media/twitter-usage')
      const result = await response.json()
      
      if (result.success) {
        const { monthly } = result.data
        if (monthly.totalRequests >= 450) {
          setUsageWarning(`⚠️ High usage: ${monthly.totalRequests}/500 requests used this month`)
        } else if (monthly.projectedMonthly > 500) {
          setUsageWarning(`📈 Current pace will exceed monthly limit (projected: ${monthly.projectedMonthly})`)
        }
      }
    } catch (error) {
      console.error('Failed to check usage:', error)
    }
  }

  const fetchTweets = async (store: boolean = false) => {
    if (!userId.trim()) {
      setError('Please enter a Twitter User ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        userId: userId.trim(),
        count: count.toString(),
        store: store.toString()
      })

      const response = await fetch(`/api/social-media/twitter-fetch?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tweets')
      }

      const data: FetchResult = result.data
      setTweets(data.tweets || [])
      setLastFetch({ userId: userId.trim(), count })
      
      console.log(`✅ Fetched ${data.tweets?.length || 0} tweets${store ? ` and stored ${data.stored || 0}` : ''}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching tweets:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-blue-500" />
            Twitter Posts Fetcher
          </CardTitle>
          <CardDescription>
            Fetch Twitter posts using RapidAPI's Twitter241 service. Enter a numeric Twitter User ID to get their recent tweets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{usageWarning}</AlertDescription>
            </Alert>
          )}
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Rate Limited:</strong> 500 requests/month. Each fetch uses 1 request. 
              Use sparingly and consider the weekly sync for regular updates.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter Twitter User ID (e.g., 2455740283)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="w-24">
              <Input
                type="number"
                min="1"
                max="50"
                placeholder="Count"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => fetchTweets(false)} 
              disabled={loading || !userId.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                'Fetch Tweets'
              )}
            </Button>
            <Button 
              onClick={() => fetchTweets(true)} 
              disabled={loading || !userId.trim()}
              variant="outline"
            >
              Fetch & Store
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {tweets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Results ({tweets.length} tweets)
            </CardTitle>
            {lastFetch && (
              <CardDescription>
                Fetched from User ID: {lastFetch.userId}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {tweets.map((tweet) => (
              <Card key={tweet.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={tweet.user_data.profile_image_url}
                      alt={tweet.user_data.display_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{tweet.user_data.display_name}</span>
                        {tweet.user_data.verified && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          @{tweet.user_data.username}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(tweet.user_data.followers_count)} followers
                        </span>
                      </div>
                      
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {tweet.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {formatNumber(tweet.engagement_metrics.likes)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Repeat className="h-4 w-4" />
                            {formatNumber(tweet.engagement_metrics.retweets)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {formatNumber(tweet.engagement_metrics.replies)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span>{formatDate(tweet.published_at)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => window.open(tweet.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {tweets.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Twitter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter a Twitter User ID above to fetch their recent tweets</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
