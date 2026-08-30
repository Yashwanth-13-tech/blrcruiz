import React from 'react'
import { LayoutDashboard, Car, MessageSquare, Settings, ExternalLink, LogOut, X, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCars } from '../../context/CarContext.jsx'
import { business } from '../../config/business.js'

export default function AdminSidebar({ activeTab, setActiveTab, sidebarOpen, onCloseSidebar }) {
  const { logout } = useAuth()
  const { cars, inquiries, locations } = useCars()

  const newInquiriesCount = inquiries.filter((i) => i.status === 'New').length

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'cars', label: 'Car Inventory', icon: Car, badge: cars.length },
    { id: 'locations', label: 'Locations', icon: MapPin, badge: locations.length },
    { id: 'inquiries', label: 'Customer Inquiries', icon: MessageSquare, badge: newInquiriesCount > 0 ? newInquiriesCount : null, badgeColor: 'bg-accent-500 text-white' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ]

  const handleNavClick = (id) => {
    setActiveTab(id)
    if (onCloseSidebar) onCloseSidebar()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={onCloseSidebar}
          className="fixed inset-0 z-40 bg-charcoal-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-charcoal-900/10 bg-charcoal-950 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-white shadow-sm">
              <Car size={20} />
            </span>
            <div>
              <span className="font-display text-base font-extrabold tracking-tight">
                {business.name.toUpperCase()}
              </span>
              <span className="ml-1.5 rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-400">
                Admin
              </span>
            </div>
          </div>
          <button
            onClick={onCloseSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
            Management
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-accent-500 text-white shadow-card font-bold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={17} className={isActive ? 'text-white' : 'text-white/60'} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom user & quick actions */}
        <div className="border-t border-white/10 p-3 space-y-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              if (window.navigateToPublic) window.navigateToPublic()
              else window.location.href = '/'
            }}
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ExternalLink size={15} />
            <span>Open Public Website</span>
          </a>

          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
