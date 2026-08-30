import React from 'react'
import { ShieldCheck, Tag, MousePointerClick, MapPinned, CalendarClock, Headphones, CheckCircle2 } from 'lucide-react'

const REASONS = [
  {
    icon: Tag,
    title: 'Transparent Daily Tariffs',
    text: 'Clear, all-inclusive pricing with GST breakdown and zero hidden charges.',
  },
  {
    icon: ShieldCheck,
    title: 'Sanitized & Inspected Fleet',
    text: 'Multi-point mechanical check and interior deep sanitization before every trip.',
  },
  {
    icon: MousePointerClick,
    title: '60-Sec WhatsApp Booking',
    text: 'Digital driving license verification and rapid confirmation via WhatsApp.',
  },
  {
    icon: MapPinned,
    title: 'Doorstep Handover',
    text: 'Free delivery and pickup at your home, office, hotel, or BLR airport.',
  },
  {
    icon: Headphones,
    title: '24/7 Roadside Assistance',
    text: 'On-ground Bangalore support for puncture assistance, towing, or quick swaps.',
  },
  {
    icon: CalendarClock,
    title: 'Flexible Daily & Monthly Plans',
    text: 'Transparent daily tariffs with up to 30% savings on 30+ day monthly rentals.',
  },
]

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="py-16 sm:py-20 bg-slate-50/50 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 sm:mb-10 max-w-2xl">
          <span className="section-eyebrow">The BLR CRUIZ Advantage</span>
          <h2 className="section-heading">
            Why Rent With Us
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Reliable cars, transparent pricing, and local customer support.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-xs"
            >
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 mb-3.5">
                  <r.icon size={18} className="text-accent-500" />
                </div>

                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 mb-1">
                  {r.title}
                </h3>

                <p className="text-xs leading-relaxed text-slate-500">
                  {r.text}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 size={12} />
                <span>Verified Standard</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
