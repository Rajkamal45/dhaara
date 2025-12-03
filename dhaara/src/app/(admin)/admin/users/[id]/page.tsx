import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Building2, Phone, Mail, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react'
import KYCActions from '@/components/admin/KYCActions'

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, admin_role, region_id')
    .eq('id', authUser.id)
    .single()

  if (adminProfile?.role !== 'admin') redirect('/')

  // Fetch user details
  const { data: userProfile, error } = await supabase
    .from('profiles')
    .select('*, region:regions(name, code)')
    .eq('id', params.id)
    .single()

  if (error || !userProfile) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="h-4 w-4" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            Not Submitted
          </span>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link 
        href="/admin/users" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-green-700">
              {userProfile.full_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{userProfile.full_name}</h1>
            <p className="text-muted-foreground">{userProfile.email}</p>
          </div>
        </div>
        {getStatusBadge(userProfile.kyc_status)}
      </div>

      {/* User Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Name</span>
              <span className="font-medium">{userProfile.full_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{userProfile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{userProfile.phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{userProfile.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Region</span>
              <span className="font-medium">{userProfile.region?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">
                {new Date(userProfile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Name</span>
              <span className="font-medium">{userProfile.business_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Type</span>
              <span className="font-medium capitalize">{userProfile.business_type || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST Number</span>
              <span className="font-medium font-mono">{userProfile.gst_number || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PAN Number</span>
              <span className="font-medium font-mono">{userProfile.pan_number || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Address
        </h2>
        <p className="text-sm">
          {userProfile.address ? (
            `${userProfile.address}, ${userProfile.city || ''}, ${userProfile.state || ''} - ${userProfile.pincode || ''}`
          ) : (
            <span className="text-muted-foreground">No address provided</span>
          )}
        </p>
      </div>

      {/* Rejection Reason if rejected */}
      {userProfile.kyc_status === 'rejected' && userProfile.kyc_rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            <strong>Rejection Reason:</strong> {userProfile.kyc_rejection_reason}
          </p>
        </div>
      )}

      {/* KYC Actions - Only show if pending */}
      {userProfile.kyc_status === 'pending' && (
        <KYCActions 
          userId={userProfile.id} 
          userName={userProfile.full_name || userProfile.email} 
        />
      )}
    </div>
  )
}