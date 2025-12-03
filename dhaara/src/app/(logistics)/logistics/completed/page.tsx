'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Calendar, Loader2 } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  total_amount: number
  delivered_at: string | null
  updated_at: string
  user: {
    full_name: string
    phone: string
    business_name: string
  } | null
}

export default function LogisticsCompletedPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [groupedOrders, setGroupedOrders] = useState<Record<string, Order[]>>({})

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          delivered_at,
          updated_at,
          user_id
        `)
        .eq('assigned_to', user.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(50)

      // Fetch user profiles separately
      const orders = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name, phone, business_name')
            .eq('id', order.user_id)
            .single()
          return { ...order, user: userProfile }
        })
      )

      // Group by date
      const grouped: Record<string, Order[]> = {}

      orders.forEach((order) => {
        const date = new Date(
          order.delivered_at || order.updated_at
        ).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(order)
      })

      setGroupedOrders(grouped)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const hasOrders = Object.keys(groupedOrders).length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Completed Deliveries</h1>
        <p className="text-gray-500">Your delivery history</p>
      </div>

      {!hasOrders ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Completed Deliveries Yet</h2>
          <p className="text-gray-500">Your completed deliveries will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedOrders).map(([date, dateOrders]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-700">{date}</h3>
                <span className="text-sm text-gray-500">({dateOrders.length} deliveries)</span>
              </div>

              <div className="bg-white rounded-xl border divide-y">
                {dateOrders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-sm text-gray-500">
                        {order.user?.business_name || order.user?.full_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{order.total_amount}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.delivered_at || order.updated_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}