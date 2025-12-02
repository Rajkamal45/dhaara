'use client'

import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

interface ProductFiltersProps {
  regions: { id: string; name: string; code: string }[]
  categories: string[]
  isSuper: boolean
  currentFilters: {
    category?: string
    status?: string
    region?: string
    search?: string
  }
}

export default function ProductFilters({ regions, categories, isSuper, currentFilters }: ProductFiltersProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentFilters.search || '')

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams()

    if (currentFilters.category && key !== 'category') params.set('category', currentFilters.category)
    if (currentFilters.status && key !== 'status') params.set('status', currentFilters.status)
    if (currentFilters.region && key !== 'region') params.set('region', currentFilters.region)
    if (currentFilters.search && key !== 'search') params.set('search', currentFilters.search)

    if (value) params.set(key, value)

    router.push(`/admin/products?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', search)
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/admin/products')
  }

  const hasFilters = currentFilters.category || currentFilters.status || currentFilters.region || currentFilters.search

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-card border rounded-lg">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </form>

      {/* Category Filter */}
      {categories.length > 0 && (
        <select
          value={currentFilters.category || ''}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      )}

      {/* Status Filter */}
      <select
        value={currentFilters.status || ''}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Region Filter (Super Admin only) */}
      {isSuper && regions.length > 0 && (
        <select
          value={currentFilters.region || ''}
          onChange={(e) => updateFilter('region', e.target.value)}
          className="px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Regions</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name} ({region.code})
            </option>
          ))}
        </select>
      )}

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  )
}