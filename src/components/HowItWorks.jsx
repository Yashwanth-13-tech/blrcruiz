import React from 'react'
import { Car, CalendarCheck, Send, KeyRound, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    icon: Car,
    title: 'Select Car',
    text: 'Choose from our verified Bangalore fleet.',
  },
  {
    num: '02',
    icon: CalendarCheck,
    title: 'Choose Dates & Hub',
    text: 'Select duration and doorstep or airport handover.',
  },
  {
    num: '03',
    icon: Send,
    title: 'Quick Verification',
    text: 'Instant 60-second digital verification via WhatsApp.',
  },
  {
    num: '04',
    icon: KeyRound,
    title: 'Key Handover',
    text: 'Receive sanitized keys with full tank & drive away.',
  },
]

export default function HowItWorks() {
  const scrollToCars = () => {
    const el = document.getElementById('cars')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <span className="section-eyebrow">Simple 4-Step Process</span>
            <h2 className="section-heading">
              How Renting Works
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Get on the road in 4 straightforward steps.
            </p>
          </div>

          <button
            onClick={scrollToCars}
            className="btn-accent self-start md:self-auto text-xs !py-2 !px-4"
          >
            <span>Browse Cars</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="relative flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 sm:p-6 transition-all duration-200 hover:bg-white hover:border-slate-300 hover:shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-accent-500 shadow-2xs">
                  <step.icon size={18} />
                </span>
                <span className="font-display text-xs font-black text-slate-400">
                  {step.num}
                </span>
              </div>

              <h3 className="font-display text-sm font-bold text-slate-900 mb-1">
                {step.title}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
