import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ProductsTable from '@/components/admin/ProductTable'
export default async function ProductsPage() {
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

  let query = supabase
    .from('products')
    .select('*, region:regions(name, code)')
    .order('created_at', { ascending: false })

  if (!isSuper && profile.region_id) {
    query = query.eq('region_id', profile.region_id)
  }

  const { data: products } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/create"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="text-sm text-muted-foreground">
        Total: {products?.length || 0} products
      </div>

      <ProductsTable products={JSON.parse(JSON.stringify(products || []))} />
    </div>
  )
}