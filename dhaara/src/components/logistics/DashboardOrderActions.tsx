'use client'

import { useState } from 'react'
import { Truck, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardOrderActionsProps {
  orderId: string
  status: string
}

export default function DashboardOrderActions({ orderId, status }: DashboardOrderActionsProps) {
  const [updating, setUpdating] = useState(false)

  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true)
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
      setUpdating(false)
    }
  }

  if (status === 'pending' || status === 'confirmed' || status === 'processing') {
    return (
      <Button
        size="sm"
        onClick={() => updateOrderStatus('shipped')}
        disabled={updating}
        className="bg-blue-600 hover:bg-blue-700 text-xs"
      >
        {updating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <Truck className="h-3 w-3 mr-1" />
            Picked Up
          </>
        )}
      </Button>
    )
  }

  if (status === 'shipped') {
    return (
      <Button
        size="sm"
        onClick={() => updateOrderStatus('delivered')}
        disabled={updating}
        className="bg-green-600 hover:bg-green-700 text-xs"
      >
        {updating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </>
        )}
      </Button>
    )
  }

  return null
}
