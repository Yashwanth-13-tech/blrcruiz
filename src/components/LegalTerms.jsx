import React, { useEffect } from 'react'
import {
  CreditCard,
  Shield,
  FileText,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  Car,
  Phone,
  MessageCircle,
  Mail,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { business } from '../config/business.js'
import { createWhatsAppLink, createCallLink, genericInquiryMessage } from '../utils/whatsapp.js'

const SECTIONS = [
  {
    id: 'booking-payment',
    number: '1',
    icon: CreditCard,
    title: 'Booking & Payment',
    subtitle: 'Payment terms and booking requirements',
    points: [
      <>Booking is confirmed only after a <strong className="text-slate-900 font-semibold">₹1000 advance payment</strong>.</>,
      <>We accept Credit Cards, Debit Cards, UPI, and Cash.</>,
      <>Valid driving license and government ID proof are mandatory.</>,
      <>The customer must be at least <strong className="text-slate-900 font-semibold">20 years old</strong> to rent a car.</>,
    ],
  },
  {
    id: 'security-deposit',
    number: '2',
    icon: Shield,
    title: 'Security Deposit',
    subtitle: 'Deposit requirements and refund policy',
    points: [
      <>A <strong className="text-slate-900 font-semibold">refundable security deposit</strong> must be paid at the time of booking.</>,
      <>The deposit will be refunded after vehicle inspection, provided there is no damage, traffic fine, or pending payment.</>,
      <>Security deposit options: 2-wheeler with RC or ₹10,000 cash deposit.</>,
    ],
  },
  {
    id: 'customer-responsibility',
    number: '3',
    icon: FileText,
    title: 'Responsibility of the Customer',
    subtitle: 'Your obligations during the rental period',
    points: [
      <>The customer is responsible for <strong className="text-slate-900 font-semibold">fuel, tolls, parking, and traffic fines</strong> during the rental period.</>,
      <>The customer must return the car at the agreed time and location. <strong className="text-slate-900 font-semibold">Late returns may attract extra charges.</strong></>,
      <>The customer is responsible for any damage, accident, or loss caused during the rental period due to careless driving or violation of rules.</>,
      <>Daily limit: <strong className="text-slate-900 font-semibold">300 km</strong>. Extra kilometers will be charged at ₹10/km.</>,
    ],
  },
  {
    id: 'insurance-accidents',
    number: '4',
    icon: ShieldAlert,
    title: 'Insurance & Accidents',
    subtitle: 'Coverage and incident reporting',
    points: [
      <>All cars are covered with <strong className="text-slate-900 font-semibold">basic insurance</strong>.</>,
      <>In case of an accident, the customer must <strong className="text-slate-900 font-semibold">inform the company immediately</strong>.</>,
      <>Insurance will <strong className="text-slate-900 font-semibold">not cover damages</strong> caused due to drunk driving or reckless behavior.</>,
    ],
  },
  {
    id: 'important-notice',
    number: '5',
    icon: AlertTriangle,
    title: 'Important Notice',
    subtitle: 'Please be aware of these restrictions',
    isWarning: true,
    points: [
      <><strong className="text-red-700 font-semibold">No smoking</strong> inside the vehicle.</>,
      <><strong className="text-red-700 font-semibold">No pets</strong> allowed inside the vehicle.</>,
      <>Vehicle should not be used for any <strong className="text-red-700 font-semibold">illegal activities</strong>.</>,
      <>Subletting the vehicle to third parties is <strong className="text-red-700 font-semibold">strictly prohibited</strong>.</>,
    ],
  },
]

export default function LegalTerms({ onBackToHome }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
          <div
            onClick={onBackToHome}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Car size={20} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base font-black tracking-tight text-slate-900 leading-none">
                {business.name}
              </span>
              <span className="text-[10px] font-bold text-accent-500 tracking-wider uppercase mt-0.5">
                {business.tagline}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-accent-400 hover:text-accent-600 transition-colors shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Page Hero Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs">
            <Lock size={12} className="text-accent-500" />
            <span>Legal Information</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Terms and Conditions of Car Rental Bengaluru
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Please read these terms carefully before booking your vehicle.
          </p>
        </div>

        {/* 5 Structured Sections */}
        <div className="space-y-6">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon
            const isWarn = sec.isWarning || sec.id === 'important-notice'

            return (
              <section
                key={sec.id}
                className={`rounded-2xl p-6 sm:p-7 shadow-xs transition-all ${
                  isWarn
                    ? 'border border-red-200/90 bg-red-50/50 hover:border-red-300'
                    : 'border border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                      isWarn
                        ? 'bg-red-100 text-red-600 border-red-200'
                        : 'bg-accent-50 text-accent-600 border-accent-100'
                    }`}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span
                        className={`text-xs font-bold font-mono ${
                          isWarn ? 'text-red-500' : 'text-accent-500'
                        }`}
                      >
                        0{sec.number}.
                      </span>
                      <h2
                        className={`font-display text-lg sm:text-xl font-bold ${
                          isWarn ? 'text-red-700' : 'text-slate-900'
                        }`}
                      >
                        {sec.title}
                      </h2>
                    </div>

                    <p
                      className={`text-xs font-medium mt-0.5 mb-4 ${
                        isWarn ? 'text-red-500/80' : 'text-slate-400'
                      }`}
                    >
                      {sec.subtitle}
                    </p>

                    <ul className="space-y-2.5">
                      {sec.points.map((pt, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed ${
                            isWarn ? 'text-slate-800' : 'text-slate-600'
                          }`}
                        >
                          {isWarn ? (
                            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 size={15} className="text-accent-500 shrink-0 mt-0.5" />
                          )}
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )
          })}
        </div>

        {/* Support & Contact Card */}
        <div className="mt-10 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 text-center shadow-xs">
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
            Have Questions Regarding Rental Policies?
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Our Bangalore fleet operations desk is available 7 days a week to clarify any booking terms.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={createWhatsAppLink(genericInquiryMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp text-xs !py-2.5 !px-4 font-bold justify-center"
            >
              <MessageCircle size={15} />
              <span>WhatsApp Support</span>
            </a>

            <a
              href={createCallLink()}
              className="btn-dark text-xs !py-2.5 !px-4 font-bold justify-center"
            >
              <Phone size={14} />
              <span>{business.phone}</span>
            </a>

            <a
              href={`mailto:${business.email}`}
              className="btn-outline text-xs !py-2.5 !px-4 font-bold justify-center"
            >
              <Mail size={14} />
              <span>{business.email}</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 {business.name} Bangalore. All rights reserved.</p>
          <button
            type="button"
            onClick={onBackToHome}
            className="font-semibold text-accent-600 hover:text-accent-700 underline underline-offset-2"
          >
            Return to Fleet Showcase
          </button>
        </div>
      </footer>
    </div>
  )
}
