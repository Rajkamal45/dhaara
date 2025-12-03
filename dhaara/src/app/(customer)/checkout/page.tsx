'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/hooks/useToast'
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  CreditCard, 
  Truck, 
  Loader2,
  CheckCircle,
  Home,
  Briefcase,
  Plus,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LocationPicker from '@/components/customer/LocationPicker'

interface SavedAddress {
  id: string
  label: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  lat: number | null
  lng: number | null
  is_default: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { items, getTotal, clearCart } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [saveNewAddress, setSaveNewAddress] = useState(true)
  const [newAddressLabel, setNewAddressLabel] = useState('Home')

  const [formData, setFormData] = useState({
    delivery_address: '',
    delivery_city: '',
    delivery_state: '',
    delivery_pincode: '',
    delivery_phone: '',
    delivery_lat: null as number | null,
    delivery_lng: null as number | null,
    location_accuracy: null as number | null,
    payment_method: 'cod',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/checkout')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData(prev => ({
          ...prev,
          delivery_phone: profileData.phone || '',
        }))
      }

      // Fetch saved addresses
      const { data: addressesData } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      setSavedAddresses(addressesData || [])

      // Auto-select default address
      const defaultAddr = addressesData?.find(a => a.is_default)
      if (defaultAddr) {
        selectAddress(defaultAddr)
      } else if (addressesData && addressesData.length > 0) {
        selectAddress(addressesData[0])
      } else {
        setShowNewAddress(true)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id)
    setShowNewAddress(false)
    setFormData(prev => ({
      ...prev,
      delivery_address: address.address,
      delivery_city: address.city,
      delivery_state: address.state || '',
      delivery_pincode: address.pincode,
      delivery_phone: address.phone || prev.delivery_phone,
      delivery_lat: address.lat,
      delivery_lng: address.lng,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLocationSelect = (location: { 
    lat: number
    lng: number
    accuracy: number
    address?: string
    city?: string
    state?: string
    pincode?: string
  }) => {
    setFormData(prev => ({
      ...prev,
      delivery_lat: location.lat,
      delivery_lng: location.lng,
      location_accuracy: location.accuracy,
      delivery_city: location.city || prev.delivery_city,
      delivery_state: location.state || prev.delivery_state,
      delivery_pincode: location.pincode || prev.delivery_pincode,
    }))
  }

  const saveAddressToProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('saved_addresses')
        .insert({
          user_id: user.id,
          label: newAddressLabel,
          address: formData.delivery_address,
          city: formData.delivery_city,
          state: formData.delivery_state,
          pincode: formData.delivery_pincode,
          phone: formData.delivery_phone,
          lat: formData.delivery_lat,
          lng: formData.delivery_lng,
          is_default: savedAddresses.length === 0,
        })

      if (!error) {
        toast({
          title: 'Address Saved',
          description: 'This address has been saved to your profile for future orders.',
          variant: 'success',
        })
      }
    } catch (error) {
      console.error('Error saving address:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add some products before checkout',
        variant: 'destructive',
      })
      return
    }

    // Validate form
    if (!formData.delivery_address) {
      toast({
        title: 'Street address required',
        description: 'Please enter your street address',
        variant: 'destructive',
      })
      return
    }

    if (!formData.delivery_city || !formData.delivery_pincode || !formData.delivery_phone) {
      toast({
        title: 'Missing information',
        description: 'Please fill all required fields',
        variant: 'destructive',
      })
      return
    }

    if (!formData.delivery_lat || !formData.delivery_lng) {
      toast({
        title: 'Location required',
        description: 'Please select your delivery location on the map',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      // Save new address if opted
      if (showNewAddress && saveNewAddress) {
        await saveAddressToProfile()
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            price_per_quantity: item.price_per_quantity,
            unit: item.unit,
          })),
          delivery_address: formData.delivery_address,
          delivery_city: formData.delivery_city,
          delivery_state: formData.delivery_state,
          delivery_pincode: formData.delivery_pincode,
          delivery_phone: formData.delivery_phone,
          delivery_lat: formData.delivery_lat,
          delivery_lng: formData.delivery_lng,
          location_accuracy: formData.location_accuracy,
          payment_method: formData.payment_method,
          notes: formData.notes,
          total_amount: getTotal(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order')
      }

      setOrderId(result.order.id)
      setOrderNumber(result.order.order_number)
      setOrderPlaced(true)
      clearCart()

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getLabelIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home': return <Home className="h-4 w-4" />
      case 'office': 
      case 'work': return <Briefcase className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const total = getTotal()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Order Placed!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your order. We'll start processing it right away.
        </p>
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-500 mb-1">Order Number</p>
          <p className="font-mono font-bold text-xl">{orderNumber}</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/my-orders"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            View My Orders
          </Link>
          <Link
            href="/products"
            className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Add some products before checkout</p>
        <Link
          href="/products"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link 
        href="/cart" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Select Delivery Address
                </h2>

                <div className="grid gap-3">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => selectAddress(addr)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedAddressId === addr.id && !showNewAddress
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedAddressId === addr.id && !showNewAddress
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100'
                        }`}>
                          {getLabelIcon(addr.label)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{addr.label}</p>
                            {addr.is_default && (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            )}
                            {addr.lat && addr.lng && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                📍 GPS
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                          <p className="text-sm text-gray-500">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                        {selectedAddressId === addr.id && !showNewAddress && (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Add New Address Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(null)
                      setShowNewAddress(true)
                      setFormData(prev => ({
                        ...prev,
                        delivery_address: '',
                        delivery_city: '',
                        delivery_state: '',
                        delivery_pincode: '',
                        delivery_lat: null,
                        delivery_lng: null,
                      }))
                    }}
                    className={`p-4 rounded-lg border-2 border-dashed text-left transition-all flex items-center gap-3 ${
                      showNewAddress
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      showNewAddress ? 'bg-green-500 text-white' : 'bg-gray-100'
                    }`}>
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Add New Address</p>
                      <p className="text-sm text-gray-500">Deliver to a different location</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* New Address Form */}
            {showNewAddress && (
              <>
                {/* Location Picker */}
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-4">Search & Select Location</h2>
                  <LocationPicker 
                    onLocationSelect={handleLocationSelect}
                    initialLat={formData.delivery_lat || undefined}
                    initialLng={formData.delivery_lng || undefined}
                  />
                </div>

                {/* Address Details */}
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-4">Address Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="delivery_address">Street Address / Building *</Label>
                      <Input
                        id="delivery_address"
                        name="delivery_address"
                        value={formData.delivery_address}
                        onChange={handleChange}
                        placeholder="Building name, street, landmark"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="delivery_city">City *</Label>
                        <Input
                          id="delivery_city"
                          name="delivery_city"
                          value={formData.delivery_city}
                          onChange={handleChange}
                          className={`mt-1 ${formData.delivery_city ? 'bg-green-50 border-green-200' : ''}`}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_state">State</Label>
                        <Input
                          id="delivery_state"
                          name="delivery_state"
                          value={formData.delivery_state}
                          onChange={handleChange}
                          className={`mt-1 ${formData.delivery_state ? 'bg-green-50 border-green-200' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="delivery_pincode">Pincode *</Label>
                        <Input
                          id="delivery_pincode"
                          name="delivery_pincode"
                          value={formData.delivery_pincode}
                          onChange={handleChange}
                          maxLength={6}
                          className={`mt-1 ${formData.delivery_pincode ? 'bg-green-50 border-green-200' : ''}`}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_phone">Phone *</Label>
                        <Input
                          id="delivery_phone"
                          name="delivery_phone"
                          value={formData.delivery_phone}
                          onChange={handleChange}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    {/* Save Address Option */}
                    <div className="pt-4 border-t space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveNewAddress}
                          onChange={(e) => setSaveNewAddress(e.target.checked)}
                          className="h-4 w-4 text-green-600 rounded"
                        />
                        <span className="text-sm">Save this address for future orders</span>
                      </label>

                      {saveNewAddress && (
                        <div className="flex gap-2 ml-6">
                          {['Home', 'Office', 'Shop', 'Other'].map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setNewAddressLabel(label)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                                newAddressLabel === label 
                                  ? 'bg-green-600 text-white border-green-600' 
                                  : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Payment Method
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={formData.payment_method === 'cod'}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600"
                  />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay when you receive</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="bank_transfer"
                    checked={formData.payment_method === 'bank_transfer'}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600"
                  />
                  <div>
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-sm text-gray-500">Pay via NEFT/IMPS/UPI</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Order Notes (Optional)</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special instructions..."
                className="w-full px-3 py-2 border rounded-lg min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto">
                {items.map((item) => {
                  const itemTotal = (item.price / item.price_per_quantity) * item.quantity
                  return (
                    <div key={item.id} className="flex gap-3 py-2 border-b">
                      <div className="h-10 w-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 m-2.5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                      </div>
                      <p className="text-sm font-medium">₹{itemTotal.toFixed(2)}</p>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2 py-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-4 mb-4">
                <span>Total</span>
                <span className="text-green-600">₹{total.toFixed(2)}</span>
              </div>

              {/* Delivery To */}
              {formData.delivery_city && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Delivering to:</p>
                  <p className="text-sm font-medium">
                    {formData.delivery_city}, {formData.delivery_pincode}
                  </p>
                  {formData.delivery_lat && (
                    <p className="text-xs text-green-600 mt-1">📍 Location verified</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={submitting || !formData.delivery_lat || !formData.delivery_address}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}