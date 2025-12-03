import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogisticsLayoutClient from '@/components/logistics/LogisticsLayoutClient'

export default async function LogisticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'logistics') {
    redirect('/')
  }

  // Get active delivery count for badge
  const { count: activeCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', user.id)
    .in('status', ['pending', 'confirmed', 'processing', 'shipped'])

  return (
    <LogisticsLayoutClient
      profile={{
        full_name: profile?.full_name,
        phone: profile?.phone,
        email: profile?.email,
      }}
      activeCount={activeCount || 0}
    >
      {children}
    </LogisticsLayoutClient>
  )
}