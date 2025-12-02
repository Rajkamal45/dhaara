'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Edit, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface Product {
  id: string
  name: string
  description?: string
  sku: string
  category?: string
  price: number
  price_per_quantity?: number
  mrp?: number
  stock_quantity: number
  unit: string
  is_active: boolean
  image_url?: string
  region?: {
    name: string
    code: string
  }
}

interface ProductsTableProps {
  products: Product[]
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`)) {
      return
    }

    setDeletingId(product.id)

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete product')
      }

      toast({
        title: 'Product deleted',
        description: `${product.name} has been deleted.`,
        variant: 'success',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (product: Product) => {
    setTogglingId(product.id)

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !product.is_active }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast({
        title: 'Status updated',
        description: `Product is now ${!product.is_active ? 'active' : 'inactive'}.`,
        variant: 'success',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setTogglingId(null)
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-card border rounded-lg">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No products found</p>
        <p className="text-muted-foreground mb-4">Add your first product to get started</p>
        <Link
          href="/admin/products/create"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Add Product
        </Link>
      </div>
    )
  }

  return (
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
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                {/* Product Info */}
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
                    {product.sku || 'N/A'}
                  </span>
                </td>

                {/* Category */}
                <td className="px-4 py-3 text-sm">
                  {product.category || 'Uncategorized'}
                </td>

                {/* Price */}
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-green-600">
                      ₹{product.price}
                      {product.price_per_quantity && product.price_per_quantity > 1 && (
                        <span className="text-xs text-muted-foreground">
                          /{product.price_per_quantity} {product.unit}
                        </span>
                      )}
                      {(!product.price_per_quantity || product.price_per_quantity <= 1) && (
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
                  {product.region?.name || 'All'}
                </td>

                {/* Status Toggle */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleStatus(product)}
                    disabled={togglingId === product.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      product.is_active ? 'bg-green-500' : 'bg-gray-300'
                    } ${togglingId === product.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={product.is_active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                        product.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* Edit Button */}
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}