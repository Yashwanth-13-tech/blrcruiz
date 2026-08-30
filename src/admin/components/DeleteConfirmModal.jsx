import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'

export default function DeleteConfirmModal({ title, message, onConfirm, onCancel, loading }) {
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

  const modalJSX = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel()
      }}
    >
      <div
        className="w-full max-w-md animate-scale-in rounded-2xl sm:rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-charcoal-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-900/10">
          <div className="flex items-center gap-2.5 text-red-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-display text-base sm:text-lg font-bold text-charcoal-900">{title || 'Confirm Deletion'}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-charcoal-600 leading-relaxed">
          {message || 'Are you sure you want to permanently delete this item? This action cannot be undone.'}
        </p>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-charcoal-900/15 bg-white px-4 py-2.5 text-xs font-bold text-charcoal-700 hover:bg-charcoal-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null
}
