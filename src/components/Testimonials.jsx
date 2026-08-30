import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Rahul Mukherji',
    role: 'Product Lead, Koramangala',
    car: 'Hyundai Creta Auto',
    text: 'I needed a dependable SUV for a week-long road trip to Chikmagalur. The Creta was sparkling clean, delivered right at my apartment gate, and the pricing had zero hidden surprises.',
    rating: 5,
    date: '2 weeks ago',
  },
  {
    name: 'Priya Sundaram',
    role: 'Consultant, Indiranagar',
    car: 'Honda City',
    text: 'Booked an automatic sedan for client visits and airport transfers. The handover took under 4 minutes. Highly recommended over traditional taxi apps for business travelers in Bangalore.',
    rating: 5,
    date: 'Last month',
  },
  {
    name: 'Arjun Kamath',
    role: 'Tech Founder, HSR Layout',
    car: 'BMW 3 Series',
    text: 'Rented the 3 Series for a wedding weekend. Pristine German engineering, immaculate interior condition, and polite customer support on WhatsApp. Will definitely rent again!',
    rating: 5,
    date: '3 weeks ago',
  },
  {
    name: 'Sneha Raghunath',
    role: 'Doctor, Whitefield',
    car: 'Mahindra Thar 4x4',
    text: 'Took the Thar up to Coorg. Awesome suspension, rugged performance, and zero issues on mountain roads. The team even provided a free emergency puncture kit and phone mount.',
    rating: 5,
    date: '1 month ago',
  },
]

export default function Testimonials() {
  const [index, setIndex] = useState(0)

  const next = () => setIndex((i) => (i + 1) % TESTIMONIALS.length)
  const prev = () => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)

  const t = TESTIMONIALS[index]

  useEffect(() => {
    let timer = null
    const startTimer = () => {
      timer = setInterval(next, 6500)
    }
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timer) clearInterval(timer)
      } else {
        startTimer()
      }
    }

    startTimer()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <section id="reviews" className="py-16 sm:py-20 bg-slate-50/50 border-t border-slate-200/80">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-10 text-center">
          <span className="section-eyebrow">Customer Reviews</span>
          <h2 className="section-heading">
            Trusted by 500+ Bangalore Drivers
          </h2>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-800 shadow-2xs">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>4.8 / 5.0 Rating Across 320+ Verified Google Reviews</span>
          </div>
        </div>

        {/* Testimonial Card */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 text-center shadow-xs">
          <Quote size={32} className="mx-auto mb-4 text-accent-500 opacity-80" />

          <p className="mx-auto max-w-2xl text-sm sm:text-base font-medium leading-relaxed text-slate-800">
            "{t.text}"
          </p>

          <div className="mt-4 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={15}
                className={i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
              />
            ))}
          </div>

          <div className="mt-3">
            <p className="font-display text-sm font-bold text-slate-900">
              {t.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.role} • Rented <span className="text-accent-600 font-semibold">{t.car}</span> ({t.date})
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              aria-label="Previous review"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to review ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === index ? 'w-5 bg-accent-500' : 'w-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Next review"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
