import { createClient } from '@/lib/supabase/server'
import { Package, Filter, MapPin, AlertCircle } from 'lucide-react'
import ProductCard from '@/components/customer/ProductCard'
import Link from 'next/link'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string }
}) {
  const supabase = createClient()

  // Get current user's region
  const { data: { user } } = await supabase.auth.getUser()

  let userRegionId: string | null = null
  let userRegion: { id: string; name: string } | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('region_id, region:regions(id, name)')
      .eq('id', user.id)
      .single()

    userRegionId = profile?.region_id || null
    userRegion = profile?.region as { id: string; name: string } | null
  }

  let query = supabase
    .from('products')
    .select('*, region:regions(name, code)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Filter by user's region
  if (userRegionId) {
    query = query.eq('region_id', userRegionId)
  }

  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  if (searchParams.search) {
    query = query.or(`name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }

  const { data: products } = await query

  // Get categories for filter (also filtered by region)
  let categoriesQuery = supabase
    .from('products')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null)

  if (userRegionId) {
    categoriesQuery = categoriesQuery.eq('region_id', userRegionId)
  }

  const { data: categoriesData } = await categoriesQuery

  const categories = [...new Set(categoriesData?.map(p => p.category).filter(Boolean))]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* No Region Warning */}
      {user && !userRegionId && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Region not set</p>
            <p className="text-sm text-yellow-700">
              Please update your profile with your region to see products available in your area.
            </p>
            <Link href="/profile" className="text-sm text-yellow-800 underline hover:no-underline mt-1 inline-block">
              Update Profile
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {searchParams.category || 'All Products'}
        </h1>
        <div className="flex items-center gap-2 text-gray-600">
          <span>{products?.length || 0} products available</span>
          {userRegion && (
            <>
              <span className="text-gray-400">|</span>
              <span className="flex items-center gap-1 text-green-600">
                <MapPin className="h-4 w-4" />
                {userRegion.name}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border p-4 sticky top-24">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Categories
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className={`block px-3 py-2 rounded-lg ${
                    !searchParams.category ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
                  }`}
                >
                  All Products
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category}>
                  <Link
                    href={`/products?category=${encodeURIComponent(category)}`}
                    className={`block px-3 py-2 rounded-lg ${
                      searchParams.category === category ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Mobile Category Filter */}
          <div className="md:hidden mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <Link
                href="/products"
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  !searchParams.category ? 'bg-green-600 text-white' : 'bg-gray-100'
                }`}
              >
                All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/products?category=${encodeURIComponent(category)}`}
                  className={`px-4 py-2 rounded-full whitespace-nowrap ${
                    searchParams.category === category ? 'bg-green-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-xl font-medium text-gray-600 mb-2">No products found</p>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}