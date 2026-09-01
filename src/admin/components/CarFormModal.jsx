import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Save,
  AlertCircle,
  Car,
  DollarSign,
  Settings,
  Image as ImageIcon,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'
import ImageUploader from './ImageUploader.jsx'
import { useCars } from '../../context/CarContext.jsx'

const CATEGORIES = ['Hatchback', 'Sedan', 'SUV', 'Luxury']
const TRANSMISSIONS = ['Automatic', 'Manual']
const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']

const CATEGORY_DEFAULT_IMAGES = {
  Hatchback: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=800&q=80',
  Sedan: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=800&q=80',
  SUV: 'https://images.unsplash.com/photo-1669882705938-1493a3141dd6?auto=format&fit=crop&w=800&q=80',
  Luxury: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
}

export default function CarFormModal({ car, onSave, onClose, loading }) {
  const isEditing = Boolean(car && car.id)
  const { locations: allLocations } = useCars()

  const [form, setForm] = useState({
    brand: '',
    model: '',
    category: 'Hatchback',
    year: new Date().getFullYear(),
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Petrol',
    ac: true,
    pricePerDay: 1500,
    rating: 4.8,
    popular: false,
    available: true,
    images: [],
    locations: [],
    description: '',
  })

  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('basic') // basic | specs | images | locations

  // Lock body scroll and handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, loading])

  useEffect(() => {
    if (car) {
      setForm({
        brand: car.brand || '',
        model: car.model || '',
        category: car.category || 'Hatchback',
        year: car.year || new Date().getFullYear(),
        seats: car.seats || 5,
        transmission: car.transmission || 'Automatic',
        fuel: car.fuel || 'Petrol',
        ac: car.ac !== undefined ? car.ac : true,
        pricePerDay: car.pricePerDay || 1500,
        rating: car.rating || 4.8,
        popular: Boolean(car.popular),
        available: car.available !== undefined ? car.available : true,
        images: car.images && car.images.length > 0 ? car.images : (car.image ? [car.image] : []),
        locations: Array.isArray(car.locations) ? car.locations : [],
        description: car.description || '',
      })
    }
  }, [car])

  const update = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: val }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  // Check which tabs contain errors
  const tabErrors = useMemo(() => {
    const res = { basic: false, specs: false, images: false, locations: false }
    if (errors.brand || errors.model) res.basic = true
    if (errors.pricePerDay || errors.seats) res.specs = true
    if (errors.images) res.images = true
    return res
  }, [errors])

  const validate = () => {
    const next = {}
    if (!form.brand.trim()) next.brand = 'Brand is required (e.g. Toyota, Hyundai)'
    if (!form.model.trim()) next.model = 'Model is required (e.g. Creta, Fortuner)'
    if (!form.pricePerDay || Number(form.pricePerDay) <= 0) next.pricePerDay = 'Valid daily rate is required'
    if (!form.seats || Number(form.seats) < 1) next.seats = 'Enter valid seat count'

    setErrors(next)

    // If validation fails, automatically switch to the first tab with an error
    if (Object.keys(next).length > 0) {
      if (next.brand || next.model) setActiveTab('basic')
      else if (next.pricePerDay || next.seats) setActiveTab('specs')
      return false
    }
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const finalImages = form.images.length > 0
      ? form.images
      : [CATEGORY_DEFAULT_IMAGES[form.category] || CATEGORY_DEFAULT_IMAGES.Hatchback]
    onSave({
      ...form,
      images: finalImages,
      image: finalImages[0],
    })
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Car },
    { id: 'specs', label: 'Pricing & Specs', icon: DollarSign },
    { id: 'images', label: 'Photos', icon: ImageIcon },
    { id: 'locations', label: 'Locations', icon: MapPin },
  ]

  const handleSelectAllLocations = () => {
    setForm((prev) => ({
      ...prev,
      locations: allLocations.map((l) => l.id),
    }))
  }

  const handleClearAllLocations = () => {
    setForm((prev) => ({
      ...prev,
      locations: [],
    }))
  }

  const modalJSX = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose()
        }
      }}
    >
      {/* Centered Modal Card */}
      <div
        className="relative flex w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex-col rounded-2xl sm:rounded-3xl bg-white shadow-2xl ring-1 ring-charcoal-900/10 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-charcoal-900/10 bg-charcoal-50/70 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-sm shrink-0">
              <Car size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-charcoal-900 leading-tight">
                {isEditing ? `Edit ${car.brand} ${car.model}` : 'Add New Vehicle to Fleet'}
              </h2>
              <p className="text-[11px] sm:text-xs text-charcoal-500 line-clamp-1">
                {isEditing ? 'Update specifications, pricing, locations and photos' : 'Configure vehicle specs, assign Bangalore hubs & upload photos'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-charcoal-400 hover:bg-charcoal-200/60 hover:text-charcoal-700 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 flex border-b border-charcoal-900/10 px-3 sm:px-6 bg-white overflow-x-auto scrollbar-none gap-1 sm:gap-2 pt-1.5 sm:pt-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const hasError = tabErrors[tab.id]
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-accent-500 text-accent-600'
                    : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                <tab.icon size={14} className="sm:w-4 sm:h-4" />
                <span>{tab.label}</span>
                {tab.id === 'images' && form.images.length > 0 && (
                  <span className="rounded-full bg-accent-100 px-1.5 py-0.2 text-[10px] text-accent-700 font-extrabold">
                    {form.images.length}
                  </span>
                )}
                {tab.id === 'locations' && form.locations.length > 0 && (
                  <span className="rounded-full bg-accent-100 px-1.5 py-0.2 text-[10px] text-accent-700 font-extrabold">
                    {form.locations.length}
                  </span>
                )}
                {hasError && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            )
          })}
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
              <AlertCircle size={15} className="shrink-0" />
              <span>Please fill in all required fields marked in red.</span>
            </div>
          )}

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field" htmlFor="f-brand">Brand / Manufacturer *</label>
                  <input
                    id="f-brand"
                    type="text"
                    value={form.brand}
                    onChange={update('brand')}
                    placeholder="e.g. Hyundai, Toyota, BMW"
                    className={`input-field ${errors.brand ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.brand && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.brand}</p>}
                </div>
                <div>
                  <label className="label-field" htmlFor="f-model">Model Name *</label>
                  <input
                    id="f-model"
                    type="text"
                    value={form.model}
                    onChange={update('model')}
                    placeholder="e.g. Creta, Fortuner, 3 Series"
                    className={`input-field ${errors.model ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.model && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.model}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field" htmlFor="f-category">Category *</label>
                  <select
                    id="f-category"
                    value={form.category}
                    onChange={update('category')}
                    className="input-field font-semibold"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field" htmlFor="f-year">Model Year</label>
                  <input
                    id="f-year"
                    type="number"
                    min="2018"
                    max={new Date().getFullYear() + 1}
                    value={form.year}
                    onChange={update('year')}
                    className="input-field font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="label-field" htmlFor="f-desc">Marketing Description</label>
                <textarea
                  id="f-desc"
                  rows={3}
                  value={form.description}
                  onChange={update('description')}
                  placeholder="Short description highlighting key features, fuel economy, comfort, or ideal trip types..."
                  className="input-field resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-3 rounded-2xl border border-charcoal-900/10 p-3.5 cursor-pointer hover:bg-charcoal-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={update('available')}
                    className="h-4 w-4 rounded text-accent-500 focus:ring-accent-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">Available for Booking</p>
                    <p className="text-[11px] text-charcoal-500">Uncheck to mark as booked/in-maintenance</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-charcoal-900/10 p-3.5 cursor-pointer hover:bg-charcoal-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.popular}
                    onChange={update('popular')}
                    className="h-4 w-4 rounded text-accent-500 focus:ring-accent-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">Feature as Recommended</p>
                    <p className="text-[11px] text-charcoal-500">Highlights vehicle on the homepage fleet</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field" htmlFor="f-price">Price Per Day (₹ INR) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-charcoal-400">₹</span>
                    <input
                      id="f-price"
                      type="number"
                      min="500"
                      step="50"
                      value={form.pricePerDay}
                      onChange={update('pricePerDay')}
                      className={`input-field pl-8 font-bold ${errors.pricePerDay ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.pricePerDay && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.pricePerDay}</p>}
                </div>

                <div>
                  <label className="label-field" htmlFor="f-rating">Customer Rating (out of 5.0)</label>
                  <input
                    id="f-rating"
                    type="number"
                    min="3.0"
                    max="5.0"
                    step="0.1"
                    value={form.rating}
                    onChange={update('rating')}
                    className="input-field font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="label-field" htmlFor="f-seats">Seating Capacity *</label>
                  <input
                    id="f-seats"
                    type="number"
                    min="2"
                    max="12"
                    value={form.seats}
                    onChange={update('seats')}
                    className={`input-field font-semibold ${errors.seats ? 'border-red-500' : ''}`}
                  />
                  {errors.seats && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.seats}</p>}
                </div>

                <div>
                  <label className="label-field" htmlFor="f-trans">Transmission</label>
                  <select
                    id="f-trans"
                    value={form.transmission}
                    onChange={update('transmission')}
                    className="input-field font-semibold"
                  >
                    {TRANSMISSIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-field" htmlFor="f-fuel">Fuel Type</label>
                  <select
                    id="f-fuel"
                    value={form.fuel}
                    onChange={update('fuel')}
                    className="input-field font-semibold"
                  >
                    {FUELS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-3 rounded-2xl border border-charcoal-900/10 p-3.5 cursor-pointer hover:bg-charcoal-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.ac}
                    onChange={update('ac')}
                    className="h-4 w-4 rounded text-accent-500 focus:ring-accent-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">Air Conditioning (AC) Equipped</p>
                    <p className="text-[11px] text-charcoal-500">Shows climate control badge on vehicle features</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTOS & GALLERY */}
          {activeTab === 'images' && (
            <div className="animate-fade-in">
              <ImageUploader
                images={form.images}
                onChange={(imgs) => {
                  setForm((prev) => ({ ...prev, images: imgs }))
                  if (errors.images) setErrors((prev) => ({ ...prev, images: null }))
                }}
              />
              {errors.images && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.images}</p>}
            </div>
          )}

          {/* TAB 4: LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="animate-fade-in space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-charcoal-900 flex items-center gap-2">
                    <MapPin size={15} className="text-accent-500" />
                    Assign Bangalore Pickup Hubs
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Select the locations where this vehicle can be picked up or delivered.
                  </p>
                </div>

                {allLocations.length > 0 && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSelectAllLocations}
                      className="text-[11px] font-bold text-accent-600 hover:text-accent-700 underline"
                    >
                      Select All
                    </button>
                    <span className="text-charcoal-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearAllLocations}
                      className="text-[11px] font-semibold text-charcoal-500 hover:text-charcoal-700"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {allLocations.length === 0 ? (
                <div className="rounded-2xl border border-charcoal-900/10 bg-charcoal-50 p-6 text-center">
                  <MapPin size={28} className="text-charcoal-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-charcoal-700">No locations configured</p>
                  <p className="text-[11px] text-charcoal-500 mt-1">
                    Add locations in Admin → Locations to enable hub assignments.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {allLocations.map((loc) => {
                    const isSelected = form.locations.includes(loc.id)
                    return (
                      <label
                        key={loc.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-accent-400 bg-accent-50/80 ring-1 ring-accent-400/40'
                            : 'border-charcoal-900/10 bg-white hover:bg-charcoal-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setForm((prev) => ({
                              ...prev,
                              locations: isSelected
                                ? prev.locations.filter((id) => id !== loc.id)
                                : [...prev.locations, loc.id],
                            }))
                          }}
                          className="h-4 w-4 rounded text-accent-500 focus:ring-accent-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-charcoal-900 truncate">{loc.name}</p>
                          <p className="text-[10px] text-charcoal-500">{loc.zone || 'Bangalore Hub'}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={15} className="text-accent-600 shrink-0" />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}

              {form.locations.length > 0 && (
                <p className="text-[11px] text-accent-600 font-bold">
                  ✓ {form.locations.length} of {allLocations.length} locations assigned
                </p>
              )}
            </div>
          )}
        </form>

        {/* Modal Sticky Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-charcoal-900/10 bg-charcoal-50/70 px-4 sm:px-6 py-3 sm:py-4 gap-2">
          {/* Stepper buttons (Back / Next) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeTab !== 'basic' && (
              <button
                type="button"
                onClick={() => {
                  const order = ['basic', 'specs', 'images', 'locations']
                  const idx = order.indexOf(activeTab)
                  setActiveTab(order[Math.max(0, idx - 1)])
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-charcoal-900/15 bg-white px-2.5 sm:px-3.5 py-2 text-xs font-bold text-charcoal-700 hover:bg-charcoal-100 transition-colors"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            {activeTab !== 'locations' && (
              <button
                type="button"
                onClick={() => {
                  const order = ['basic', 'specs', 'images', 'locations']
                  const idx = order.indexOf(activeTab)
                  setActiveTab(order[Math.min(order.length - 1, idx + 1)])
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-charcoal-900 px-3 sm:px-4 py-2 text-xs font-bold text-white hover:bg-charcoal-800 transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {/* Action buttons (Cancel / Save) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-charcoal-900/15 bg-white px-3 sm:px-4 py-2 text-xs font-bold text-charcoal-700 hover:bg-charcoal-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-accent !py-2 sm:!py-2.5 !px-4 sm:!px-5 text-xs font-bold shadow-sm"
            >
              <Save size={15} />
              <span>{loading ? 'Saving...' : isEditing ? 'Update Vehicle' : 'Add Vehicle'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null
}
