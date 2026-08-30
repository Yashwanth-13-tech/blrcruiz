import React from 'react'
import { MapPin, MessageCircle, Navigation, CheckCircle2, ArrowRight } from 'lucide-react'
import { createWhatsAppLink, genericInquiryMessage } from '../utils/whatsapp.js'
import { useCars } from '../context/CarContext.jsx'

export default function BangaloreLocations({ onSelectLocation }) {
  const { locations } = useCars()

  const handleLocationClick = (loc) => {
    if (onSelectLocation) {
      onSelectLocation(loc.name)
    }
  }

  return (
    <section className="bg-slate-50/50 py-16 sm:py-20 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <span className="section-eyebrow">Handover Coverage</span>
            <h2 className="section-heading">
              Pick Up at 10+ Bangalore Hubs or Doorstep Delivery
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
              Select any hub to view cars available for instant pickup or doorstep delivery.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl self-start md:self-auto">
            <CheckCircle2 size={14} />
            <span>Free Doorstep Delivery on 3+ Days</span>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {locations.map((loc) => (
            <div
              key={loc.id || loc.name}
              onClick={() => handleLocationClick(loc)}
              role="button"
              tabIndex={0}
              className="hover-lift group flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 transition-all duration-200 hover:border-accent-300 hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600 group-hover:bg-accent-500 group-hover:text-white transition-colors">
                    <MapPin size={14} />
                  </span>
                  <span className="text-[10px] font-bold text-accent-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    View <ArrowRight size={10} />
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-accent-600 transition-colors truncate">
                  {loc.name}
                </h3>
              </div>
              <span className="text-[10px] font-medium text-slate-500 block truncate mt-1.5">
                {loc.zone || 'Bangalore Hub'}
              </span>
            </div>
          ))}
        </div>

        {/* WhatsApp Custom Pin Card */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Navigation size={18} />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-slate-900">Don't see your specific locality?</p>
              <p className="text-xs text-slate-500">We deliver across Greater Bangalore. Send us your location pin.</p>
            </div>
          </div>

          <a
            href={createWhatsAppLink(genericInquiryMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp text-xs !py-2 !px-4 font-bold shrink-0 self-start sm:self-auto"
          >
            <MessageCircle size={14} />
            <span>Send Location Pin on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
}
