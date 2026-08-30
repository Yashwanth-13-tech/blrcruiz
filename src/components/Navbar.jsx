import React, { useState, useEffect } from 'react'
import {
  Car,
  MessageCircle,
  Menu,
  X,
  Heart,
  ChevronRight,
  MapPin,
  Calendar,
  Instagram,
} from 'lucide-react'
import { business } from '../config/business.js'
import { createWhatsAppLink, genericInquiryMessage } from '../utils/whatsapp.js'

const NAV_LINKS = [
  { href: '#cars', label: 'Explore Fleet', id: 'cars' },
  { href: '#categories', label: 'Categories', id: 'categories' },
  { href: '#terms', label: 'Terms', id: 'terms' },
  { href: '#how-it-works', label: 'How It Works', id: 'how-it-works' },
  { href: '#airport', label: 'Airport Service', id: 'airport' },
  { href: '#reviews', label: 'Reviews', id: 'reviews' },
  { href: '#faq', label: 'FAQ', id: 'faq' },
]

export default function Navbar({ onBookNow, favoritesCount = 0, onShowFavorites }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 15
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev))
          ticking = false
        })
        ticking = true
      }
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const sectionIds = ['home', 'booking-search', 'categories', 'cars', 'how-it-works', 'airport', 'reviews', 'faq']
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { root: null, rootMargin: '-20% 0px -65% 0px', threshold: 0 }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const scrollToSection = (e, href) => {
    e.preventDefault()
    setMenuOpen(false)
    if (href === '#terms' || href === '#legal') {
      if (window.navigateToTerms) window.navigateToTerms()
      else window.location.hash = '#terms'
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const targetId = href.replace('#', '')
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 border-b ${
          scrolled
            ? 'border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs py-3'
            : 'border-slate-200/50 bg-white/90 backdrop-blur-sm py-3.5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => scrollToSection(e, '#home')}
            className="group flex items-center gap-2.5 focus:outline-none"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-white shadow-xs group-hover:bg-accent-600 transition-colors">
              <Car size={20} />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                {business.name.toUpperCase()}
              </span>
              <span className="text-[10px] font-extrabold tracking-wider text-accent-600 uppercase">
                Bangalore Self-Drive
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.id
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => scrollToSection(e, link.href)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2">
            {/* Favorites Icon Button */}
            {favoritesCount > 0 && (
              <button
                type="button"
                onClick={onShowFavorites}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-accent-300 hover:text-accent-600 transition-colors"
                title="View Saved Vehicles"
              >
                <Heart size={16} className="fill-accent-500 text-accent-500" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-extrabold text-white shadow-xs">
                  {favoritesCount}
                </span>
              </button>
            )}

            {/* Direct WhatsApp Action */}
            <a
              href={createWhatsAppLink(genericInquiryMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex btn-whatsapp !py-2 !px-3.5 text-xs font-bold"
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </a>

            {/* Instant Book CTA */}
            <button
              type="button"
              onClick={onBookNow}
              className="btn-accent !py-2 !px-4 text-xs font-bold"
            >
              <span>Instant Book</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 transition-colors md:hidden"
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      <div
        className={`fixed inset-x-0 top-[60px] z-50 origin-top overflow-hidden bg-white shadow-xl transition-all duration-200 md:hidden border-b border-slate-200 ${
          menuOpen ? 'max-h-[85vh] opacity-100 py-5 px-4' : 'max-h-0 opacity-0 p-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-accent-50 text-accent-700 font-extrabold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{link.label}</span>
                <ChevronRight size={15} className={isActive ? 'text-accent-600' : 'text-slate-400'} />
              </a>
            )
          })}
        </div>

        {/* Mobile Bottom Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              onBookNow()
            }}
            className="btn-accent w-full py-2.5 text-xs font-bold justify-center"
          >
            <span>Book a Car Now</span>
          </button>
          <a
            href={createWhatsAppLink(genericInquiryMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp w-full py-2.5 text-xs font-bold justify-center"
          >
            <MessageCircle size={15} />
            <span>Chat on WhatsApp</span>
          </a>
          <a
            href={business.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:border-accent-400 hover:text-accent-600 transition-colors"
          >
            <Instagram size={14} className="text-pink-600" />
            <span>Follow on Instagram</span>
          </a>
        </div>
      </div>
    </>
  )
}
