import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react'

export default function DeleteAllConfirmModal({ carsCount, onConfirm, onCancel, loading }) {
  const [confirmInput, setConfirmInput] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prev
    }
  }, [onCancel, loading])

  const isConfirmed = confirmInput.trim() === 'DELETE'

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (isConfirmed && !loading) {
      onConfirm()
    }
  }

  const modalJSX = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel()
      }}
    >
      <div
        className="w-full max-w-lg animate-scale-in rounded-3xl bg-white p-6 sm:p-7 shadow-2xl ring-1 ring-red-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-charcoal-900/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-4 ring-red-50">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-charcoal-900">
                Delete All Vehicles
              </h3>
              <p className="text-xs text-red-600 font-semibold tracking-wide uppercase">
                Destructive & Irreversible Action
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-xs sm:text-sm text-red-900 leading-relaxed space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-red-800">
              <AlertTriangle size={16} className="shrink-0 text-red-600" />
              Are you sure you want to permanently delete all vehicles?
            </p>
            <p className="text-red-700 text-xs">
              This will permanently delete{' '}
              <strong className="font-extrabold text-red-950 underline decoration-red-400">
                {carsCount} {carsCount === 1 ? 'vehicle' : 'vehicles'}
              </strong>{' '}
              from the backend database. This action <strong className="font-bold">cannot be undone</strong>.
            </p>
          </div>

          <p className="text-xs text-charcoal-600 leading-normal">
            All vehicle catalog records will be immediately purged from the database and public website. Other data such as locations and customer inquiries will not be affected.
          </p>

          {/* Safety Confirmation Input */}
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="delete-confirm-input"
              className="block text-xs font-bold text-charcoal-800"
            >
              Please type <span className="font-mono text-red-600 font-extrabold select-all">DELETE</span> to confirm:
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              autoFocus
              disabled={loading}
              className="input-field font-mono text-sm py-2.5 px-3.5 tracking-wider border-charcoal-300 focus:border-red-500 focus:ring-red-500/20"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-3 border-t border-charcoal-900/10 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-charcoal-900/15 bg-white px-5 py-2.5 text-xs font-bold text-charcoal-700 hover:bg-charcoal-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Trash2 size={14} className="shrink-0" />
              <span>{loading ? 'Deleting All Vehicles...' : 'Delete All Vehicles'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null
}
