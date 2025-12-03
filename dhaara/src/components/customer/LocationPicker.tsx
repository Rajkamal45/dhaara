'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Crosshair, Loader2, AlertCircle, Check, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  )
})

interface LocationPickerProps {
  onLocationSelect: (location: {
    lat: number
    lng: number
    accuracy: number
    address?: string
    city?: string
    state?: string
    pincode?: string
  }) => void
  initialLat?: number
  initialLng?: number
}

interface Suggestion {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    road?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    state_district?: string
    state?: string
    postcode?: string
    country?: string
  }
}

export default function LocationPicker({ 
  onLocationSelect, 
  initialLat, 
  initialLng,
}: LocationPickerProps) {
  const [location, setLocation] = useState<{
    lat: number
    lng: number
    accuracy: number
  } | null>(initialLat && initialLng ? { lat: initialLat, lng: initialLng, accuracy: 0 } : null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [displayAddress, setDisplayAddress] = useState<string>('')
  
  // Autocomplete states
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchQuery.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  const fetchSuggestions = async (query: string) => {
    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`
      )
      const data: Suggestion[] = await response.json()
      setSuggestions(data)
      setShowSuggestions(data.length > 0)
    } catch (e) {
      console.error('Search error:', e)
      setSuggestions([])
    } finally {
      setSearching(false)
    }
  }

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    const newLocation = { lat, lng, accuracy: 0 }
    
    setLocation(newLocation)
    setDisplayAddress(suggestion.display_name)
    setSearchQuery(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])

    // Extract address components
    const addr = suggestion.address
    const city = addr.city || addr.town || addr.village || addr.suburb || ''
    const state = addr.state || addr.state_district || ''
    const pincode = addr.postcode || ''

    // Send location with address components
    onLocationSelect({
      lat,
      lng,
      accuracy: 0,
      address: suggestion.display_name,
      city,
      state,
      pincode,
    })
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const newLocation = { lat: latitude, lng: longitude, accuracy }
        setLocation(newLocation)
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
          const data = await response.json()
          if (data.display_name) {
            setDisplayAddress(data.display_name)
            setSearchQuery(data.display_name)
            
            const addr = data.address || {}
            onLocationSelect({ 
              ...newLocation, 
              address: data.display_name,
              city: addr.city || addr.town || addr.village || addr.suburb || '',
              state: addr.state || addr.state_district || '',
              pincode: addr.postcode || '',
            })
          } else {
            onLocationSelect(newLocation)
          }
        } catch (e) {
          onLocationSelect(newLocation)
        }
        
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access or search by address.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable. Please search by address.')
            break
          case err.TIMEOUT:
            setError('Location request timed out. Please try again or search by address.')
            break
          default:
            setError('An unknown error occurred.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleMapClick = async (lat: number, lng: number) => {
    const newLocation = { lat, lng, accuracy: 0 }
    setLocation(newLocation)

    // Reverse geocode
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()
      if (data.display_name) {
        setDisplayAddress(data.display_name)
        setSearchQuery(data.display_name)
        
        const addr = data.address || {}
        onLocationSelect({ 
          ...newLocation, 
          address: data.display_name,
          city: addr.city || addr.town || addr.village || addr.suburb || '',
          state: addr.state || addr.state_district || '',
          pincode: addr.postcode || '',
        })
      } else {
        onLocationSelect(newLocation)
      }
    } catch (e) {
      onLocationSelect(newLocation)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-4">
      {/* Autocomplete Search Box */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search location (e.g., Velachery Chennai)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searching ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-3"
                >
                  <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.address.suburb || suggestion.address.city || suggestion.address.town || suggestion.address.village || 'Location'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.display_name}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {suggestion.address.state && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {suggestion.address.state}
                        </span>
                      )}
                      {suggestion.address.postcode && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {suggestion.address.postcode}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No locations found
              </div>
            )}
          </div>
        )}
      </div>

      {/* GPS Button */}
      <Button
        type="button"
        variant="outline"
        onClick={getCurrentLocation}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Crosshair className="h-4 w-4 mr-2" />
        )}
        {loading ? 'Getting Location...' : 'Use My Current Location (GPS)'}
      </Button>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <div className="h-[300px] rounded-lg overflow-hidden border">
          <MapComponent
            center={location ? [location.lat, location.lng] : [20.5937, 78.9629]}
            zoom={location ? 16 : 5}
            marker={location ? [location.lat, location.lng] : null}
            onMapClick={handleMapClick}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Search for your area, use GPS, or click on map to set exact delivery location
        </p>
      </div>

      {/* Selected Location Info */}
      {location && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-800">📍 Location Selected</p>
              {displayAddress && (
                <p className="text-sm text-green-700 mt-1 break-words">{displayAddress}</p>
              )}
              <p className="text-xs text-green-600 mt-1">
                Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}