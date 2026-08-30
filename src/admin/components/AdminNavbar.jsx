import React from 'react'
import { Menu, ExternalLink, User, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCars } from '../../context/CarContext.jsx'

export default function AdminNavbar({ onToggleSidebar, activeTab, setActiveTab }) {
  const { user, logout } = useAuth()
  const { inquiries } = useCars()

  const newInquiriesCount = inquiries.filter((i) => i.status === 'New').length

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-charcoal-900/10 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-charcoal-600 hover:bg-charcoal-100 lg:hidden"
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="font-display text-base font-bold text-charcoal-900 capitalize sm:text-lg">
            {activeTab === 'dashboard' ? 'Fleet Overview' : activeTab === 'cars' ? 'Car Inventory Management' : activeTab === 'inquiries' ? 'Customer Inquiries & Leads' : 'System Settings'}
          </h1>
          <p className="hidden text-xs text-charcoal-400 sm:block">
            BLR CRUIZ Centralized Fleet Control Hub
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick public site preview */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            if (window.navigateToPublic) window.navigateToPublic()
            else window.location.href = '/'
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-charcoal-900/10 bg-charcoal-50 px-3 py-2 text-xs font-semibold text-charcoal-700 hover:bg-charcoal-100 transition-colors"
          title="Open public website in main window"
        >
          <ExternalLink size={13} />
          <span className="hidden sm:inline">View Public Website</span>
        </a>

        {/* Inquiries Notification Badge */}
        <button
          onClick={() => setActiveTab('inquiries')}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-charcoal-900/10 bg-white text-charcoal-600 hover:bg-charcoal-50 transition-colors"
          title={`${newInquiriesCount} new inquiries`}
        >
          <Bell size={16} />
          {newInquiriesCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {newInquiriesCount}
            </span>
          )}
        </button>

        {/* User profile dropdown / logout */}
        <div className="flex items-center gap-2 border-l border-charcoal-900/10 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-900 text-white font-bold text-xs">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-bold text-charcoal-900">{user?.username || 'Admin'}</p>
            <p className="text-[10px] text-charcoal-400">Administrator</p>
          </div>
          <button
            onClick={logout}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-charcoal-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
