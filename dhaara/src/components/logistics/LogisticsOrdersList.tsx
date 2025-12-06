'use client'

import { useState } from 'react'
import {
  Package,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  Truck,
  Navigation,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  product: {
    name: string
    image_url: string | null
  } | null
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  delivery_address: string
  delivery_city: string
  delivery_lat: number | null
  delivery_lng: number | null
  delivery_phone: string
  created_at: string
  user: {
    full_name: string | null
    phone: string | null
    email: string | null
    business_name: string | null
  } | null
  region: {
    name: string
  } | null
  order_items: OrderItem[]
}

interface LogisticsOrdersListProps {
  orders: Order[]
}

export default function LogisticsOrdersList({ orders }: LogisticsOrdersListProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId)
    try {
      const response = await fetch(`/api/logistics/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Active Deliveries</h2>
        <p className="text-gray-500">You do not have any orders assigned to you right now</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const isExpanded = expandedOrder === order.id
        const isUpdating = updatingOrder === order.id

        return (
          <div key={order.id} className="bg-white rounded-xl border overflow-hidden">
            {/* Order Header */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    order.status === 'shipped'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {order.status === 'shipped' ? (
                      <Truck className="h-6 w-6" />
                    ) : (
                      <Package className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">#{order.order_number}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'shipped' ? 'Out for Delivery' : 'Ready for Pickup'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.user?.business_name || order.user?.full_name || 'Customer'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="font-bold text-green-600">Rs. {order.total_amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">{order.order_items.length} items</p>
                  </div>

                  {/* Quick Action Buttons */}
                  {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateOrderStatus(order.id, 'shipped')
                      }}
                      disabled={isUpdating}
                      className="bg-blue-600 hover:bg-blue-700 text-xs"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Truck className="h-3 w-3 mr-1" />
                          Picked Up
                        </>
                      )}
                    </Button>
                  )}

                  {order.status === 'shipped' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateOrderStatus(order.id, 'delivered')
                      }}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Delivered
                        </>
                      )}
                    </Button>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t">
                {/* Customer & Delivery Info */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500">Customer Details</h4>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{order.user?.full_name || 'N/A'}</span>
                    </div>
                    {order.user?.business_name && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{order.user.business_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a
                        href={`tel:${order.delivery_phone || order.user?.phone}`}
                        className="text-purple-600 hover:underline"
                      >
                        {order.delivery_phone || order.user?.phone || 'N/A'}
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500">Delivery Address</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>{order.delivery_address}, {order.delivery_city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Ordered: {formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 border-t">
                  <h4 className="font-medium text-sm text-gray-500 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <span>{item.product?.name || 'Product'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">x{item.quantity}</span>
                          <span className="text-gray-500 ml-2">@ Rs. {item.unit_price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-3">
                  {order.delivery_lat && order.delivery_lng && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Navigation className="h-4 w-4" />
                      Navigate
                    </a>
                  )}

                  <a
                    href={`tel:${order.delivery_phone || order.user?.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <Phone className="h-4 w-4" />
                    Call Customer
                  </a>

                  {order.status === 'delivered' && (
                    <Link
                      href={`/invoice/${order.id}`}
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FileText className="h-4 w-4" />
                      Download Invoice
                    </Link>
                  )}

                  <div className="flex-1" />

                  {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      disabled={isUpdating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Truck className="h-4 w-4 mr-2" />
                      )}
                      Mark as Picked Up
                    </Button>
                  )}

                  {order.status === 'shipped' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
