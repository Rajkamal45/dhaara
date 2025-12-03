'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Loader2,
  Route,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const MapComponent = dynamic(() => import('../customer/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  ),
})

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  delivery_address: string
  delivery_city: string
  delivery_lat: number
  delivery_lng: number
  delivery_phone: string
  user: {
    full_name: string
    phone: string
    business_name: string
  } | null
}

export default function LogisticsMapView({ orders }: { orders: Order[] }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  const markers = orders.map((order) => ({
    lat: order.delivery_lat,
    lng: order.delivery_lng,
    color: order.status === 'processing' ? 'red' : 'blue',
    popup: `
      <div style="min-width: 200px; padding: 8px;">
        <strong>#${order.order_number}</strong><br/>
        <span>${order.user?.business_name || order.user?.full_name}</span><br/>
        <span style="font-weight: bold; color: #16a34a;">₹${order.total_amount}</span><br/>
        <span style="color: ${order.status === 'processing' ? '#ca8a04' : '#2563eb'};">
          ${order.status === 'processing' ? 'Pickup Pending' : 'Out for Delivery'}
        </span>
      </div>
    `,
  }))

  if (userLocation) {
    markers.unshift({
      lat: userLocation[0],
      lng: userLocation[1],
      color: 'green',
      popup: '<strong>📍 Your Location</strong>',
    })
  }

  const mapCenter: [number, number] = userLocation || 
    (orders.length > 0 ? [orders[0].delivery_lat, orders[0].delivery_lng] : [20.5937, 78.9629])

  const openRouteInGoogleMaps = () => {
    if (orders.length === 0) return

    const origin = userLocation 
      ? `${userLocation[0]},${userLocation[1]}`
      : `${orders[0].delivery_lat},${orders[0].delivery_lng}`

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}`
    
    if (orders.length === 1) {
      url += `&destination=${orders[0].delivery_lat},${orders[0].delivery_lng}`
    } else {
      url += `&destination=${orders[orders.length - 1].delivery_lat},${orders[orders.length - 1].delivery_lng}`
      
      if (orders.length > 1) {
        const waypoints = orders.slice(0, -1).map(o => `${o.delivery_lat},${o.delivery_lng}`).join('|')
        url += `&waypoints=${waypoints}`
      }
    }

    url += '&travelmode=driving'
    window.open(url, '_blank')
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Deliveries to Show</h2>
        <p className="text-gray-500">Orders with GPS locations will appear on the map</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl border p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            Pickup Pending ({orders.filter(o => o.status === 'processing').length})
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            Out for Delivery ({orders.filter(o => o.status === 'shipped').length})
          </div>
          {userLocation && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Your Location
            </div>
          )}
        </div>

        <Button onClick={openRouteInGoogleMaps} className="bg-purple-600 hover:bg-purple-700">
          <Route className="h-4 w-4 mr-2" />
          Open Route in Google Maps
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="h-[500px]">
          <MapComponent
            center={mapCenter}
            zoom={orders.length === 1 ? 14 : 11}
            marker={null}
            markers={markers}
          />
        </div>
      </div>

      {/* Orders List Below Map */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Delivery Sequence ({orders.length} stops)</h3>
        </div>
        <div className="divide-y">
          {orders.map((order, index) => (
            <div key={order.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                order.status === 'processing' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  #{order.order_number} - {order.user?.business_name || order.user?.full_name}
                </p>
                <p className="text-sm text-gray-500">{order.delivery_address}, {order.delivery_city}</p>
              </div>
              <p className="font-bold text-green-600">₹{order.total_amount}</p>
              <div className="flex gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                >
                  <Navigation className="h-4 w-4" />
                </a>
                <a
                  href={`tel:${order.delivery_phone}`}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}