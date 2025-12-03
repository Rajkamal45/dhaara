'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/hooks/useToast'

interface ProductCardProps {
  product: {
    id: string
    name: string
    description?: string
    price: number
    price_per_quantity?: number
    mrp?: number
    unit: string
    image_url?: string
    stock_quantity: number
    min_order_quantity?: number
    region_id: string
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(product.min_order_quantity || 1)

  const pricePerQty = product.price_per_quantity || 1
  const displayPrice = `₹${product.price}/${pricePerQty > 1 ? pricePerQty : ''} ${product.unit}`
  const discount = product.mrp && product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0

  const handleAddToCart = () => {
    addItem(product, quantity)
    toast({
      title: 'Added to cart',
      description: `${quantity} ${product.unit} of ${product.name}`,
      variant: 'success',
    })
    setQuantity(product.min_order_quantity || 1)
  }

  const isOutOfStock = product.stock_quantity <= 0

  return (
    <div className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square bg-gray-100 relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-gray-300" />
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              {discount}% OFF
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-800 px-3 py-1 rounded font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-green-600">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-green-600">{displayPrice}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-sm text-gray-400 line-through">₹{product.mrp}</span>
          )}
        </div>

        {!isOutOfStock && (
          <>
            {/* Quantity Selector */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setQuantity(Math.max(product.min_order_quantity || 1, quantity - 1))}
                className="p-1 border rounded hover:bg-gray-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 border rounded hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-500">{product.unit}</span>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
          </>
        )}
      </div>
    </div>
  )
}