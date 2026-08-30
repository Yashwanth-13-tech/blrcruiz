import React from 'react'
import { Plane, ArrowRight, CheckCircle2, Phone, Clock } from 'lucide-react'
import { createWhatsAppLink, airportRentalMessage, createCallLink } from '../utils/whatsapp.js'

const AIRPORT_BENEFITS = [
  'Terminal 1 & 2 arrival gate delivery',
  'Automatic flight delay tracking included',
  'Under 5-minute quick key handover',
  'Direct departures drop-off before your flight',
]

export default function AirportSection() {
  return (
    <section id="airport" className="py-16 sm:py-20 bg-white border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-900 lg:grid-cols-12 text-white shadow-xs">
          
          {/* Text & Features */}
          <div className="p-6 sm:p-9 lg:col-span-7">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500 text-white">
                <Plane size={15} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent-400">
                BLR Airport Handover
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight">
              Landing at Kempegowda Airport? Your Car is Ready.
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              Collect sanitized keys at arrivals with zero taxi surge fares and start driving immediately.
            </p>

            <div className="mt-4 space-y-1.5">
              {AIRPORT_BENEFITS.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <a
                href={createWhatsAppLink(airportRentalMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent text-xs !py-2.5 !px-4"
              >
                <span>Reserve Airport Handover</span>
                <ArrowRight size={14} />
              </a>

              <a
                href={createCallLink()}
                className="btn-outline !bg-transparent !text-white !border-slate-700 hover:!bg-white/10 text-xs !py-2.5 !px-4"
              >
                <Phone size={13} />
                <span>Call Airport Desk</span>
              </a>
            </div>
          </div>

          {/* Photo & Badge */}
          <div className="relative h-60 lg:h-full lg:col-span-5">
            <img
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80"
              alt="Airport pickup in Bangalore with BLR CRUIZ"
              className="h-full w-full object-cover min-h-[240px]"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-slate-950 lg:to-transparent" />

            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-slate-900/90 p-3 border border-white/10 text-white text-xs">
              <div className="flex items-center gap-1.5 font-bold text-accent-400">
                <Clock size={12} />
                <span>24/7 Airport Service</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Early morning and red-eye flight handovers supported.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
