'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  Loader2,
  PackageCheck,
  Map,
  List,
  MapPin,
  Navigation,
  Phone,
  Mail,
  User,
  UserPlus,
  Search,
  Filter,
  Download,
  MoreVertical,
  CreditCard,
  Calendar,
  Building,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'

// Dynamically import map component
const MapComponent = dynamic(() => import('../customer/MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
    </div>
  )
})

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  total_amount: number
  delivery_address: string
  delivery_city: string
  delivery_state: string
  delivery_pincode: string
  delivery_phone: string
  delivery_lat?: number | null
  delivery_lng?: number | null
  assigned_to?: string | null
  created_at: string
  user: {
    full_name: string
    email: string
    phone: string
    business_name: string
  } | null
  region: {
    name: string
    code: string
  } | null
  order_items: any[]
}

interface LogisticsUser {
  id: string
  full_name: string
  phone: string
  region_id: string
}

export default function AdminOrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const { toast } = useToast()
  
  // View states
  const [view, setView] = useState<'table' | 'map'>('table')
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null)
  
  // Logistics users
  const [logisticsUsers, setLogisticsUsers] = useState<LogisticsUser[]>([])
  const [loadingLogistics, setLoadingLogistics] = useState(false)

  // Fetch logistics users on mount
  useEffect(() => {
    fetchLogisticsUsers()
  }, [])

  const fetchLogisticsUsers = async () => {
    setLoadingLogistics(true)
    try {
      const response = await fetch('/api/admin/logistics-users')
      if (response.ok) {
        const data = await response.json()
        setLogisticsUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching logistics users:', error)
    } finally {
      setLoadingLogistics(false)
    }
  }

  // Filter and search orders
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filter !== 'all' && order.status !== filter) return false
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.order_number.toLowerCase().includes(query) ||
        order.user?.full_name?.toLowerCase().includes(query) ||
        order.user?.business_name?.toLowerCase().includes(query) ||
        order.user?.phone?.includes(query) ||
        order.delivery_city?.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  const updateStatus = async (orderId: string, newStatus: string) => {
    setProcessingId(orderId)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update order')
      }

      toast({
        title: 'Order Updated',
        description: `Order status changed to ${newStatus}`,
        variant: 'success',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    setProcessingId(orderId)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: paymentStatus }),
      })

      if (!response.ok) throw new Error('Failed to update payment status')

      toast({
        title: 'Payment Updated',
        description: `Payment marked as ${paymentStatus}`,
        variant: 'success',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const assignToLogistics = async (orderId: string, logisticsId: string) => {
    setProcessingId(orderId)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assigned_to: logisticsId,
          status: 'processing'
        }),
      })

      if (!response.ok) throw new Error('Failed to assign order')

      const logisticsUser = logisticsUsers.find(u => u.id === logisticsId)
      toast({
        title: 'Order Assigned',
        description: `Order assigned to ${logisticsUser?.full_name || 'logistics partner'}`,
        variant: 'success',
      })

      setAssigningOrder(null)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const unassignOrder = async (orderId: string) => {
    setProcessingId(orderId)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assigned_to: null,
          status: 'confirmed'
        }),
      })

      if (!response.ok) throw new Error('Failed to unassign order')

      toast({
        title: 'Order Unassigned',
        description: 'Order has been unassigned',
        variant: 'success',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string, text: string, icon: any }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
      processing: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Package },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Truck },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: PackageCheck },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    }
    const { bg, text, icon: Icon } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock }
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getPaymentBadge = (status: string, method: string) => {
    return (
      <div className="flex flex-col gap-1">
        <span className={`text-xs font-medium ${status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
          {status === 'paid' ? '✓ Paid' : '○ Pending'}
        </span>
        <span className="text-xs text-gray-400">
          {method === 'cod' ? 'COD' : method === 'bank_transfer' ? 'Bank' : method}
        </span>
      </div>
    )
  }

  const getNextStatus = (currentStatus: string) => {
    const flow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'processing',
      processing: 'shipped',
      shipped: 'delivered',
    }
    return flow[currentStatus]
  }

  const getAssignedUser = (assignedTo: string | null | undefined) => {
    if (!assignedTo) return null
    return logisticsUsers.find(u => u.id === assignedTo)
  }

  const openGoogleMapsDirections = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  // Map markers
  const ordersWithLocation = filteredOrders.filter(o => o.delivery_lat && o.delivery_lng)
  const mapMarkers = ordersWithLocation.map(order => ({
    lat: order.delivery_lat!,
    lng: order.delivery_lng!,
    color: order.status === 'pending' ? 'red' : 
           order.status === 'delivered' ? 'green' : 
           order.status === 'shipped' ? 'orange' : 'blue',
    popup: `
      <div style="min-width: 200px; padding: 8px;">
        <strong>#${order.order_number}</strong><br/>
        <span>${order.user?.business_name || order.user?.full_name || 'Customer'}</span><br/>
        <span style="font-weight: bold; color: #16a34a;">₹${order.total_amount}</span><br/>
        <span style="text-transform: capitalize;">${order.status}</span>
      </div>
    `
  }))

  const mapCenter: [number, number] = ordersWithLocation.length > 0
    ? [ordersWithLocation[0].delivery_lat!, ordersWithLocation[0].delivery_lng!]
    : [20.5937, 78.9629]

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    unassigned: orders.filter(o => !o.assigned_to && ['confirmed', 'processing'].includes(o.status)).length,
  }

  return (
    <>
      {/* Search and View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search orders, customers, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'table'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="h-4 w-4" />
            Table
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'map'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Map className="h-4 w-4" />
            Map ({ordersWithLocation.length})
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'all', label: 'All', count: stats.total },
          { key: 'pending', label: 'Pending', count: stats.pending, color: 'yellow' },
          { key: 'confirmed', label: 'Confirmed', count: stats.confirmed, color: 'blue' },
          { key: 'processing', label: 'Processing', count: stats.processing, color: 'indigo' },
          { key: 'shipped', label: 'Shipped', count: stats.shipped, color: 'purple' },
          { key: 'delivered', label: 'Delivered', count: stats.delivered, color: 'green' },
          { key: 'cancelled', label: 'Cancelled', count: stats.cancelled, color: 'red' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-gray-800 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              filter === tab.key ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
        
        {/* Unassigned filter */}
        {stats.unassigned > 0 && (
          <button
            onClick={() => setFilter('unassigned')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border-2 border-dashed ${
              filter === 'unassigned'
                ? 'bg-orange-100 border-orange-400 text-orange-700'
                : 'border-orange-300 text-orange-600 hover:bg-orange-50'
            }`}
          >
            <UserPlus className="h-3 w-3 inline mr-1" />
            Unassigned
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-orange-200">
              {stats.unassigned}
            </span>
          </button>
        )}
      </div>

      {/* Map View */}
      {view === 'map' && (
        <div className="space-y-4">
          {/* Map Legend */}
          <div className="flex flex-wrap gap-4 text-sm bg-white p-3 rounded-lg border">
            <span className="font-medium">Status:</span>
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

          {ordersWithLocation.length === 0 ? (
            <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center border">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No orders with location data</p>
              </div>
            </div>
          ) : (
            <div className="h-[500px] rounded-lg overflow-hidden border">
              <MapComponent
                center={mapCenter}
                zoom={ordersWithLocation.length === 1 ? 14 : 10}
                marker={null}
                markers={mapMarkers}
              />
            </div>
          )}

          {/* Order Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ordersWithLocation.map((order) => (
              <div key={order.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">#{order.order_number}</p>
                    <p className="text-sm text-gray-500">{order.user?.business_name || order.user?.full_name}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{order.delivery_address}, {order.delivery_city}</p>
                
                {/* Assigned To */}
                {order.assigned_to && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-purple-50 rounded text-sm">
                    <Truck className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-700">{getAssignedUser(order.assigned_to)?.full_name || 'Assigned'}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <p className="font-bold text-green-600">₹{order.total_amount}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewingOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openGoogleMapsDirections(order.delivery_lat!, order.delivery_lng!)}>
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white border rounded-lg">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try a different search term' : 'Orders will appear here when customers place them'}
              </p>
            </div>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Order</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Customer</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Location</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Payment</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Assigned To</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOrders
                      .filter(order => {
                        if (filter === 'unassigned') {
                          return !order.assigned_to && ['confirmed', 'processing'].includes(order.status)
                        }
                        return true
                      })
                      .map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold">#{order.order_number}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium flex items-center gap-1">
                            <Building className="h-3 w-3 text-gray-400" />
                            {order.user?.business_name || order.user?.full_name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.user?.phone || order.delivery_phone || 'No phone'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {order.delivery_lat && order.delivery_lng ? (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm">{order.delivery_city}</p>
                                <button
                                  onClick={() => openGoogleMapsDirections(order.delivery_lat!, order.delivery_lng!)}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Get Directions →
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              No GPS
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-green-600 text-lg">₹{order.total_amount}</p>
                          <p className="text-xs text-gray-400">{order.order_items?.length || 0} items</p>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-4 py-3">
                          {getPaymentBadge(order.payment_status, order.payment_method)}
                        </td>
                        <td className="px-4 py-3">
                          {order.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <Truck className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{getAssignedUser(order.assigned_to)?.full_name || 'Assigned'}</p>
                                <button
                                  onClick={() => unassignOrder(order.id)}
                                  className="text-xs text-red-600 hover:underline"
                                  disabled={processingId === order.id}
                                >
                                  Unassign
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              onClick={() => setAssigningOrder(order)}
                              disabled={!['confirmed', 'processing', 'pending'].includes(order.status)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setViewingOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>

                            {order.status === 'delivered' && (
                              <Link href={`/invoice/${order.id}`} target="_blank">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}

                            {getNextStatus(order.status) && !order.assigned_to && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateStatus(order.id, getNextStatus(order.status)!)}
                                disabled={processingId === order.id}
                              >
                                {processingId === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  getNextStatus(order.status)?.charAt(0).toUpperCase() + getNextStatus(order.status)?.slice(1)
                                )}
                              </Button>
                            )}

                            {['pending', 'confirmed'].includes(order.status) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatus(order.id, 'cancelled')}
                                disabled={processingId === order.id}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Assign Order Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Assign Order</h2>
                <button
                  onClick={() => setAssigningOrder(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">#{assigningOrder.order_number}</p>
                <p className="text-sm text-gray-600">{assigningOrder.user?.business_name || assigningOrder.user?.full_name}</p>
                <p className="text-sm text-gray-500">{assigningOrder.delivery_city}</p>
                <p className="text-lg font-bold text-green-600 mt-2">₹{assigningOrder.total_amount}</p>
              </div>

              <h3 className="font-medium mb-3">Select Logistics Partner</h3>
              
              {loadingLogistics ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </div>
              ) : logisticsUsers.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No logistics partners available</p>
                  <p className="text-sm">Add users with 'logistics' role first</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {logisticsUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => assignToLogistics(assigningOrder.id, user.id)}
                      disabled={processingId === assigningOrder.id}
                      className="w-full p-3 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center gap-3 text-left"
                    >
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Truck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      </div>
                      {processingId === assigningOrder.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                      ) : (
                        <UserPlus className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Order #{viewingOrder.order_number}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(viewingOrder.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Status & Assignment */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Order Status</p>
                  {getStatusBadge(viewingOrder.status)}
                </div>
                <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Payment</p>
                  {getPaymentBadge(viewingOrder.payment_status, viewingOrder.payment_method)}
                </div>
                <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Assigned To</p>
                  {viewingOrder.assigned_to ? (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">{getAssignedUser(viewingOrder.assigned_to)?.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not assigned</span>
                  )}
                </div>
              </div>

              {/* Customer & Delivery Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Customer
                  </h3>
                  <p className="font-medium">{viewingOrder.user?.full_name}</p>
                  <p className="text-sm text-gray-600">{viewingOrder.user?.business_name}</p>
                  <div className="mt-2 space-y-1">
                    <a href={`mailto:${viewingOrder.user?.email}`} className="text-sm text-blue-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {viewingOrder.user?.email}
                    </a>
                    <a href={`tel:${viewingOrder.user?.phone}`} className="text-sm text-blue-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {viewingOrder.user?.phone}
                    </a>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Delivery Address
                  </h3>
                  <p className="text-sm">{viewingOrder.delivery_address}</p>
                  <p className="text-sm">{viewingOrder.delivery_city}, {viewingOrder.delivery_state}</p>
                  <p className="text-sm">{viewingOrder.delivery_pincode}</p>
                  <p className="text-sm font-medium mt-2">{viewingOrder.delivery_phone}</p>
                  {viewingOrder.delivery_lat && viewingOrder.delivery_lng && (
                    <button
                      onClick={() => openGoogleMapsDirections(viewingOrder.delivery_lat!, viewingOrder.delivery_lng!)}
                      className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Navigation className="h-4 w-4" />
                      Open in Google Maps
                    </button>
                  )}
                </div>
              </div>

              {/* Mini Map */}
              {viewingOrder.delivery_lat && viewingOrder.delivery_lng && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Delivery Location</h3>
                  <div className="h-[200px] rounded-lg overflow-hidden border">
                    <MapComponent
                      center={[viewingOrder.delivery_lat, viewingOrder.delivery_lng]}
                      zoom={15}
                      marker={[viewingOrder.delivery_lat, viewingOrder.delivery_lng]}
                    />
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Order Items ({viewingOrder.order_items?.length || 0})</h3>
                <div className="border rounded-lg divide-y">
                  {viewingOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="p-3 flex items-center gap-3">
                      <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 m-3 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name || 'Product'}</p>
                        <p className="text-sm text-gray-500">{item.quantity} {item.unit} × ₹{item.price}</p>
                      </div>
                      <p className="font-bold">₹{item.total}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg mb-6">
                <span className="font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-green-600">₹{viewingOrder.total_amount}</span>
              </div>

              {/* Download Invoice - Only for delivered orders */}
              {viewingOrder.status === 'delivered' && (
                <div className="mb-6">
                  <Link href={`/invoice/${viewingOrder.id}`} target="_blank">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <FileText className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  </Link>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-4">
                {/* Status Update */}
                <div>
                  <h3 className="font-semibold mb-2">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={viewingOrder.status === status ? 'default' : 'outline'}
                        className={viewingOrder.status === status ? 'bg-green-600' : ''}
                        onClick={() => {
                          updateStatus(viewingOrder.id, status)
                          setViewingOrder({ ...viewingOrder, status })
                        }}
                        disabled={processingId === viewingOrder.id}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <h3 className="font-semibold mb-2">Payment Status</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={viewingOrder.payment_status === 'pending' ? 'default' : 'outline'}
                      className={viewingOrder.payment_status === 'pending' ? 'bg-orange-600' : ''}
                      onClick={() => {
                        updatePaymentStatus(viewingOrder.id, 'pending')
                        setViewingOrder({ ...viewingOrder, payment_status: 'pending' })
                      }}
                      disabled={processingId === viewingOrder.id}
                    >
                      Pending
                    </Button>
                    <Button
                      size="sm"
                      variant={viewingOrder.payment_status === 'paid' ? 'default' : 'outline'}
                      className={viewingOrder.payment_status === 'paid' ? 'bg-green-600' : ''}
                      onClick={() => {
                        updatePaymentStatus(viewingOrder.id, 'paid')
                        setViewingOrder({ ...viewingOrder, payment_status: 'paid' })
                      }}
                      disabled={processingId === viewingOrder.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Paid
                    </Button>
                  </div>
                </div>

                {/* Assign Logistics */}
                {!viewingOrder.assigned_to && ['confirmed', 'processing', 'pending'].includes(viewingOrder.status) && (
                  <div>
                    <h3 className="font-semibold mb-2">Assign to Logistics</h3>
                    <Button
                      onClick={() => {
                        setViewingOrder(null)
                        setAssigningOrder(viewingOrder)
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Delivery Partner
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}