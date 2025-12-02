import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateUserForm from '@/components/admin/CreateUserForm'

async function getRegions() {
  const supabase = createClient()
  const { data } = await supabase
    .from('regions')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')
  return data || []
}

export default async function CreateUserPage() {
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
  const regions = await getRegions()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New User</h1>
        <p className="text-muted-foreground">
          Create admin or logistics partner accounts
        </p>
      </div>

      <CreateUserForm 
        regions={regions} 
        isSuper={isSuper}
        adminRegionId={profile.region_id}
      />
    </div>
  )
}