'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  PackageCheck,
  Loader2,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'

export default function MyOrdersPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/my-orders')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (name, image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel order')
      }

      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled successfully.',
        variant: 'success',
      })

      fetchOrders()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setCancellingId(null)
      setCancelConfirmId(null)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', iconColor: 'text-yellow-500' }
      case 'confirmed':
        return { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', iconColor: 'text-blue-500' }
      case 'processing':
        return { label: 'Processing', color: 'bg-indigo-100 text-indigo-700', iconColor: 'text-indigo-500' }
      case 'shipped':
        return { label: 'Shipped', color: 'bg-purple-100 text-purple-700', iconColor: 'text-purple-500' }
      case 'delivered':
        return { label: 'Delivered', color: 'bg-green-100 text-green-700', iconColor: 'text-green-500' }
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-700', iconColor: 'text-red-500' }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', iconColor: 'text-gray-500' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'processing': return <Package className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'delivered': return <PackageCheck className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-medium mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Browse Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status)
            const canCancel = ['pending', 'confirmed'].includes(order.status)
            const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
            const currentStepIndex = statusSteps.indexOf(order.status)
            const isCancelled = order.status === 'cancelled'

            return (
              <div key={order.id} className="bg-white rounded-lg border overflow-hidden">
                {/* Order Header */}
                <div className="p-4 bg-gray-50 border-b flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">Order #{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      {getStatusIcon(order.status)}
                      {statusInfo.label}
                    </span>
                    <p className="font-bold text-green-600 text-lg">₹{order.total_amount}</p>
                  </div>
                </div>

                {/* Status Timeline (only if not cancelled) */}
                {!isCancelled && (
                  <div className="px-4 py-6 border-b">
                    <div className="flex items-center justify-between relative">
                      {/* Progress Line */}
                      <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10">
                        <div 
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                        />
                      </div>

                      {statusSteps.map((step, index) => {
                        const stepInfo = getStatusInfo(step)
                        const isCompleted = index <= currentStepIndex
                        const isCurrent = index === currentStepIndex

                        return (
                          <div key={step} className="flex flex-col items-center z-10">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              isCompleted ? 'bg-green-500' : 'bg-gray-200'
                            } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                              <span className={isCompleted ? 'text-white' : 'text-gray-400'}>
                                {getStatusIcon(step)}
                              </span>
                            </div>
                            <p className={`text-xs mt-2 hidden sm:block ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                              {stepInfo.label}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="p-4">
                  <div className="flex flex-wrap gap-4">
                    {order.order_items?.slice(0, 4).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product?.name || 'Product'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.product?.name || 'Product'}</p>
                          <p className="text-xs text-gray-500">{item.quantity} {item.unit} × ₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                    {order.order_items?.length > 4 && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500">
                          +{order.order_items.length - 4} more items
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delivery Address */}
                  {order.delivery_address && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Delivery:</span>{' '}
                        {order.delivery_address}, {order.delivery_city}, {order.delivery_state} - {order.delivery_pincode}
                      </p>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Payment:</span>{' '}
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                      {' • '}
                      <span className={order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </p>
                  </div>

                  {/* Download Invoice Button - Only for delivered orders */}
                  {order.status === 'delivered' && (
                    <div className="mt-4 pt-4 border-t">
                      <Link href={`/invoice/${order.id}`} target="_blank">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Download Invoice
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Cancel Button */}
                  {canCancel && (
                    <div className="mt-4 pt-4 border-t">
                      {cancelConfirmId !== order.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setCancelConfirmId(order.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Order
                        </Button>
                      ) : (
                        <div className="flex items-center gap-4 p-3 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-700">Cancel this order?</p>
                            <p className="text-xs text-red-600">This action cannot be undone.</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCancelConfirmId(null)}
                              disabled={cancellingId === order.id}
                            >
                              No, Keep
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancel(order.id)}
                              disabled={cancellingId === order.id}
                            >
                              {cancellingId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Yes, Cancel'
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
