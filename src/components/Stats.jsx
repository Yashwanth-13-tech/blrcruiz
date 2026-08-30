import React, { useEffect, useRef, useState } from 'react'
import { Users, Car, Star, Headphones } from 'lucide-react'
import { useCars } from '../context/CarContext.jsx'

function Counter({ value, suffix, decimal }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    let animId = null
    let isMounted = true

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1200
          const start = performance.now()
          const tick = (now) => {
            if (!isMounted) return
            const progress = Math.min((now - start) / duration, 1)
            const current = value * progress
            setDisplay(decimal ? current.toFixed(1) : Math.round(current))
            if (progress < 1) {
              animId = requestAnimationFrame(tick)
            }
          }
          animId = requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => {
      isMounted = false
      if (animId) cancelAnimationFrame(animId)
      observer.disconnect()
    }
  }, [value, decimal])

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}

export default function Stats() {
  const { cars } = useCars()

  const statsList = [
    { icon: Users, value: 500, suffix: '+', label: 'Satisfied Renters', sub: 'Verified in Bangalore' },
    { icon: Car, value: cars.length || 25, suffix: '+', label: 'Fleet Vehicles', sub: 'Inspected & sanitized' },
    { icon: Star, value: 4.8, suffix: '/5', label: 'Google Rating', sub: 'From 320+ verified reviews', decimal: true },
    { icon: Headphones, value: 24, suffix: '/7', label: 'Roadside Support', sub: 'Bangalore on-ground team' },
  ]

  return (
    <section className="bg-white py-14 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {statsList.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-100 bg-slate-50/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-accent-600 mb-2 shadow-2xs">
                <s.icon size={18} />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-black text-slate-900">
                <Counter value={s.value} suffix={s.suffix} decimal={s.decimal} />
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-800">{s.label}</p>
              <p className="text-[10px] text-slate-500">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
