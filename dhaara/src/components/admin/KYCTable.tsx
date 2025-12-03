'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, User, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'

interface KYCUser {
  id: string
  full_name: string
  email: string
  phone?: string
  business_name?: string
  business_type?: string
  gst_number?: string
  pan_number?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  kyc_status: string
  kyc_rejection_reason?: string
  created_at: string
  region?: {
    name: string
    code: string
  }
}

export default function KYCTable({ users }: { users: KYCUser[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [viewingUser, setViewingUser] = useState<KYCUser | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    return user.kyc_status === filter
  })

  const handleApprove = async (userId: string) => {
    setProcessingId(userId)
    try {
      const response = await fetch(`/api/admin/kyc/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })

      if (!response.ok) throw new Error('Failed to approve')

      toast({
        title: 'KYC Approved',
        description: 'User can now place orders.',
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

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please enter a reason for rejection',
        variant: 'destructive',
      })
      return
    }

    setProcessingId(userId)
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
        description: 'User has been notified.',
        variant: 'success',
      })

      setViewingUser(null)
      setRejectionReason('')
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
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Rejected</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Not Submitted</span>
    }
  }

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && users.filter(u => u.kyc_status === 'pending').length > 0 && (
              <span className="ml-2 bg-white text-green-600 px-1.5 rounded-full text-xs">
                {users.filter(u => u.kyc_status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No {filter} requests</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Business</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Region</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.business_name || '-'}</p>
                    <p className="text-sm text-muted-foreground">{user.business_type || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.phone || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.region?.name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(user.kyc_status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* View Details */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {user.kyc_status === 'pending' && (
                        <>
                          {/* Approve */}
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(user.id)}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Reject */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setViewingUser(user)}
                            disabled={processingId === user.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">User Details</h2>
                <button
                  onClick={() => {
                    setViewingUser(null)
                    setRejectionReason('')
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-medium">{viewingUser.full_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{viewingUser.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{viewingUser.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Business Name</p>
                    <p className="font-medium">{viewingUser.business_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Business Type</p>
                    <p className="font-medium">{viewingUser.business_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">GST Number</p>
                    <p className="font-medium font-mono">{viewingUser.gst_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">PAN Number</p>
                    <p className="font-medium font-mono">{viewingUser.pan_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Region</p>
                    <p className="font-medium">{viewingUser.region?.name || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-sm">Address</p>
                  <p className="font-medium">
                    {viewingUser.address ? (
                      `${viewingUser.address}, ${viewingUser.city}, ${viewingUser.state} - ${viewingUser.pincode}`
                    ) : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground text-sm">Status</p>
                  {getStatusBadge(viewingUser.kyc_status)}
                </div>

                {viewingUser.kyc_status === 'rejected' && viewingUser.kyc_rejection_reason && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {viewingUser.kyc_rejection_reason}
                    </p>
                  </div>
                )}

                {/* Actions for Pending */}
                {viewingUser.kyc_status === 'pending' && (
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm min-h-[80px]"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(viewingUser.id)}
                        disabled={processingId === viewingUser.id}
                      >
                        {processingId === viewingUser.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        className="flex-1"
                        variant="destructive"
                        onClick={() => handleReject(viewingUser.id)}
                        disabled={processingId === viewingUser.id || !rejectionReason.trim()}
                      >
                        {processingId === viewingUser.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
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