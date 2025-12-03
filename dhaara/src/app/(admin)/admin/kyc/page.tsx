import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserCheck, Clock, CheckCircle, XCircle } from 'lucide-react'
import KYCTable from '@/components/admin/KYCTable'

export default async function AdminKYCPage() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const isSuper = profile.admin_role === 'super_admin'

  // Fetch pending KYC requests
  let query = supabase
    .from('profiles')
    .select('*, region:regions(name, code)')
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  // Regional admin only sees their region
  if (!isSuper && profile.region_id) {
    query = query.eq('region_id', profile.region_id)
  }

  const { data: users } = await query

  // Count stats
  const pending = users?.filter(u => u.kyc_status === 'pending').length || 0
  const approved = users?.filter(u => u.kyc_status === 'approved').length || 0
  const rejected = users?.filter(u => u.kyc_status === 'rejected').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground">Approve or reject customer verifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{pending}</p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{approved}</p>
              <p className="text-sm text-green-600">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{rejected}</p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Table */}
      <KYCTable users={JSON.parse(JSON.stringify(users || []))} />
    </div>
  )
}