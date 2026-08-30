import React from 'react'

export default function CarCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-charcoal-900/10 bg-white p-0 shadow-card animate-pulse">
      {/* Top Image box */}
      <div className="h-52 w-full bg-charcoal-100" />

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 w-3/4">
            <div className="h-3 w-1/3 bg-charcoal-100 rounded-md" />
            <div className="h-5 w-4/5 bg-charcoal-200 rounded-md" />
          </div>
          <div className="h-6 w-12 bg-charcoal-100 rounded-xl" />
        </div>

        {/* Specs 2x2 grid */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="h-8 bg-charcoal-50 rounded-xl" />
          <div className="h-8 bg-charcoal-50 rounded-xl" />
          <div className="h-8 bg-charcoal-50 rounded-xl" />
          <div className="h-8 bg-charcoal-50 rounded-xl" />
        </div>

        {/* Location pill */}
        <div className="h-6 w-2/3 bg-charcoal-50 rounded-xl mt-2" />

        {/* Pricing & CTA */}
        <div className="pt-4 border-t border-charcoal-900/5 flex justify-between items-end">
          <div className="h-7 w-24 bg-charcoal-200 rounded-md" />
          <div className="h-9 w-28 bg-accent-100 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
