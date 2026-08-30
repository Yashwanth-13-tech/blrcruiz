import React, { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import { CarProvider, useCars } from './context/CarContext.jsx'
import AdminLayout from './admin/layouts/AdminLayout.jsx'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import BookingSearch from './components/BookingSearch.jsx'
import VehicleCategories from './components/VehicleCategories.jsx'
import CarInventory from './components/CarInventory.jsx'
import CarDetailsModal from './components/CarDetailsModal.jsx'
import BookingModal from './components/BookingModal.jsx'
import WhyChooseUs from './components/WhyChooseUs.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import BangaloreLocations from './components/BangaloreLocations.jsx'
import AirportSection from './components/AirportSection.jsx'
import LongTermRental from './components/LongTermRental.jsx'
import Testimonials from './components/Testimonials.jsx'
import Stats from './components/Stats.jsx'
import FAQ from './components/FAQ.jsx'
import Contact from './components/Contact.jsx'
import MobileContactBar from './components/MobileContactBar.jsx'
import Footer from './components/Footer.jsx'
import Reveal from './components/Reveal.jsx'
import LegalTerms from './components/LegalTerms.jsx'
import { pickupLocations } from './config/business.js'

const FAVORITES_KEY = 'drivora_favorites'

function PublicWebsite() {
  const { cars } = useCars()
  const [search, setSearch] = useState({
    pickupLocation: pickupLocations[0],
    pickupDate: '',
    returnDate: '',
    category: 'All',
    searchTrigger: 0,
  })

  const [favorites, setFavorites] = useState([])
  const [detailsCar, setDetailsCar] = useState(null)
  const [bookingCar, setBookingCar] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState(false)

  // Load favorites from localStorage on first render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY)
      if (stored) setFavorites(JSON.parse(stored))
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    } catch {
      // ignore storage errors
    }
  }, [favorites])

  const toggleFavorite = (carId) => {
    setFavorites((prev) =>
      prev.includes(carId) ? prev.filter((id) => id !== carId) : [...prev, carId]
    )
  }

  const runSearch = () => {
    setSearch((prev) => ({ ...prev, searchTrigger: prev.searchTrigger + 1 }))
    const el = document.getElementById('cars')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const browseCategory = (category) => {
    setSearch((prev) => ({ ...prev, category, searchTrigger: prev.searchTrigger + 1 }))
    setOnlyFavoritesFilter(false)
    const el = document.getElementById('cars')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectLocation = (locationName) => {
    setSearch((prev) => ({ ...prev, pickupLocation: locationName, searchTrigger: prev.searchTrigger + 1 }))
    setOnlyFavoritesFilter(false)
    const el = document.getElementById('cars')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const handleShowFavorites = () => {
    setOnlyFavoritesFilter(true)
    const el = document.getElementById('cars')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  // Open booking modal with first car from inventory by default
  const openBookingFromHeader = () => {
    setBookingCar(cars[0] || null)
    setShowBookingModal(true)
  }

  const handleViewDetails = (car) => setDetailsCar(car)

  const handleBookNow = (car) => {
    setDetailsCar(null)
    setBookingCar(car)
    setShowBookingModal(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        onBookNow={openBookingFromHeader}
        favoritesCount={favorites.length}
        onShowFavorites={handleShowFavorites}
      />
      <Hero onBrowseCategory={browseCategory} />
      <BookingSearch search={search} setSearch={setSearch} onSearch={runSearch} />

      <Reveal>
        <VehicleCategories onBrowseCategory={browseCategory} />
      </Reveal>

      <CarInventory
        search={search}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onViewDetails={handleViewDetails}
        onBookNow={handleBookNow}
        onlyFavoritesFilter={onlyFavoritesFilter}
        onClearFavoritesFilter={() => setOnlyFavoritesFilter(false)}
      />

      <Reveal>
        <HowItWorks />
      </Reveal>

      <Reveal>
        <WhyChooseUs />
      </Reveal>

      <Reveal>
        <AirportSection />
      </Reveal>

      <Reveal>
        <BangaloreLocations onSelectLocation={handleSelectLocation} />
      </Reveal>

      <Reveal>
        <LongTermRental />
      </Reveal>

      <Reveal>
        <Stats />
      </Reveal>

      <Reveal>
        <Testimonials />
      </Reveal>

      <Reveal>
        <FAQ />
      </Reveal>

      <Reveal>
        <Contact />
      </Reveal>

      <Footer />

      <MobileContactBar onBookNow={openBookingFromHeader} />

      {detailsCar && (
        <CarDetailsModal
          car={detailsCar}
          search={search}
          onClose={() => setDetailsCar(null)}
          onContinueBooking={handleBookNow}
        />
      )}

      {showBookingModal && (
        <BookingModal
          car={bookingCar || cars[0]}
          search={search}
          onClose={() => {
            setShowBookingModal(false)
            setBookingCar(null)
          }}
        />
      )}
    </div>
  )
}

function determineActiveRoute() {
  if (typeof window === 'undefined') return 'public'
  const path = window.location.pathname.toLowerCase()
  const hash = window.location.hash.toLowerCase()
  const search = window.location.search.toLowerCase()
  
  if (
    path.startsWith('/admin') ||
    path.includes('/admin') ||
    hash.startsWith('#admin') ||
    hash.includes('admin') ||
    search.includes('admin=true') ||
    search.includes('page=admin')
  ) {
    return 'admin'
  }

  if (
    path.startsWith('/terms') ||
    path.startsWith('/legal') ||
    hash.startsWith('#terms') ||
    hash.startsWith('#legal') ||
    search.includes('page=terms') ||
    search.includes('page=legal')
  ) {
    return 'terms'
  }

  return 'public'
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(determineActiveRoute)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(determineActiveRoute())
    }

    // Global navigation functions for instant routing
    window.navigateToAdmin = () => {
      window.location.hash = '#admin'
      setCurrentRoute('admin')
    }

    window.navigateToTerms = () => {
      window.location.hash = '#terms'
      setCurrentRoute('terms')
    }

    window.navigateToPublic = () => {
      if (window.location.hash.includes('admin') || window.location.hash.includes('terms') || window.location.hash.includes('legal')) {
        window.location.hash = ''
      }
      if (window.location.pathname.includes('/admin') || window.location.pathname.includes('/terms') || window.location.pathname.includes('/legal')) {
        window.history.pushState(null, '', '/')
      }
      setCurrentRoute('public')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Keyboard shortcut (Ctrl + Shift + A) to open Admin Portal
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        if (currentRoute === 'admin') {
          window.navigateToPublic()
        } else {
          window.navigateToAdmin()
        }
      }
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentRoute])

  return (
    <AuthProvider>
      <CarProvider>
        {currentRoute === 'admin' ? (
          <AdminLayout />
        ) : currentRoute === 'terms' ? (
          <LegalTerms onBackToHome={() => window.navigateToPublic()} />
        ) : (
          <PublicWebsite />
        )}
      </CarProvider>
    </AuthProvider>
  )
}
