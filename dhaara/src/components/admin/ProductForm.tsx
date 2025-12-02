'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Upload, X, Package, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'

interface ProductFormProps {
  regions: { id: string; name: string; code: string }[]
  isSuper: boolean
  adminRegionId: string | null
  product?: any
}

const categories = [
  'Dairy', 'Beverages', 'Snacks', 'Groceries', 'Frozen Foods',
  'Personal Care', 'Household', 'Bakery', 'Meat & Seafood',
  'Fruits & Vegetables', 'Other',
]

const units = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Litre (l)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'carton', label: 'Carton' },
  { value: 'dozen', label: 'Dozen' },
]

export default function ProductForm({ regions, isSuper, adminRegionId, product }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>(product?.image_url || '')
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState(product?.image_url || '')

  const isEditing = !!product

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    category: product?.category || '',
    price: product?.price || 0,
    price_per_quantity: product?.price_per_quantity || 1,
    mrp: product?.mrp || 0,
    stock_quantity: product?.stock_quantity || 0,
    unit: product?.unit || 'kg',
    min_order_quantity: product?.min_order_quantity || 1,
    max_order_quantity: product?.max_order_quantity || 100,
    region_id: product?.region_id || adminRegionId || '',
    is_active: product?.is_active ?? true,
    image_url: product?.image_url || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.checked,
    }))
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please use JPG, PNG, WEBP, or GIF',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB',
        variant: 'destructive',
      })
      return
    }

    // Preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase
    setIsUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('bucket', 'products')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Upload service unavailable. Please use Image URL instead.')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setFormData(prev => ({ ...prev, image_url: result.url }))
      toast({
        title: 'Image uploaded!',
        description: 'Product image uploaded successfully',
        variant: 'success',
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try using Image URL instead',
        variant: 'destructive',
      })
      // Keep the preview but don't save the URL
      setImagePreview('')
      // Switch to URL mode
      setImageMode('url')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle URL input
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setFormData(prev => ({ ...prev, image_url: urlInput.trim() }))
      setImagePreview(urlInput.trim())
      toast({
        title: 'Image URL set',
        description: 'Product image URL saved',
        variant: 'success',
      })
    }
  }

  const removeImage = () => {
    setImagePreview('')
    setUrlInput('')
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.sku || !formData.category || !formData.region_id) {
      toast({
        title: 'Missing fields',
        description: 'Please fill all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const url = isEditing
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save product')
      }

      toast({
        title: isEditing ? 'Product updated!' : 'Product created!',
        description: `${formData.name} has been ${isEditing ? 'updated' : 'added'} successfully.`,
        variant: 'success',
      })

      router.push('/admin/products')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate display price
  const getDisplayPrice = () => {
    if (formData.price_per_quantity > 1) {
      return `₹${formData.price} per ${formData.price_per_quantity} ${formData.unit}`
    }
    return `₹${formData.price} per ${formData.unit}`
  }

  // Calculate unit price
  const getUnitPrice = () => {
    if (formData.price_per_quantity > 0) {
      const unitPrice = formData.price / formData.price_per_quantity
      return `₹${unitPrice.toFixed(2)} per 1 ${formData.unit}`
    }
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Fresh Potatoes"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter product description"
              className="w-full px-3 py-2 border rounded-lg bg-background min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* SKU & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="PRD-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
            <h3 className="font-semibold text-blue-800">💰 Pricing</h3>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm">Price (₹) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="100"
                  className="bg-white"
                  required
                />
              </div>

              {/* Per Quantity */}
              <div className="space-y-2">
                <Label htmlFor="price_per_quantity" className="text-sm">Per Qty *</Label>
                <Input
                  id="price_per_quantity"
                  name="price_per_quantity"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.price_per_quantity}
                  onChange={handleChange}
                  placeholder="10"
                  className="bg-white"
                  required
                />
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm">Unit *</Label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Preview */}
            <div className="p-3 bg-white rounded-lg border border-blue-300">
              <p className="text-xs text-muted-foreground mb-1">Customer will see:</p>
              <p className="text-xl font-bold text-blue-600">{getDisplayPrice()}</p>
              {formData.price_per_quantity > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ({getUnitPrice()})
                </p>
              )}
            </div>

            {/* MRP */}
            <div className="space-y-2">
              <Label htmlFor="mrp" className="text-sm">MRP (₹) - Original Price</Label>
              <Input
                id="mrp"
                name="mrp"
                type="number"
                step="0.01"
                min="0"
                value={formData.mrp}
                onChange={handleChange}
                placeholder="120"
                className="bg-white"
              />
              {formData.mrp > formData.price && (
                <p className="text-xs text-green-600">
                  ✓ {Math.round(((formData.mrp - formData.price) / formData.mrp) * 100)}% discount will be shown
                </p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="stock_quantity">Stock Quantity ({formData.unit}) *</Label>
            <Input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={handleChange}
              placeholder="100"
              required
            />
          </div>

          {/* Min/Max Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_order_quantity">Min Order ({formData.unit})</Label>
              <Input
                id="min_order_quantity"
                name="min_order_quantity"
                type="number"
                min="1"
                value={formData.min_order_quantity}
                onChange={handleChange}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_order_quantity">Max Order ({formData.unit})</Label>
              <Input
                id="max_order_quantity"
                name="max_order_quantity"
                type="number"
                min="1"
                value={formData.max_order_quantity}
                onChange={handleChange}
                placeholder="100"
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Image Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Product Image</Label>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`px-2 py-1 rounded ${imageMode === 'upload' ? 'bg-primary text-white' : 'bg-muted'}`}
                >
                  <Upload className="h-3 w-3 inline mr-1" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-2 py-1 rounded ${imageMode === 'url' ? 'bg-primary text-white' : 'bg-muted'}`}
                >
                  <LinkIcon className="h-3 w-3 inline mr-1" />
                  URL
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed rounded-lg p-6 text-center min-h-[200px] flex flex-col items-center justify-center">
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Product preview"
                    width={180}
                    height={180}
                    className="rounded-lg object-cover"
                    onError={() => {
                      setImagePreview('')
                      toast({
                        title: 'Invalid image',
                        description: 'Could not load the image',
                        variant: 'destructive',
                      })
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Package className="h-16 w-16 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {imageMode === 'upload' ? 'Click button below to upload' : 'Enter image URL below'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                </>
              )}
            </div>

            {/* Upload Button or URL Input */}
            {imageMode === 'upload' ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {imagePreview ? 'Change Image' : 'Select Image'}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                >
                  Set
                </Button>
              </div>
            )}
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region_id">Region *</Label>
            <select
              id="region_id"
              name="region_id"
              value={formData.region_id}
              onChange={handleChange}
              disabled={!isSuper}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              required
            >
              <option value="">Select region</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name} ({region.code})
                </option>
              ))}
            </select>
            {!isSuper && (
              <p className="text-xs text-muted-foreground">
                Products will be assigned to your region
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckbox}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">
                  Product will be visible to customers
                </p>
              </div>
            </label>
          </div>

          {/* Product Summary */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <h3 className="font-semibold text-green-800">📦 Product Summary</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{formData.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium text-green-700">{getDisplayPrice()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock:</span>
                <span className="font-medium">{formData.stock_quantity} {formData.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{formData.category || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU:</span>
                <span className="font-medium font-mono">{formData.sku || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/admin/products')}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-green-600 hover:bg-green-700" 
          disabled={isLoading || isUploading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Package className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Product' : 'Create Product'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}