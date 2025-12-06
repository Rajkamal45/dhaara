import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DeliveryHistory from '@/components/logistics/DeliveryHistory'

export default async function DeliveryHistoryPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'logistics') redirect('/')

  // Fetch delivered orders
  const { data: orders } = await supabase
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
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false })

  // Fetch user profiles for each order
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
        <h1 className="text-2xl font-bold">Delivery History</h1>
        <p className="text-gray-500">View your past deliveries and download invoices</p>
      </div>

      <DeliveryHistory orders={JSON.parse(JSON.stringify(ordersWithUsers || []))} />
    </div>
  )
}
