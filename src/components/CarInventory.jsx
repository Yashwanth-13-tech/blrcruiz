import React, { useMemo, useState } from 'react'
import {
  SlidersHorizontal,
  Search,
  X,
  Heart,
  Star,
  Zap,
  Fuel,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Navigation,
  Loader2,
  Car,
} from 'lucide-react'
import { CATEGORIES } from '../data/cars.js'
import { useCars } from '../context/CarContext.jsx'
import { calculateDays } from '../utils/pricing.js'
import CarCard from './CarCard.jsx'
import CarCardSkeleton from './CarCardSkeleton.jsx'

import { getUserLocation, findNearestLocation } from '../utils/geolocation.js'

const TRANSMISSIONS = ['All Transmissions', 'Automatic', 'Manual']
const SORT_OPTIONS = [
  { value: 'popular', label: '⭐ Recommended' },
  { value: 'price-asc', label: '💰 Price: Low to High' },
  { value: 'price-desc', label: '💎 Price: High to Low' },
  { value: 'rating', label: '🌟 Highest Rated' },
  { value: 'newest', label: '🆕 Newest Year' },
]

export default function CarInventory({
  search,
  favorites = [],
  onToggleFavorite,
  onViewDetails,
  onBookNow,
  onlyFavoritesFilter = false,
  onClearFavoritesFilter,
}) {
  const { cars, locations, loading } = useCars()
  const [category, setCategory] = useState(search?.category || 'All')
  const [transmission, setTransmission] = useState('All Transmissions')
  const [locationFilter, setLocationFilter] = useState('All')
  const [sortBy, setSortBy] = useState('popular')
  const [query, setQuery] = useState('')
  
  // Geolocation detection state
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoStatus, setGeoStatus] = useState(null) // { type: 'detecting' | 'success' | 'info', message: string, nearest?: object }

  // Quick toggle filters
  const [popularOnly, setPopularOnly] = useState(false)
  const [savedOnly, setSavedOnly] = useState(onlyFavoritesFilter)
  const [availableOnly, setAvailableOnly] = useState(false)

  // Location id to name map
  const locationMap = useMemo(() => {
    const map = {}
    for (const loc of locations) {
      map[loc.id] = loc.name
    }
    return map
  }, [locations])

  // Keep category/location filter in sync if user selected from Search
  React.useEffect(() => {
    if (search?.category) setCategory(search.category)
    if (!search?.pickupLocation || search.pickupLocation === 'All Locations' || search.pickupLocation === 'All') {
      setLocationFilter('All')
    } else {
      const matched = locations.find(
        (l) => l.id === search.pickupLocation || l.name.toLowerCase().includes(search.pickupLocation.toLowerCase())
      )
      if (matched) {
        setLocationFilter(matched.id)
      }
    }
  }, [search?.searchTrigger, search?.category, search?.pickupLocation, locations])

  React.useEffect(() => {
    if (onlyFavoritesFilter) setSavedOnly(true)
  }, [onlyFavoritesFilter])

  const days = calculateDays(search.pickupDate, search.returnDate)
  const validDays = days > 0 ? days : 0

  const handleFindNearMe = async () => {
    setGeoLoading(true)
    setGeoStatus({
      type: 'detecting',
      message: 'Finding your nearest pickup location...',
    })

    try {
      const coords = await getUserLocation()
      const nearest = findNearestLocation(coords.latitude, coords.longitude, locations)

      if (nearest) {
        setLocationFilter(nearest.id)
        setGeoStatus({
          type: 'success',
          message: `Nearest hub found: ${nearest.name} (~${nearest.distanceKm} km)`,
          nearest,
        })
      } else {
        setGeoStatus({
          type: 'info',
          message: 'All Bangalore hubs are open and available.',
        })
      }
    } catch (err) {
      setGeoStatus({
        type: 'info',
        message: err.message || 'Location access is optional. You can select your pickup hub manually.',
      })
    } finally {
      setGeoLoading(false)
    }
  }

  const filteredCars = useMemo(() => {
    let result = cars.filter((car) => {
      // Category match
      const matchesCategory = category === 'All' || car.category === category

      // Transmission match
      const matchesTransmission =
        transmission === 'All Transmissions' ||
        (car.transmission || '').toLowerCase().includes(transmission.toLowerCase())

      // Location match
      let matchesLocation = true
      if (locationFilter !== 'All') {
        if (Array.isArray(car.locations) && car.locations.length > 0) {
          matchesLocation =
            car.locations.includes(locationFilter) ||
            car.locations.some((lid) => {
              const locObj = locations.find((l) => l.id === lid || l.name === lid)
              return locObj && (locObj.id === locationFilter || locObj.name.toLowerCase() === locationFilter.toLowerCase())
            })
        } else {
          // If no specific location is assigned, car is available citywide
          matchesLocation = true
        }
      }

      // Quick chips
      if (popularOnly && !car.popular) return false
      if (savedOnly && !favorites.includes(car.id)) return false
      if (availableOnly && !car.available) return false

      // Search query
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        (car.brand || '').toLowerCase().includes(q) ||
        (car.model || '').toLowerCase().includes(q) ||
        (car.category || '').toLowerCase().includes(q) ||
        (car.transmission || '').toLowerCase().includes(q) ||
        (car.fuel || '').toLowerCase().includes(q) ||
        String(car.year || '').includes(q)

      return matchesCategory && matchesTransmission && matchesLocation && matchesQuery
    })

    switch (sortBy) {
      case 'price-asc':
        return [...result].sort((a, b) => Number(a.pricePerDay) - Number(b.pricePerDay))
      case 'price-desc':
        return [...result].sort((a, b) => Number(b.pricePerDay) - Number(a.pricePerDay))
      case 'rating':
        return [...result].sort((a, b) => Number(b.rating) - Number(a.rating))
      case 'newest':
        return [...result].sort((a, b) => Number(b.year) - Number(a.year))
      case 'popular':
      default:
        return [...result].sort(
          (a, b) => (b.popular === true) - (a.popular === true) || b.rating - a.rating
        )
    }
  }, [cars, category, transmission, locationFilter, sortBy, query, popularOnly, savedOnly, availableOnly, favorites])

  const resetFilters = () => {
    setCategory('All')
    setTransmission('All Transmissions')
    setLocationFilter('All')
    setSortBy('popular')
    setQuery('')
    setGeoMessage('')
    setPopularOnly(false)
    setSavedOnly(false)
    setAvailableOnly(false)
    if (onClearFavoritesFilter) onClearFavoritesFilter()
  }

  const isAnyFilterActive =
    category !== 'All' ||
    transmission !== 'All Transmissions' ||
    locationFilter !== 'All' ||
    query !== '' ||
    popularOnly ||
    savedOnly ||
    availableOnly

  // Dynamically compute available categories from live inventory (hiding categories with 0 vehicles)
  const availableCategories = useMemo(() => {
    const rawCategories = Array.from(new Set(cars.map((c) => c.category).filter(Boolean)))
    const presentCategories = rawCategories.filter((cat) => cars.some((c) => c.category === cat))
    return ['All', ...presentCategories]
  }, [cars])

  // Fallback to All if active category was deleted or emptied
  React.useEffect(() => {
    if (category !== 'All' && !availableCategories.includes(category)) {
      setCategory('All')
    }
  }, [availableCategories, category])

  return (
    <section id="cars" className="bg-slate-50/60 py-16 sm:py-20 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
          <div>
            <span className="section-eyebrow">Bangalore Fleet</span>
            <h2 className="section-heading">
              Available Cars for Rent
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
              Select your preferred car model, transmission, or pickup hub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
              Showing <strong className="text-accent-600">{filteredCars.length}</strong> of {cars.length} vehicles
            </span>
          </div>
        </div>

        {/* Filter Bar Card */}
        <div className="mb-8 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
          
          {/* Row 1: Search Input + Category Chips */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full lg:max-w-xs">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Creta, Thar, BMW..."
                className="input-field pl-9 pr-8 text-xs py-2"
                aria-label="Search cars"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Segmented Pills (Dynamic & Data-driven) */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {availableCategories.map((cat) => {
                const count = cat === 'All' ? cars.length : cars.filter((c) => c.category === cat).length
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {cat} <span className={`text-[10px] ml-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 2: Location Selector + Sort + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            
            {/* Location Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex items-center">
                <MapPin size={13} className="absolute left-2.5 text-accent-500 pointer-events-none" />
                <select
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value)
                    setGeoStatus(null)
                  }}
                  className="input-field pl-7 pr-7 text-xs py-1.5 font-bold w-auto bg-slate-50 border-slate-200"
                  aria-label="Filter cars by location"
                >
                  <option value="All">📍 All Bangalore Locations ({locations.length} Hubs)</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.zone ? `(${loc.zone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Find Near Me Action */}
              <button
                type="button"
                onClick={handleFindNearMe}
                disabled={geoLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-accent-400 hover:text-accent-600 transition-colors"
                title="Detect nearest Bangalore hub"
              >
                {geoLoading ? (
                  <Loader2 size={12} className="animate-spin text-accent-600" />
                ) : (
                  <Navigation size={12} className="text-accent-600" />
                )}
                <span>{geoLoading ? 'Detecting...' : 'Near Me'}</span>
              </button>
            </div>

            {/* Transmission & Sort */}
            <div className="flex items-center gap-2">
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="input-field w-auto text-xs py-1.5 font-semibold"
                aria-label="Filter by transmission"
              >
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field w-auto text-xs py-1.5 font-semibold"
                aria-label="Sort cars"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Geo Detection Notice Pill */}
          {geoStatus && (
            <div
              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold animate-fade-in ${
                geoStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : geoStatus.type === 'detecting'
                  ? 'bg-accent-50 border border-accent-200 text-accent-900'
                  : 'bg-slate-100 border border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {geoStatus.type === 'detecting' ? (
                  <Loader2 size={13} className="animate-spin text-accent-600 shrink-0" />
                ) : geoStatus.type === 'success' ? (
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                ) : (
                  <MapPin size={13} className="text-slate-500 shrink-0" />
                )}
                <span>{geoStatus.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setGeoStatus(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
                aria-label="Dismiss notice"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Row 3: Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPopularOnly((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  popularOnly
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Star size={12} className={popularOnly ? 'fill-white' : 'text-amber-500 fill-amber-500'} />
                <span>Popular</span>
              </button>

              <button
                type="button"
                onClick={() => setSavedOnly((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  savedOnly
                    ? 'bg-accent-500 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Heart size={12} className={savedOnly ? 'fill-white' : 'text-accent-500'} />
                <span>Saved ({favorites.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAvailableOnly((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  availableOnly
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <CheckCircle2 size={12} className={availableOnly ? 'text-white' : 'text-emerald-600'} />
                <span>Available Only</span>
              </button>

              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent-600 hover:text-accent-700 ml-2"
                >
                  <RotateCcw size={11} />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            {locationFilter !== 'All' && (
              <span className="text-[11px] font-semibold text-slate-500">
                Filtered: <strong className="text-slate-800 font-bold">{locationMap[locationFilter] || locationFilter}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Fleet Grid / Loading Skeletons / Empty State */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {Array.from({ length: 8 }).map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 px-6 text-center shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-600 mb-3">
              <Car size={24} />
            </div>
            <h3 className="font-display text-base font-extrabold text-slate-900">
              {cars.length === 0
                ? 'Fleet Catalog Updating'
                : 'No vehicles found for selected filters'}
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 max-w-md">
              {cars.length === 0
                ? 'We are currently updating our fleet inventory. For instant booking and custom vehicle requirements, please contact our Bangalore desk directly.'
                : locationFilter !== 'All'
                ? `No cars are currently assigned to ${locationMap[locationFilter] || 'this location'}. Try switching to "All Bangalore Locations" or doorstep delivery.`
                : 'Try adjusting your search criteria or resetting filters.'}
            </p>
            {cars.length > 0 && (
              <button
                onClick={resetFilters}
                className="btn-accent mt-5 text-xs !py-2.5 !px-5"
              >
                <RotateCcw size={13} />
                <span>Show All {cars.length} Cars in Bangalore</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                days={validDays}
                locationMap={locationMap}
                isFavorite={favorites.includes(car.id)}
                onToggleFavorite={onToggleFavorite}
                onViewDetails={onViewDetails}
                onBookNow={onBookNow}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
