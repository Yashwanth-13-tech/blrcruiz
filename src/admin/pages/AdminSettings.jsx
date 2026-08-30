import React, { useState } from 'react'
import {
  Settings,
  Lock,
  Building,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  Save,
  Key,
} from 'lucide-react'
import { business } from '../../config/business.js'
import { authService } from '../../services/authService.js'
import { useCars } from '../../context/CarContext.jsx'

export default function AdminSettings() {
  const { resetCars, cars } = useCars()

  // Password state
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passStatus, setPassStatus] = useState(null) // { type: 'success' | 'error', msg: string }
  const [passLoading, setPassLoading] = useState(false)

  // Reset inventory state
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPassStatus(null)

    if (newPass !== confirmPass) {
      setPassStatus({ type: 'error', msg: 'New password and confirmation do not match.' })
      return
    }

    if (newPass.length < 6) {
      setPassStatus({ type: 'error', msg: 'New password must be at least 6 characters.' })
      return
    }

    setPassLoading(true)
    try {
      await authService.updatePassword(currentPass, newPass)
      setPassStatus({ type: 'success', msg: 'Password successfully updated! Use this new password for your next login.' })
      setCurrentPass('')
      setNewPass('')
      setConfirmPass('')
    } catch (err) {
      setPassStatus({ type: 'error', msg: err.message || 'Failed to update password.' })
    } finally {
      setPassLoading(false)
    }
  }

  const handleResetFleet = async () => {
    if (window.confirm('Reset car inventory to the original default 12 vehicles? Any custom cars added will be replaced.')) {
      setResetting(true)
      const res = await resetCars()
      setResetting(false)
      if (res.success) {
        setResetSuccess(true)
        setTimeout(() => setResetSuccess(false), 4000)
      }
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-charcoal-900">
          Admin Settings &amp; System Tools
        </h2>
        <p className="text-xs text-charcoal-500">
          Manage system access, business configurations, and database tools.
        </p>
      </div>

      {/* Card 1: Change Admin Password */}
      <div className="rounded-3xl border border-charcoal-900/10 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-3 pb-4 border-b border-charcoal-900/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-charcoal-900">Admin Security &amp; Password</h3>
            <p className="text-xs text-charcoal-400">Update the administrative master login password</p>
          </div>
        </div>

        {passStatus && (
          <div
            className={`mt-5 flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold ${
              passStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {passStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{passStatus.msg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="mt-5 space-y-4 max-w-lg">
          <div>
            <label className="label-field" htmlFor="s-curpass">Current Password</label>
            <input
              id="s-curpass"
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="Enter current password"
              className="input-field text-xs py-2.5"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field" htmlFor="s-newpass">New Password</label>
              <input
                id="s-newpass"
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="At least 6 characters"
                className="input-field text-xs py-2.5"
                required
              />
            </div>
            <div>
              <label className="label-field" htmlFor="s-confpass">Confirm New Password</label>
              <input
                id="s-confpass"
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repeat new password"
                className="input-field text-xs py-2.5"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passLoading}
            className="btn-accent text-xs !py-2.5 !px-5"
          >
            <Key size={14} />
            {passLoading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </div>

      {/* Card 2: Business Profile Reference */}
      <div className="rounded-3xl border border-charcoal-900/10 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-3 pb-4 border-b border-charcoal-900/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-charcoal-900">Business Profile Reference</h3>
            <p className="text-xs text-charcoal-400">Current business values configured in `src/config/business.js`</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-charcoal-50 p-3.5">
            <span className="font-bold uppercase tracking-wider text-charcoal-400 text-[10px] block">Company Name</span>
            <span className="font-semibold text-charcoal-900 text-sm mt-0.5 block">{business.name}</span>
          </div>

          <div className="rounded-xl bg-charcoal-50 p-3.5">
            <span className="font-bold uppercase tracking-wider text-charcoal-400 text-[10px] block">Phone / Tel</span>
            <span className="font-semibold text-charcoal-900 text-sm mt-0.5 block">{business.phone}</span>
          </div>

          <div className="rounded-xl bg-charcoal-50 p-3.5">
            <span className="font-bold uppercase tracking-wider text-charcoal-400 text-[10px] block">WhatsApp Number</span>
            <span className="font-semibold text-charcoal-900 text-sm mt-0.5 block">+{business.whatsapp}</span>
          </div>

          <div className="rounded-xl bg-charcoal-50 p-3.5">
            <span className="font-bold uppercase tracking-wider text-charcoal-400 text-[10px] block">Email Address</span>
            <span className="font-semibold text-charcoal-900 text-sm mt-0.5 block">{business.email}</span>
          </div>

          <div className="rounded-xl bg-charcoal-50 p-3.5 sm:col-span-2">
            <span className="font-bold uppercase tracking-wider text-charcoal-400 text-[10px] block">Operating Location</span>
            <span className="font-semibold text-charcoal-900 text-sm mt-0.5 block">{business.address} ({business.hours.days} • {business.hours.time})</span>
          </div>
        </div>
      </div>

      {/* Card 3: Centralized Database & Seeding Tools */}
      <div className="rounded-3xl border border-charcoal-900/10 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-3 pb-4 border-b border-charcoal-900/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Database size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-charcoal-900">Database &amp; Fleet Storage Engine</h3>
            <p className="text-xs text-charcoal-400">IndexedDB persistent storage with cloud database adapter</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-charcoal-50 p-4 text-xs text-charcoal-600 space-y-2">
            <p>
              • <strong>Active Storage Engine:</strong> Native Persistent IndexedDB (<code className="bg-white px-1.5 py-0.5 rounded text-charcoal-800">drivora_db</code>)
            </p>
            <p>
              • <strong>Inventory Count:</strong> {cars.length} cars persistently stored.
            </p>
            <p>
              • <strong>Cloud Ready:</strong> To connect a live Supabase or REST backend, define <code className="bg-white px-1.5 py-0.5 rounded text-charcoal-800">VITE_SUPABASE_URL</code> and <code className="bg-white px-1.5 py-0.5 rounded text-charcoal-800">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-white px-1.5 py-0.5 rounded text-charcoal-800">.env</code>.
            </p>
          </div>

          {resetSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={16} />
              <span>Fleet successfully reset to default 12 cars!</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-charcoal-900">Reset Fleet to Defaults</p>
              <p className="text-[11px] text-charcoal-500">Restores the 12 original cars from catalog.</p>
            </div>
            <button
              type="button"
              onClick={handleResetFleet}
              disabled={resetting}
              className="rounded-xl border border-charcoal-900/15 bg-white px-4 py-2 text-xs font-bold text-charcoal-700 hover:bg-charcoal-50 flex items-center gap-1.5"
            >
              <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
              {resetting ? 'Resetting...' : 'Reset to Default Cars'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
