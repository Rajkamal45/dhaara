'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Loader2, 
  Plus,
  Pencil,
  Trash2,
  Star,
  Check,
  Home,
  Briefcase,
  X
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

interface Profile {
  id: string
  full_name: string
  email: string
  phone: string
  business_name: string
  business_type: string
  gst_number: string
  pan_number: string
  address: string
  city: string
  state: string
  pincode: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  
  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    lat: null as number | null,
    lng: null as number | null,
    is_default: false,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/profile')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({
          ...profileData,
          email: user.email || '',
        })
      }

      // Fetch saved addresses
      const { data: addressesData } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      setAddresses(addressesData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          business_name: profile.business_name,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
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
    setAddressForm(prev => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
      city: location.city || prev.city,
      state: location.state || prev.state,
      pincode: location.pincode || prev.pincode,
    }))
  }

  const handleSaveAddress = async () => {
    if (!addressForm.address || !addressForm.city || !addressForm.pincode) {
      toast({
        title: 'Missing information',
        description: 'Please fill address, city, and pincode',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // If setting as default, unset other defaults
      if (addressForm.is_default) {
        await supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
      }

      if (editingAddress) {
        // Update existing
        const { error } = await supabase
          .from('saved_addresses')
          .update({
            label: addressForm.label,
            address: addressForm.address,
            city: addressForm.city,
            state: addressForm.state,
            pincode: addressForm.pincode,
            phone: addressForm.phone,
            lat: addressForm.lat,
            lng: addressForm.lng,
            is_default: addressForm.is_default,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAddress.id)

        if (error) throw error
        toast({ title: 'Address Updated', variant: 'success' })
      } else {
        // Create new
        const { error } = await supabase
          .from('saved_addresses')
          .insert({
            user_id: user.id,
            label: addressForm.label,
            address: addressForm.address,
            city: addressForm.city,
            state: addressForm.state,
            pincode: addressForm.pincode,
            phone: addressForm.phone || profile?.phone,
            lat: addressForm.lat,
            lng: addressForm.lng,
            is_default: addressForm.is_default || addresses.length === 0,
          })

        if (error) throw error
        toast({ title: 'Address Saved', variant: 'success' })
      }

      // Reset and refresh
      setShowAddressForm(false)
      setEditingAddress(null)
      setAddressForm({
        label: 'Home',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        lat: null,
        lng: null,
        is_default: false,
      })
      fetchData()

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address)
    setAddressForm({
      label: address.label,
      address: address.address,
      city: address.city,
      state: address.state || '',
      pincode: address.pincode,
      phone: address.phone || '',
      lat: address.lat,
      lng: address.lng,
      is_default: address.is_default,
    })
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return

    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: 'Address Deleted', variant: 'success' })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Unset all defaults
      await supabase
        .from('saved_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // Set new default
      await supabase
        .from('saved_addresses')
        .update({ is_default: true })
        .eq('id', id)

      toast({ title: 'Default Address Set', variant: 'success' })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Personal Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={profile?.full_name || ''}
                onChange={handleProfileChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={profile?.email || ''}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={profile?.phone || ''}
                onChange={handleProfileChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                name="business_name"
                value={profile?.business_name || ''}
                onChange={handleProfileChange}
                className="mt-1"
              />
            </div>
          </div>

          <Button 
            onClick={handleSaveProfile} 
            className="mt-4 bg-green-600 hover:bg-green-700"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Profile
          </Button>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Saved Delivery Addresses
            </h2>
            <Button 
              onClick={() => {
                setEditingAddress(null)
                setAddressForm({
                  label: 'Home',
                  address: '',
                  city: '',
                  state: '',
                  pincode: '',
                  phone: profile?.phone || '',
                  lat: null,
                  lng: null,
                  is_default: false,
                })
                setShowAddressForm(true)
              }}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </Button>
          </div>

          {/* Address List */}
          {addresses.length === 0 && !showAddressForm ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No saved addresses yet</p>
              <p className="text-sm">Add an address for faster checkout</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div 
                  key={addr.id} 
                  className={`p-4 rounded-lg border ${addr.is_default ? 'border-green-500 bg-green-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        addr.is_default ? 'bg-green-500 text-white' : 'bg-gray-100'
                      }`}>
                        {getLabelIcon(addr.label)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{addr.label}</p>
                          {addr.is_default && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                              Default
                            </span>
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
                        {addr.phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" /> {addr.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!addr.is_default && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetDefault(addr.id)}
                          title="Set as Default"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditAddress(addr)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Address Form */}
          {showAddressForm && (
            <div className="mt-6 p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddressForm(false)
                    setEditingAddress(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Label Selection */}
              <div className="mb-4">
                <Label>Address Label</Label>
                <div className="flex gap-2 mt-2">
                  {['Home', 'Office', 'Shop', 'Other'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAddressForm(prev => ({ ...prev, label }))}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        addressForm.label === label 
                          ? 'bg-green-600 text-white border-green-600' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Picker */}
              <div className="mb-4">
                <Label>Search & Select Location</Label>
                <div className="mt-2">
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialLat={addressForm.lat || undefined}
                    initialLng={addressForm.lng || undefined}
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="addr_address">Street Address / Building *</Label>
                  <Input
                    id="addr_address"
                    name="address"
                    value={addressForm.address}
                    onChange={handleAddressFormChange}
                    placeholder="Building name, street, landmark"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addr_city">City *</Label>
                    <Input
                      id="addr_city"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressFormChange}
                      className={`mt-1 ${addressForm.city ? 'bg-green-50 border-green-200' : ''}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="addr_state">State</Label>
                    <Input
                      id="addr_state"
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressFormChange}
                      className={`mt-1 ${addressForm.state ? 'bg-green-50 border-green-200' : ''}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addr_pincode">Pincode *</Label>
                    <Input
                      id="addr_pincode"
                      name="pincode"
                      value={addressForm.pincode}
                      onChange={handleAddressFormChange}
                      maxLength={6}
                      className={`mt-1 ${addressForm.pincode ? 'bg-green-50 border-green-200' : ''}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="addr_phone">Phone</Label>
                    <Input
                      id="addr_phone"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressFormChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="h-4 w-4 text-green-600 rounded"
                  />
                  <span className="text-sm">Set as default address</span>
                </label>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveAddress}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddressForm(false)
                      setEditingAddress(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}