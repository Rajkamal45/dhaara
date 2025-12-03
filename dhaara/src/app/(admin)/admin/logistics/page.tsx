import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogisticsManagement from '@/components/admin/LogisticsManagement'

export default async function AdminLogisticsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  // Fetch logistics users
  const { data: logisticsUsers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'logistics')
    .order('created_at', { ascending: false })

  // Fetch regions for assignment
  const { data: regions } = await supabase
    .from('regions')
    .select('*')
    .eq('is_active', true)
    .order('name')

  // Get delivery stats for each logistics user
  const logisticsWithStats = await Promise.all(
    (logisticsUsers || []).map(async (logUser) => {
      const { count: totalDeliveries } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', logUser.id)
        .eq('status', 'delivered')

      const { count: activeDeliveries } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', logUser.id)
        .in('status', ['processing', 'shipped'])

      return {
        ...logUser,
        total_deliveries: totalDeliveries || 0,
        active_deliveries: activeDeliveries || 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logistics Management</h1>
        <p className="text-gray-500">Manage delivery partners and track their performance</p>
      </div>

      <LogisticsManagement 
        logisticsUsers={JSON.parse(JSON.stringify(logisticsWithStats))}
        regions={JSON.parse(JSON.stringify(regions || []))}
      />
    </div>
  )
}