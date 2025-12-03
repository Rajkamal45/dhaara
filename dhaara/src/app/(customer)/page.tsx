import { createClient } from '@/lib/supabase/server'
import { Package, Search, MapPin, AlertCircle } from 'lucide-react'
import ProductCard from '@/components/customer/ProductCard'
import Link from 'next/link'

export default async function HomePage({
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

  // Build query - filter by user's region if they have one
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

  // Fetch categories for filter (also filtered by region)
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
    <div className="max-w-7xl mx-auto px-4 py-6">
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

      {/* Header with Search */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {searchParams.category || 'All Products'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{products?.length || 0} products available</span>
              {userRegion && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {userRegion.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <form action="/" method="GET" className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search products..."
                defaultValue={searchParams.search}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              !searchParams.category
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/?category=${encodeURIComponent(category)}`}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                searchParams.category === category
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl font-medium text-gray-600 mb-2">No products found</p>
          <p className="text-gray-500">
            {searchParams.search || searchParams.category
              ? 'Try adjusting your search or filters'
              : 'Products will appear here once added'}
          </p>
          {(searchParams.search || searchParams.category) && (
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Clear Filters
            </Link>
          )}
        </div>
      )}
    </div>
  )
}