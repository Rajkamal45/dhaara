'use client'

import { useEffect, useRef, useState } from 'react'

interface MapComponentProps {
  center: [number, number]
  zoom: number
  marker: [number, number] | null
  onMapClick?: (lat: number, lng: number) => void
  markers?: Array<{
    lat: number
    lng: number
    popup?: string
    color?: string
  }>
}

// Icon creation functions - called only after L is loaded
function createIcons(L: typeof import('leaflet')) {
  const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  const greenIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  const blueIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  const orangeIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  return { defaultIcon, redIcon, greenIcon, blueIcon, orangeIcon }
}

export default function MapComponent({
  center,
  zoom,
  marker,
  onMapClick,
  markers = []
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const iconsRef = useRef<ReturnType<typeof createIcons> | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Leaflet dynamically
  useEffect(() => {
    let mounted = true

    async function loadLeaflet() {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      if (!mounted) return

      leafletRef.current = L
      iconsRef.current = createIcons(L)
      setIsLoaded(true)
    }

    loadLeaflet()

    return () => {
      mounted = false
    }
  }, [])

  // Initialize map after Leaflet is loaded
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current) return

    const L = leafletRef.current!

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView(center, zoom)

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current)

    // Create markers layer group
    markersLayerRef.current = L.layerGroup().addTo(mapRef.current)

    // Add click handler
    if (onMapClick) {
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [isLoaded])

  // Update center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom)
    }
  }, [center, zoom])

  // Update single marker
  useEffect(() => {
    if (!mapRef.current || !iconsRef.current) return

    const L = leafletRef.current!
    const { defaultIcon } = iconsRef.current

    if (markerRef.current) {
      markerRef.current.remove()
    }

    if (marker) {
      markerRef.current = L.marker(marker, { icon: defaultIcon })
        .addTo(mapRef.current)
        .bindPopup('Delivery Location')
    }
  }, [marker, isLoaded])

  // Update multiple markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !iconsRef.current) return

    const L = leafletRef.current!
    const { defaultIcon, redIcon, greenIcon, blueIcon, orangeIcon } = iconsRef.current

    markersLayerRef.current.clearLayers()

    markers.forEach((m) => {
      let icon = defaultIcon
      switch (m.color) {
        case 'red': icon = redIcon; break
        case 'green': icon = greenIcon; break
        case 'blue': icon = blueIcon; break
        case 'orange': icon = orangeIcon; break
      }

      const markerInstance = L.marker([m.lat, m.lng], { icon })

      if (m.popup) {
        markerInstance.bindPopup(m.popup)
      }

      markersLayerRef.current?.addLayer(markerInstance)
    })

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [markers, isLoaded])

  if (!isLoaded) {
    return (
      <div
        className="h-full w-full rounded-lg bg-gray-100 flex items-center justify-center"
        style={{ minHeight: '300px' }}
      >
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '300px', zIndex: 0 }}
    />
  )
}