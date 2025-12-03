import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogisticsOrdersList from '@/components/logistics/LogisticsOrdersList'

export default async function LogisticsOrdersPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'logistics') redirect('/')

  // Fetch assigned orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      region:regions (name),
      order_items (
        *,
        product:products (name, image_url)
      )
    `)
    .eq('assigned_to', user.id)
    .in('status', ['pending', 'confirmed', 'processing', 'shipped'])
    .order('created_at', { ascending: true })

  // Fetch user profiles separately for each order
  const ordersWithUsers = await Promise.all(
    (orders || []).map(async (order) => {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name, phone, email, business_name')
        .eq('id', order.user_id)
        .single()
      return { ...order, user: userProfile }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Deliveries</h1>
        <p className="text-gray-500">Manage your assigned orders</p>
      </div>

      <LogisticsOrdersList orders={JSON.parse(JSON.stringify(ordersWithUsers || []))} />
    </div>
  )
}