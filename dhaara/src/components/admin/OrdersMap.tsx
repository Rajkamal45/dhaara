'use client'

import dynamic from 'next/dynamic'
import { Package } from 'lucide-react'

const MapComponent = dynamic(() => import('../customer/MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <Package className="h-8 w-8 text-gray-400 animate-pulse" />
    </div>
  )
})

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  delivery_lat: number | null
  delivery_lng: number | null
  delivery_address: string
  user?: {
    business_name?: string
    full_name?: string
  } | null
}

interface OrdersMapProps {
  orders: Order[]
}

export default function OrdersMap({ orders }: OrdersMapProps) {
  const ordersWithLocation = orders.filter(o => o.delivery_lat && o.delivery_lng)

  if (ordersWithLocation.length === 0) {
    return (
      <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No orders with location data</p>
        </div>
      </div>
    )
  }

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'pending': return 'red'
      case 'confirmed': 
      case 'processing': return 'blue'
      case 'shipped': return 'orange'
      case 'delivered': return 'green'
      default: return 'gray'
    }
  }

  const markers = ordersWithLocation.map(order => ({
    lat: order.delivery_lat!,
    lng: order.delivery_lng!,
    color: getMarkerColor(order.status),
    popup: `
      <div style="min-width: 200px">
        <strong>#${order.order_number}</strong><br/>
        <span>${order.user?.business_name || order.user?.full_name || 'Customer'}</span><br/>
        <span>₹${order.total_amount}</span><br/>
        <span style="text-transform: capitalize; color: ${
          order.status === 'pending' ? '#f59e0b' :
          order.status === 'delivered' ? '#10b981' : '#3b82f6'
        }">${order.status}</span><br/>
        <small>${order.delivery_address}</small>
      </div>
    `
  }))

  // Center on first order or default
  const center: [number, number] = ordersWithLocation.length > 0
    ? [ordersWithLocation[0].delivery_lat!, ordersWithLocation[0].delivery_lng!]
    : [20.5937, 78.9629]

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          Pending
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          Confirmed/Processing
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
          Shipped
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          Delivered
        </div>
      </div>

      {/* Map */}
      <div className="h-[500px]">
        <MapComponent
          center={center}
          zoom={10}
          marker={null}
          markers={markers}
        />
      </div>
    </div>
  )
}