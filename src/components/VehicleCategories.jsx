import React from 'react'
import { ArrowRight, Sparkles, Shield, Compass, Crown } from 'lucide-react'
import { useCars } from '../context/CarContext.jsx'
import { formatPrice } from '../utils/pricing.js'

const CATEGORY_META = [
  {
    name: 'City Hatchbacks',
    category: 'Hatchback',
    icon: Compass,
    badge: 'Fuel Efficient',
    image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=600&q=80',
    text: 'Agile city driving and easy parking across Bangalore.',
  },
  {
    name: 'Executive Sedans',
    category: 'Sedan',
    icon: Shield,
    badge: 'Highway Comfort',
    image: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=600&q=80',
    text: 'Refined highway comfort and generous boot space.',
  },
  {
    name: 'Family & Highway SUVs',
    category: 'SUV',
    icon: Sparkles,
    badge: 'Most Popular',
    image: 'https://images.unsplash.com/photo-1669882705938-1493a3141dd6?auto=format&fit=crop&w=600&q=80',
    text: 'Elevated ground clearance and 5-7 passenger seating.',
  },
  {
    name: 'Luxury Fleet',
    category: 'Luxury',
    icon: Crown,
    badge: 'VIP Prestige',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80',
    text: 'Prestige German luxury for executive and VIP travel.',
  },
]

export default function VehicleCategories({ onBrowseCategory }) {
  const { cars } = useCars()

  return (
    <section id="categories" className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <span className="section-eyebrow">Fleet Categories</span>
            <h2 className="section-heading">
              Browse by Vehicle Type
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Economical city hatchbacks to executive sedans and family SUVs.
            </p>
          </div>

          <button
            onClick={() => onBrowseCategory('All')}
            className="btn-outline self-start md:self-auto text-xs !py-2 !px-4"
          >
            <span>View All {cars.length} Cars</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_META.map((c) => {
            const categoryCars = cars.filter((car) => car.category === c.category)
            const minPrice = categoryCars.length > 0
              ? Math.min(...categoryCars.map((car) => Number(car.pricePerDay)))
              : 1499
            const count = categoryCars.length

            return (
              <div
                key={c.name}
                onClick={() => onBrowseCategory(c.category)}
                className="hover-lift group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md cursor-pointer"
              >
                {/* Photo container with zoom */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={c.image}
                    alt={`${c.name} available for rent in Bangalore`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                  {/* Top category badge */}
                  <span className="absolute left-3 top-3 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                    {c.badge}
                  </span>

                  {/* Car Count badge */}
                  <span className="absolute bottom-2.5 left-3 text-xs font-bold text-white drop-shadow-sm">
                    {count} vehicle{count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Body Details */}
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <c.icon size={15} className="text-accent-500" />
                    <h3 className="font-display text-base font-extrabold text-slate-900 group-hover:text-accent-600 transition-colors">
                      {c.name}
                    </h3>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-500 flex-1">
                    {c.text}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">From</span>
                      <span className="font-display text-base font-extrabold text-slate-900">
                        {formatPrice(minPrice)}<span className="text-[11px] font-normal text-slate-500">/day</span>
                      </span>
                    </div>

                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all duration-200 group-hover:bg-accent-500 group-hover:text-white">
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
