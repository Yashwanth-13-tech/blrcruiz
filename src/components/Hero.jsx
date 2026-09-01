import React from 'react'
import InteractiveHeroVisual from './InteractiveHeroVisual.jsx'

export default function Hero({ onBrowseCategory }) {
  return (
    <section
      id="home"
      className="relative bg-gradient-to-b from-slate-100/70 via-slate-50/40 to-white pt-24 sm:pt-28 pb-6 sm:pb-8 overflow-hidden"
    >
      {/* Subtle Dot Grid & Ambient Glow Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 h-[500px] w-[880px] max-w-[90vw] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(234,88,12,0.25)_0%,_rgba(255,106,26,0.12)_40%,_transparent_70%)] blur-[80px] pointer-events-none animate-pulse-subtle" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="mx-auto max-w-3xl text-center">
          
          {/* Eyebrow Pill */}
          <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bangalore Self-Drive Fleet</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15] sm:leading-[1.12]">
            <span className="inline-block">
              <span className="hero-word-reveal hero-word-1 mr-2 sm:mr-3">Car</span>
              <span className="hero-word-reveal hero-word-2 mr-2 sm:mr-3">Rental</span>
              <span className="hero-word-reveal hero-word-3 mr-2 sm:mr-3 text-slate-800">in</span>
            </span>{' '}
            <span className="inline-block">
              <span className="bangalore-highlight">
                Bangalore
              </span>
            </span>
          </h1>

          {/* Concise Subtitle (1 sentence) */}
          <p className="mt-2.5 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Sanitized hatchbacks, sedans, SUVs &amp; luxury cars delivered directly to your doorstep across Bangalore.
          </p>
        </div>

        {/* Center Interactive 3D Showcase Stage */}
        <InteractiveHeroVisual onSelectModel={onBrowseCategory} />
      </div>
    </section>
  )
}
