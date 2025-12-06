'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Package,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OrderItem {
  id: string
  quantity: number
  price: number
  unit: string
  total: number
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
  delivery_phone: string
  created_at: string
  delivered_at: string | null
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

interface DeliveryHistoryProps {
  orders: Order[]
}

export default function DeliveryHistory({ orders }: DeliveryHistoryProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Delivery History</h2>
        <p className="text-gray-500">Your completed deliveries will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Deliveries</p>
          <p className="text-2xl font-bold text-green-600">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-2xl font-bold">
            Rs. {orders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Orders List */}
      {orders.map((order) => {
        const isExpanded = expandedOrder === order.id

        return (
          <div key={order.id} className="bg-white rounded-xl border overflow-hidden">
            {/* Order Header */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">#{order.order_number}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Delivered
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
                    <p className="text-xs text-gray-500">
                      {order.delivered_at ? formatDate(order.delivered_at) : 'Delivered'}
                    </p>
                  </div>

                  <Link
                    href={`/invoice/${order.id}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </Link>

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
                      <span>{order.delivery_phone || order.user?.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500">Delivery Details</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>{order.delivery_address}, {order.delivery_city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        Ordered: {formatDate(order.created_at)}
                      </span>
                    </div>
                    {order.delivered_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          Delivered: {formatDate(order.delivered_at)}
                        </span>
                      </div>
                    )}
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
                          <span className="text-gray-500 ml-2">Rs. {item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download Invoice */}
                <div className="p-4 border-t bg-gray-50">
                  <Link href={`/invoice/${order.id}`} target="_blank">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <FileText className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
