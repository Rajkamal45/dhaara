import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProductForm from '@/components/admin/ProductForm'

export default async function CreateProductPage() {
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

  // Fetch regions
  const { data: regions } = await supabase
    .from('regions')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground">Create a new product in your catalog</p>
      </div>

      <ProductForm
        regions={regions || []}
        isSuper={isSuper}
        adminRegionId={profile.region_id}
      />
    </div>
  )
}