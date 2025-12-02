import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import UserFilters from '@/components/admin/UserFilters'
import UserTable from '@/components/admin/UserTable'
interface PageProps {
  searchParams: { 
    role?: string
    status?: string
    region?: string
    search?: string
    page?: string
  }
}

async function getUsers(searchParams: PageProps['searchParams'], adminProfile: any) {
  const supabase = createClient()
  
  const isSuper = adminProfile.admin_role === 'super_admin'
  const page = parseInt(searchParams.page || '1')
  const perPage = 10
  const offset = (page - 1) * perPage

  let query = supabase
    .from('profiles')
    .select('*, region:regions(name, code)', { count: 'exact' })

  // Filter by role
  if (searchParams.role) {
    query = query.eq('role', searchParams.role)
  }

  // Filter by KYC status
  if (searchParams.status) {
    query = query.eq('kyc_status', searchParams.status)
  }

  // Filter by region (super admin can see all, regional admin sees own region)
  if (!isSuper) {
    query = query.eq('region_id', adminProfile.region_id)
  } else if (searchParams.region) {
    query = query.eq('region_id', searchParams.region)
  }

  // Search
  if (searchParams.search) {
    query = query.or(`full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,business_name.ilike.%${searchParams.search}%`)
  }

  const { data: users, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  return {
    users: users || [],
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  }
}

async function getRegions() {
  const supabase = createClient()
  const { data } = await supabase
    .from('regions')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')
  return data || []
}

export default async function UsersPage({ searchParams }: PageProps) {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const isSuper = profile.admin_role === 'super_admin'
  const [{ users, total, page, totalPages }, regions] = await Promise.all([
    getUsers(searchParams, profile),
    isSuper ? getRegions() : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, admins, and logistics partners
          </p>
        </div>
        <Link
          href="/admin/users/create"
          className="inline-flex items-center gap-2 bg-admin text-white px-4 py-2 rounded-lg hover:bg-admin/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Link>
      </div>

      {/* Filters */}
      <UserFilters 
        regions={regions} 
        isSuper={isSuper}
        currentFilters={searchParams}
      />

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">
          Showing {users.length} of {total} users
        </span>
      </div>

      {/* Table */}
      <UserTable users={users} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/users?${new URLSearchParams({ 
                ...(searchParams.role && { role: searchParams.role }),
                ...(searchParams.status && { status: searchParams.status }),
                ...(searchParams.region && { region: searchParams.region }),
                ...(searchParams.search && { search: searchParams.search }),
                page: p.toString() 
              }).toString()}`}
              className={`px-3 py-1 rounded ${
                p === page ? 'bg-admin text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}