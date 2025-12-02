'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'

interface ToggleProductStatusProps {
  productId: string
  isActive: boolean
}

export default function ToggleProductStatus({ productId, isActive }: ToggleProductStatusProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(isActive)

  const handleToggle = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !active }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      setActive(!active)
      toast({
        title: 'Status updated',
        description: `Product is now ${!active ? 'active' : 'inactive'}.`,
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
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        active ? 'bg-green-500' : 'bg-gray-300'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={active ? 'Click to deactivate' : 'Click to activate'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
          active ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}