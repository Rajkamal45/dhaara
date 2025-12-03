'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import LogisticsMapView from '@/components/logistics/LogisticsMapView'

export default function LogisticsMapPage() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true

    const fetchOrders = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('orders')
          .select(`
            *
          `)
          .eq('assigned_to', user.id)
          .in('status', ['pending', 'confirmed', 'processing', 'shipped'])
          .not('delivery_lat', 'is', null)
          .not('delivery_lng', 'is', null)
          .order('created_at', { ascending: true })

        // Fetch user profiles separately
        const ordersWithUsers = await Promise.all(
          (data || []).map(async (order) => {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('full_name, phone, business_name')
              .eq('id', order.user_id)
              .single()
            return { ...order, user: userProfile }
          })
        )

        if (isMounted) {
          setOrders(ordersWithUsers)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchOrders()

    return () => {
      isMounted = false
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Delivery Route Map</h1>
        <p className="text-gray-500">View all your deliveries on the map</p>
      </div>

      <LogisticsMapView orders={orders} />
    </div>
  )
}