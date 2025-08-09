'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Slot {
  id: string
  start_time: string
  end_time: string
}

export function AvailabilitySlots() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await fetch('/api/availability-slots')
        const result = await response.json()
        if (result.success) {
          setSlots(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch slots.')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    fetchSlots()
  }, [])

  const handleBookSlot = async (slotId: string) => {
    setIsBooking(slotId)
    try {
      const response = await fetch('/api/briefings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId }),
      })
      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Your briefing request has been submitted.',
        })
        // Optimistically remove the booked slot from the list
        setSlots(prevSlots => prevSlots.filter(s => s.id !== slotId))
      } else {
        throw new Error(result.error || 'Failed to book slot.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsBooking(null)
    }
  }

  const groupedSlots = slots.reduce((acc, slot) => {
    const date = new Date(slot.start_time).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(slot)
    return acc
  }, {} as Record<string, Slot[]>)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule a Briefing</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule a Briefing</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-red-600">
          <p>Error loading available times: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule a Briefing</CardTitle>
        <p className="text-sm text-gray-500">Select an available time slot to request a briefing.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.keys(groupedSlots).length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            There are no available briefing slots at this time. Please check back later.
          </p>
        ) : (
          Object.entries(groupedSlots).map(([date, slotsForDay]) => (
            <div key={date}>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-gray-600" />
                {date}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {slotsForDay.map(slot => (
                  <Button
                    key={slot.id}
                    variant="outline"
                    className="flex flex-col h-auto items-center justify-center p-4 space-y-1"
                    onClick={() => handleBookSlot(slot.id)}
                    disabled={isBooking === slot.id}
                  >
                    {isBooking === slot.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span className="text-lg font-medium">
                          {new Date(slot.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {` - ${new Date(slot.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}`}
                        </span>
                      </>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
