import React from 'react'
import { CalendarRange, CheckCircle2, MessageCircle } from 'lucide-react'
import { createWhatsAppLink, monthlyRentalMessage } from '../utils/whatsapp.js'

const POINTS = [
  'Save up to 30% compared to daily rental rates',
  'GST Tax Invoices for corporate expense claims',
  'Free routine servicing & doorstep maintenance',
  'Flexible renewals with zero long-term lock-in',
]

export default function LongTermRental() {
  return (
    <section className="bg-slate-50/50 py-16 sm:py-20 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">

          {/* Left Text */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-accent-500 shadow-2xs">
                <CalendarRange size={15} />
              </span>
              <span className="section-eyebrow !mb-0">30+ Days Subscription</span>
            </div>

            <h2 className="section-heading">
              Monthly Car Rentals in Bangalore
            </h2>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500 max-w-xl">
              Ideal for corporate relocation, expats, and extended projects. All-inclusive insurance, free servicing, and doorstep handover with zero loan commitments.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POINTS.map((p) => (
                <div key={p} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>{p}</span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <a
                href={createWhatsAppLink(monthlyRentalMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp text-xs !py-2.5 !px-4 font-bold inline-flex items-center gap-1.5"
              >
                <MessageCircle size={15} />
                <span>Get Monthly Quote on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Visual Card */}
          <div className="relative lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80"
                alt="Rental cars available for monthly hire in Bangalore"
                className="h-64 sm:h-72 w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

              <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white p-3.5 shadow-sm border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-600 block">
                  Monthly Subscription Plan
                </span>
                <p className="font-display text-sm font-extrabold text-slate-900 mt-0.5">
                  Starting from ₹50,000 / month
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Includes insurance, free servicing &amp; 3000 KMs/month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
