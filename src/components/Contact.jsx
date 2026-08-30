import React, { useState } from 'react'
import { MapPin, Phone, MessageCircle, Mail, Clock, CheckCircle2, AlertCircle, Send, Instagram } from 'lucide-react'
import { business } from '../config/business.js'
import { useCars } from '../context/CarContext.jsx'
import { createWhatsAppLink, createCallLink, genericInquiryMessage } from '../utils/whatsapp.js'
import { todayStr, calculateDays } from '../utils/pricing.js'

const PHONE_REGEX = /^[6-9]\d{9}$/

export default function Contact() {
  const { cars, addInquiry } = useCars()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    car: '',
    pickupDate: '',
    returnDate: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Full name is required.'
    const rawPhone = form.phone.trim().replace(/\D/g, '')
    if (!PHONE_REGEX.test(rawPhone))
      next.phone = 'Enter a valid 10-digit Indian mobile number.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      next.email = 'Enter a valid email address.'
    if (form.pickupDate && form.returnDate && calculateDays(form.pickupDate, form.returnDate) === -1)
      next.returnDate = 'Return date cannot be before pickup date.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    addInquiry({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      carName: form.car || 'General Inquiry',
      pickupDate: form.pickupDate,
      returnDate: form.returnDate,
      message: form.message.trim(),
    })
    setSubmitted(true)
  }

  return (
    <section id="contact" className="bg-slate-50/50 py-16 sm:py-20 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 max-w-2xl">
          <span className="section-eyebrow">Contact &amp; Support</span>
          <h2 className="section-heading">
            Get in Touch With Our Bangalore Team
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            Reach us directly via WhatsApp or submit your booking inquiry below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Left Column: Direct Contact Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Quick Action Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 sm:p-6 text-white shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent-400 mb-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Booking Dispatch</span>
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white">
                Instant WhatsApp Support
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Connect directly with our fleet manager for immediate availability and customized rates.
              </p>
              <div className="mt-4 flex gap-2">
                <a
                  href={createWhatsAppLink(genericInquiryMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp flex-1 text-xs !py-2.5 font-bold justify-center"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
                <a
                  href={createCallLink()}
                  className="btn-outline !bg-transparent !text-white !border-slate-700 hover:!bg-white/10 flex-1 text-xs !py-2.5 font-bold justify-center"
                >
                  <Phone size={14} /> Call Now
                </a>
              </div>
            </div>

            {/* Contact Details List */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3.5">
              <InfoRow icon={MapPin} label="Bangalore Central Hub" value={business.address} />
              <InfoRow icon={Phone} label="Direct Phone" value={business.phone} href={createCallLink()} />
              <InfoRow icon={Mail} label="Customer Email" value={business.email} href={`mailto:${business.email}`} />
              <InfoRow icon={Instagram} label="Official Instagram" value="@car._.rental._.bengaluru" href={business.social.instagram} />
              <InfoRow
                icon={Clock}
                label="Operating Hours"
                value={`${business.hours.days} • ${business.hours.time}`}
              />
            </div>
          </div>

          {/* Right Column: Clean Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs">
              {submitted ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Inquiry Received!
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-600">
                    Thank you, {form.name}. Our Bangalore fleet desk will reach out via WhatsApp / Call shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setForm({
                        name: '',
                        phone: '',
                        email: '',
                        car: '',
                        pickupDate: '',
                        returnDate: '',
                        message: '',
                      })
                    }}
                    className="btn-ghost mt-5 text-xs !py-2 !px-4"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <h3 className="font-display text-base font-bold text-slate-900 mb-1">
                    Send a Quick Message
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-name" className="label-field">Full Name *</label>
                      <input
                        id="c-name"
                        type="text"
                        value={form.name}
                        onChange={update('name')}
                        className="input-field text-xs py-2"
                        placeholder="Your full name"
                      />
                      {errors.name && <FieldError msg={errors.name} />}
                    </div>

                    <div>
                      <label htmlFor="c-phone" className="label-field">Phone Number *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          +91
                        </span>
                        <input
                          id="c-phone"
                          type="tel"
                          value={form.phone}
                          onChange={update('phone')}
                          className="input-field pl-10 text-xs py-2"
                          placeholder="94482 77091"
                        />
                      </div>
                      {errors.phone && <FieldError msg={errors.phone} />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-email" className="label-field">Email (Optional)</label>
                      <input
                        id="c-email"
                        type="email"
                        value={form.email}
                        onChange={update('email')}
                        className="input-field text-xs py-2"
                        placeholder="name@example.com"
                      />
                      {errors.email && <FieldError msg={errors.email} />}
                    </div>

                    <div>
                      <label htmlFor="c-car" className="label-field">Preferred Car</label>
                      <select
                        id="c-car"
                        value={form.car}
                        onChange={update('car')}
                        className="input-field text-xs py-2 font-semibold"
                      >
                        <option value="">Any available car</option>
                        {cars.map((c) => (
                          <option key={c.id} value={`${c.brand} ${c.model}`}>
                            {c.brand} {c.model} ({c.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-pickup" className="label-field">Pickup Date</label>
                      <input
                        id="c-pickup"
                        type="date"
                        min={todayStr()}
                        value={form.pickupDate}
                        onChange={update('pickupDate')}
                        className="input-field text-xs py-2"
                      />
                    </div>

                    <div>
                      <label htmlFor="c-return" className="label-field">Return Date</label>
                      <input
                        id="c-return"
                        type="date"
                        min={form.pickupDate || todayStr()}
                        value={form.returnDate}
                        onChange={update('returnDate')}
                        className="input-field text-xs py-2"
                      />
                      {errors.returnDate && <FieldError msg={errors.returnDate} />}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="c-message" className="label-field">Trip Notes / Special Requests</label>
                    <textarea
                      id="c-message"
                      rows={2}
                      value={form.message}
                      onChange={update('message')}
                      className="input-field text-xs py-2 resize-none"
                      placeholder="e.g. airport handover time or doorstep delivery location..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-accent w-full py-2.5 text-xs font-bold"
                  >
                    <span>Submit Inquiry</span>
                    <Send size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoRow({ icon: Icon, label, value, href }) {
  const content = (
    <div className="flex items-start gap-2.5 group">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-accent-500 group-hover:text-white">
        <Icon size={15} />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-xs font-semibold text-slate-900 group-hover:text-accent-600 transition-colors mt-0.5">{value}</p>
      </div>
    </div>
  )
  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }
  return content
}

function FieldError({ msg }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600">
      <AlertCircle size={12} className="shrink-0" />
      <span>{msg}</span>
    </p>
  )
}
