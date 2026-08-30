import React from 'react'
import { Car, Instagram, Facebook, Youtube, Phone, MessageCircle, Mail, MapPin, Shield } from 'lucide-react'
import { business } from '../config/business.js'
import { createWhatsAppLink, createCallLink, genericInquiryMessage } from '../utils/whatsapp.js'

const QUICK_LINKS = [
  { label: 'Explore Fleet', href: '#cars' },
  { label: 'Categories', href: '#categories' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Airport Service', href: '#airport' },
  { label: 'Customer Reviews', href: '#reviews' },
  { label: 'Terms & Conditions', href: '#terms', isRoute: true },
  { label: 'FAQs', href: '#faq' },
]

const CATEGORIES = [
  { name: 'City Hatchbacks (from ₹1,499)', href: '#cars' },
  { name: 'Executive Sedans (from ₹2,099)', href: '#cars' },
  { name: 'Family SUVs & 4x4 (from ₹2,299)', href: '#cars' },
  { name: 'Luxury Cars (from ₹7,999)', href: '#cars' },
]

export default function Footer() {
  const scrollTo = (href) => {
    if (href === '#terms' || href === '#legal') {
      if (window.navigateToTerms) window.navigateToTerms()
      else window.location.hash = '#terms'
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-slate-900 pb-20 pt-16 text-white lg:pb-12 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 pb-12 border-b border-slate-800">
          
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-white shadow-xs">
                <Car size={18} />
              </span>
              <span className="font-display text-xl font-black tracking-tight">
                {business.name.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-accent-400 font-bold uppercase tracking-wider">
              {business.tagline}
            </p>

            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              Bangalore's trusted self-drive car rental service. Verified fleet, 10+ pickup hubs, doorstep delivery, and transparent pricing.
            </p>

            {/* Social Icons */}
            <div className="flex gap-2 pt-1">
              <SocialIcon href={business.social.instagram} icon={Instagram} label="Instagram" />
              <SocialIcon href={business.social.facebook} icon={Facebook} label="Facebook" />
              <SocialIcon href={business.social.youtube} icon={Youtube} label="YouTube" />
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <button
                    onClick={() => scrollTo(l.href)}
                    className="hover:text-accent-400 transition-colors text-left"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Car Types
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              {CATEGORIES.map((c) => (
                <li key={c.name}>
                  <button
                    onClick={() => scrollTo('#cars')}
                    className="hover:text-accent-400 transition-colors text-left"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Bangalore Central Desk
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <Phone size={13} className="text-accent-400 shrink-0" />
                <a href={createCallLink()} className="hover:text-accent-400">
                  {business.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={13} className="text-emerald-400 shrink-0" />
                <a
                  href={createWhatsAppLink(genericInquiryMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400"
                >
                  WhatsApp Booking Desk
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="text-accent-400 shrink-0" />
                <a href={`mailto:${business.email}`} className="hover:text-accent-400">
                  {business.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="text-accent-400 shrink-0 mt-0.5" />
                <span>{business.address}, Bangalore</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-slate-500">
          <p>
            © 2026 {business.name} Bangalore. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.navigateToTerms) window.navigateToTerms()
                else window.location.hash = '#terms'
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Terms &amp; Conditions
            </button>
            <button
              onClick={() => {
                if (window.navigateToTerms) window.navigateToTerms()
                else window.location.hash = '#terms'
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Legal Information
            </button>
            <a
              href="#admin"
              onClick={(e) => {
                e.preventDefault()
                if (window.navigateToAdmin) window.navigateToAdmin()
                else window.location.hash = '#admin'
              }}
              className="rounded-md bg-slate-800 hover:bg-accent-500 hover:text-white px-2.5 py-1 text-slate-300 transition-all font-bold"
              title="Administrator Management Portal"
            >
              🔐 Admin Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition-all hover:bg-accent-500 hover:text-white"
    >
      <Icon size={14} />
    </a>
  )
}
