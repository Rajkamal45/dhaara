import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
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

  // Fetch product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single()

  if (productError || !product) {
    notFound()
  }

  // Regional admin can only edit products in their region
  if (!isSuper && product.region_id !== profile.region_id) {
    redirect('/admin/products')
  }

  // Fetch regions
  const { data: regions } = await supabase
    .from('regions')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">Update product details for {product.name}</p>
      </div>

      <ProductForm
        regions={regions || []}
        isSuper={isSuper}
        adminRegionId={profile.region_id}
        product={product}
      />
    </div>
  )
}