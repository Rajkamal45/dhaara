import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, Search, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import ToggleProductStatus from '@/components/admin/ToggleProductStatus'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string; search?: string; page?: string }
}) {
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

  // Build query
  let query = supabase
    .from('products')
    .select('*, region:regions(name, code)', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Region filter for non-super admins
  if (!isSuper && profile.region_id) {
    query = query.eq('region_id', profile.region_id)
  }

  // Category filter
  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  // Status filter
  if (searchParams.status === 'active') {
    query = query.eq('is_active', true)
  } else if (searchParams.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // Search filter
  if (searchParams.search) {
    query = query.or(`name.ilike.%${searchParams.search}%,sku.ilike.%${searchParams.search}%`)
  }

  // Pagination
  const page = parseInt(searchParams.page || '1')
  const perPage = 10
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data: products, count } = await query.range(from, to)

  const totalPages = Math.ceil((count || 0) / perPage)

  // Get unique categories for filter
  const { data: categoriesData } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null)

  const categories = [...new Set(categoriesData?.map(p => p.category).filter(Boolean))]

  // Helper to build URL with params
  const buildUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams()
    if (searchParams.category && !newParams.category) params.set('category', searchParams.category)
    if (searchParams.status && !newParams.status) params.set('status', searchParams.status)
    if (searchParams.search && !newParams.search) params.set('search', searchParams.search)
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return `/admin/products?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-card border rounded-lg">
        {/* Search */}
        <form className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="Search by name or SKU..."
              defaultValue={searchParams.search}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </form>

        {/* Category Filter */}
        {categories.length > 0 && (
          <select
            defaultValue={searchParams.category || ''}
            onChange={(e) => {
              window.location.href = buildUrl({ category: e.target.value, page: '1' })
            }}
            className="px-3 py-2 border rounded-lg bg-background"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          defaultValue={searchParams.status || ''}
          onChange={(e) => {
            window.location.href = buildUrl({ status: e.target.value, page: '1' })
          }}
          className="px-3 py-2 border rounded-lg bg-background"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Clear Filters */}
        {(searchParams.category || searchParams.status || searchParams.search) && (
          <Link
            href="/admin/products"
            className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg"
          >
            Clear Filters
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        Showing {products?.length || 0} of {count || 0} products
      </div>

      {/* Products Table */}
      {!products || products.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-muted-foreground mb-4">
            {searchParams.search || searchParams.category || searchParams.status
              ? 'Try adjusting your filters'
              : 'Add your first product to get started'}
          </p>
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">SKU</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Stock</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Region</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {product.sku}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-sm">
                      {product.category || '-'}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-green-600">
                          ₹{product.price}
                          {product.price_per_quantity > 1 && (
                            <span className="text-xs text-muted-foreground">
                              /{product.price_per_quantity} {product.unit}
                            </span>
                          )}
                          {product.price_per_quantity <= 1 && (
                            <span className="text-xs text-muted-foreground">
                              /{product.unit}
                            </span>
                          )}
                        </p>
                        {product.mrp && product.mrp > product.price && (
                          <p className="text-xs text-muted-foreground line-through">
                            ₹{product.mrp}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      {product.stock_quantity <= 0 ? (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          Out of Stock
                        </span>
                      ) : product.stock_quantity <= 10 ? (
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                          Low: {product.stock_quantity}
                        </span>
                      ) : (
                        <span className="text-sm text-green-600">
                          {product.stock_quantity} {product.unit}
                        </span>
                      )}
                    </td>

                    {/* Region */}
                    <td className="px-4 py-3 text-sm">
                      {product.region?.name || '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <ToggleProductStatus
                        productId={product.id}
                        isActive={product.is_active}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildUrl({ page: (page - 1).toString() })}
              className="px-3 py-1 rounded bg-muted hover:bg-muted/80"
            >
              Previous
            </Link>
          )}
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildUrl({ page: p.toString() })}
              className={`px-3 py-1 rounded ${
                p === page ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {p}
            </Link>
          ))}

          {page < totalPages && (
            <Link
              href={buildUrl({ page: (page + 1).toString() })}
              className="px-3 py-1 rounded bg-muted hover:bg-muted/80"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}