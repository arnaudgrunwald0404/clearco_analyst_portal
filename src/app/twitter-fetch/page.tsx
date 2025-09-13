import TwitterPostsFetcher from '@/components/features/twitter-posts-fetcher'
import TwitterUsageDashboard from '@/components/features/twitter-usage-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TwitterFetchPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Twitter API Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage Twitter API usage and fetch posts. <strong>Limited to 500 requests/month</strong> - use conservatively!
        </p>
      </div>
      
      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usage">Usage Dashboard</TabsTrigger>
          <TabsTrigger value="fetch">Fetch Tweets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage">
          <TwitterUsageDashboard />
        </TabsContent>
        
        <TabsContent value="fetch">
          <TwitterPostsFetcher />
        </TabsContent>
      </Tabs>
    </div>
  )
}
