import React, { useState } from 'react'
import { MapPin, Calendar, Car, Search, AlertCircle, Sparkles, Check, Clock, Navigation, Loader2, CheckCircle2 } from 'lucide-react'
import { pickupLocations } from '../config/business.js'
import { CATEGORIES } from '../data/cars.js'
import { useCars } from '../context/CarContext.jsx'
import { calculateDays, todayStr } from '../utils/pricing.js'
import { getUserLocation, findNearestLocation } from '../utils/geolocation.js'

export default function BookingSearch({ search, setSearch, onSearch }) {
  const { cars, locations } = useCars()
  const [rentalMode, setRentalMode] = useState('daily') // daily | monthly | airport
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoStatus, setGeoStatus] = useState(null) // { type, message }

  const days = calculateDays(search.pickupDate, search.returnDate)
  const invalidRange = days === -1

  const activeLocations = locations.length > 0
    ? locations.map((l) => l.name)
    : pickupLocations

  // Dynamically extract categories that actually exist in the fleet
  const dynamicCategories = React.useMemo(() => {
    const rawCategories = Array.from(new Set(cars.map((c) => c.category).filter(Boolean)))
    return ['All', ...rawCategories]
  }, [cars])

  const update = (field) => (e) => {
    setSearch((prev) => ({ ...prev, [field]: e.target.value }))
    if (field === 'pickupLocation') setGeoStatus(null)
  }

  const handleQuickLocation = (loc) => {
    setSearch((prev) => ({ ...prev, pickupLocation: loc }))
    setGeoStatus(null)
  }

  const handleNearMeInSearch = async () => {
    setGeoLoading(true)
    setGeoStatus({ type: 'detecting', message: 'Finding nearest hub...' })

    try {
      const coords = await getUserLocation()
      const nearest = findNearestLocation(coords.latitude, coords.longitude, locations)

      if (nearest) {
        setSearch((prev) => ({ ...prev, pickupLocation: nearest.name }))
        setGeoStatus({
          type: 'success',
          message: `Nearest: ${nearest.name} (~${nearest.distanceKm} km)`,
        })
      } else {
        setGeoStatus({
          type: 'info',
          message: 'All hubs available.',
        })
      }
    } catch (err) {
      setGeoStatus({
        type: 'info',
        message: err.message || 'Location access optional. Select manually.',
      })
    } finally {
      setGeoLoading(false)
    }
  }

  return (
    <div id="booking-search" className="relative z-20 px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 mb-12">
      <div className="mx-auto max-w-6xl rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-md">
        
        {/* Rental Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
            {[
              { id: 'daily', label: 'Daily & Weekend' },
              { id: 'airport', label: '✈️ Airport (BLR)' },
              { id: 'monthly', label: '🗓️ Monthly (30+ Days)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setRentalMode(tab.id)
                  if (tab.id === 'airport') {
                    setSearch((prev) => ({ ...prev, pickupLocation: 'Bangalore Airport (BLR)' }))
                  }
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  rentalMode === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSearch()
          }}
          className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          {/* Pickup location */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="pickupLocation" className="label-field !mb-0">
                <MapPin size={12} className="mr-1 inline text-accent-500" />
                Pickup Hub
              </label>
              <button
                type="button"
                onClick={handleNearMeInSearch}
                disabled={geoLoading}
                className="text-[11px] font-bold text-accent-600 hover:text-accent-700 inline-flex items-center gap-1"
                title="Find closest hub"
              >
                {geoLoading ? (
                  <Loader2 size={10} className="animate-spin text-accent-600" />
                ) : (
                  <Navigation size={10} />
                )}
                <span>Near Me</span>
              </button>
            </div>
            <select
              id="pickupLocation"
              value={search.pickupLocation}
              onChange={update('pickupLocation')}
              className="input-field font-semibold"
            >
              <option value="All Locations">All Bangalore Locations</option>
              {activeLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup date */}
          <div>
            <label htmlFor="pickupDate" className="label-field">
              <Calendar size={12} className="mr-1 inline text-accent-500" />
              Pickup Date
            </label>
            <input
              id="pickupDate"
              type="date"
              min={todayStr()}
              value={search.pickupDate}
              onChange={update('pickupDate')}
              className="input-field font-semibold"
            />
          </div>

          {/* Return date */}
          <div>
            <label htmlFor="returnDate" className="label-field">
              <Calendar size={12} className="mr-1 inline text-accent-500" />
              Return Date
            </label>
            <input
              id="returnDate"
              type="date"
              min={search.pickupDate || todayStr()}
              value={search.returnDate}
              onChange={update('returnDate')}
              className="input-field font-semibold"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="searchCategory" className="label-field">
              <Car size={12} className="mr-1 inline text-accent-500" />
              Car Type
            </label>
            <select
              id="searchCategory"
              value={search.category}
              onChange={update('category')}
              className="input-field font-semibold"
            >
              {dynamicCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Vehicle Types' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Search */}
          <div>
            <button
              type="submit"
              className="btn-accent w-full py-2.5 text-xs font-bold justify-center"
            >
              <Search size={14} />
              <span>Search Cars</span>
            </button>
          </div>
        </form>

        {/* Geo status notice if triggered */}
        {geoStatus && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            {geoStatus.type === 'detecting' ? (
              <Loader2 size={12} className="animate-spin text-accent-600" />
            ) : geoStatus.type === 'success' ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <MapPin size={12} className="text-slate-500" />
            )}
            <span>{geoStatus.message}</span>
          </div>
        )}

        {invalidRange && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <AlertCircle size={14} />
            <span>Return date must be on or after pickup date.</span>
          </p>
        )}
      </div>
    </div>
  )
}
