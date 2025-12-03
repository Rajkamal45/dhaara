'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'

interface KYCActionsProps {
  userId: string
  userName: string
}

export default function KYCActions({ userId, userName }: KYCActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleApprove = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/kyc/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })

      if (!response.ok) throw new Error('Failed to approve')

      toast({
        title: 'KYC Approved!',
        description: `${userName} can now place orders.`,
        variant: 'success',
      })

      router.refresh()
      router.push('/admin/users')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please enter a reason for rejection',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/kyc/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
        }),
      })

      if (!response.ok) throw new Error('Failed to reject')

      toast({
        title: 'KYC Rejected',
        description: `${userName} has been notified.`,
        variant: 'success',
      })

      router.refresh()
      router.push('/admin/users')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <h2 className="font-semibold">KYC Verification Actions</h2>
      
      {!showRejectForm ? (
        <div className="flex gap-4">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleApprove}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve KYC
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowRejectForm(true)}
            disabled={processing}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject KYC
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Rejection Reason *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full mt-1 px-3 py-2 border rounded-lg min-h-[100px]"
            />
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowRejectForm(false)
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}