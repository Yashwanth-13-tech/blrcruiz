import React from 'react'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'accent', trend }) {
  const colorMap = {
    accent: 'bg-accent-500/10 text-accent-500 border-accent-500/20',
    green: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    charcoal: 'bg-charcoal-800 text-charcoal-200 border-charcoal-700',
  }

  return (
    <div className="rounded-2xl border border-charcoal-900/10 bg-white p-5 shadow-sm transition-all hover:shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-charcoal-500">{title}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorMap[color] || colorMap.accent}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-3xl font-extrabold text-charcoal-900">{value}</span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-charcoal-500">{subtitle}</p>}
    </div>
  )
}
