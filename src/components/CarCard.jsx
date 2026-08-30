import React, { useState, memo } from 'react'
import {
  Users,
  Settings,
  Fuel,
  Star,
  Heart,
  MessageCircle,
  ArrowRight,
  Eye,
  CheckCircle2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatPrice, calculateTotal } from '../utils/pricing.js'
import { createWhatsAppLink } from '../utils/whatsapp.js'
import { useInView } from '../hooks/useInView.js'

const CarCard = memo(function CarCard({
  car,
  days,
  locationMap = {},
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  onBookNow,
}) {
  const images = Array.isArray(car.images) && car.images.length > 0 ? car.images : [car.image]
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  const [heartPopped, setHeartPopped] = useState(false)
  const [cardRef, isInView] = useInView({ threshold: 0.1, triggerOnce: true })

  const estimatedTotal = days > 0 ? calculateTotal(car.pricePerDay, days) : null

  const whatsappMsg = `Hello BLR CRUIZ team, I would like to book the ${car.brand} ${car.model} (${car.year} ${car.transmission})${
    days > 0 ? ` for ${days} days` : ''
  }. Please confirm availability and terms.`

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    setHeartPopped(true)
    setTimeout(() => setHeartPopped(false), 300)
    onToggleFavorite(car.id)
  }

  const handlePrevImg = (e) => {
    e.stopPropagation()
    setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNextImg = (e) => {
    e.stopPropagation()
    setActiveImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  return (
    <div
      ref={cardRef}
      className="hover-lift group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-500 hover:border-slate-300 hover:shadow-md"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView
          ? 'translate3d(0, 0, 0) scale(1)'
          : 'translate3d(0, 24px, 0) scale(0.97)',
        transition: 'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease, box-shadow 200ms ease',
        willChange: isInView ? 'auto' : 'opacity, transform',
      }}
    >
      {/* Top Image Preview Box with Smooth Drive-In Zoom */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
        <img
          src={images[activeImgIndex] || car.image}
          alt={`${car.brand} ${car.model} for rent in Bangalore`}
          className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
          style={{
            transform: isInView ? 'scale(1) translate3d(0, 0, 0)' : 'scale(1.05) translate3d(8px, 0, 0)',
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 z-10">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-2xs ${
              car.available
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-white/80'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                car.available ? 'bg-emerald-300' : 'bg-slate-400'
              }`}
            />
            {car.available ? 'Available' : 'Booked'}
          </span>

          {car.popular && (
            <span className="rounded-md bg-accent-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from saved' : 'Save vehicle'}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-xs transition-all duration-200 active:scale-75 ${
            heartPopped ? 'scale-125' : 'scale-100'
          } ${
            isFavorite
              ? 'bg-accent-500 text-white ring-2 ring-accent-400'
              : 'bg-white/90 text-slate-700 hover:bg-white hover:text-accent-500'
          }`}
        >
          <Heart
            size={15}
            className={`transition-transform duration-200 ${
              isFavorite ? 'fill-white text-white' : ''
            }`}
          />
        </button>

        {/* Multi-Image Hover Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-slate-900"
              aria-label="Previous photo"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-slate-900"
              aria-label="Next photo"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Multi-Image Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveImgIndex(idx)
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeImgIndex === idx ? 'w-4 bg-accent-500' : 'w-1.5 bg-white/70 hover:bg-white'
                }`}
                aria-label={`View photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        
        {/* Title, Category & Rating */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {car.category} • {car.year}
            </span>
            <h3 className="font-display text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-accent-600 transition-colors">
              {car.brand} {car.model}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/70 px-2 py-0.5 text-xs font-bold text-amber-900">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{car.rating}</span>
          </div>
        </div>

        {/* Key Specs Pills */}
        <div className="mt-1 grid grid-cols-3 gap-1.5 text-[11px] font-semibold text-slate-600">
          <div className="flex items-center justify-center gap-1 rounded-lg bg-slate-50 border border-slate-100 py-1.5">
            <Users size={13} className="text-slate-400 shrink-0" />
            <span>{car.seats} Seats</span>
          </div>
          <div className="flex items-center justify-center gap-1 rounded-lg bg-slate-50 border border-slate-100 py-1.5 truncate">
            <Settings size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{car.transmission}</span>
          </div>
          <div className="flex items-center justify-center gap-1 rounded-lg bg-slate-50 border border-slate-100 py-1.5">
            <Fuel size={13} className="text-slate-400 shrink-0" />
            <span>{car.fuel}</span>
          </div>
        </div>

        {/* Location Availability */}
        {Array.isArray(car.locations) && car.locations.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
            <MapPin size={12} className="text-accent-500 shrink-0" />
            <span className="truncate">
              {car.locations
                .map((lid) => locationMap[lid] || lid.replace('loc_', '').replace(/_/g, ' '))
                .slice(0, 2)
                .join(', ')}
              {car.locations.length > 2 && (
                <span className="text-accent-600 font-bold ml-0.5">
                  +{car.locations.length - 2}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Pricing & Actions Footer */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col gap-3">
          
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] font-medium text-slate-400 block">Daily Tariff</span>
              <p className="font-display text-lg sm:text-xl font-extrabold text-slate-900">
                {formatPrice(car.pricePerDay)}
                <span className="text-xs font-normal text-slate-500">/day</span>
              </p>
            </div>

            {estimatedTotal !== null ? (
              <div className="text-right">
                <span className="text-[10px] font-bold text-accent-600 block">{days} Days Total</span>
                <span className="font-display text-sm font-extrabold text-slate-900">
                  {formatPrice(estimatedTotal)}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> Free Doorstep
              </span>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={() => onViewDetails(car)}
              className="col-span-2 btn-outline text-xs !py-2 font-bold justify-center"
              title="View full car details"
            >
              <Eye size={13} />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={() => onBookNow(car)}
              className="col-span-2 btn-accent text-xs !py-2 font-bold justify-center"
            >
              <span>Book</span>
              <ArrowRight size={13} />
            </button>

            <a
              href={createWhatsAppLink(whatsappMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-1 btn-whatsapp !p-0 !py-2 justify-center"
              title="Chat on WhatsApp"
            >
              <MessageCircle size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
})

export default CarCard
