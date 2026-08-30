import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, MessageCircle, Phone, Mail, MapPin, Calendar, Car, Clock, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { createWhatsAppLink, createCallLink } from '../../utils/whatsapp.js'
import { formatDate } from '../../utils/pricing.js'

const STATUSES = ['New', 'Contacted', 'Confirmed', 'Cancelled']

export default function InquiryDetailsModal({ inquiry, onClose, onUpdateStatus, onDelete }) {
  const [status, setStatus] = useState(inquiry.status || 'New')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus)
    setUpdating(true)
    await onUpdateStatus(inquiry.id, newStatus)
    setUpdating(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      if (typeof onDelete === 'function') {
        await onDelete(inquiry)
      }
      onClose()
    } catch {
      setDeleting(false)
    }
  }

  // Pre-filled WhatsApp reply message
  const replyMessage = `Hello ${inquiry.name}, thank you for inquiring with BLR CRUIZ for the ${inquiry.carName}. We have received your booking request for ${inquiry.pickupDate ? formatDate(inquiry.pickupDate) : 'your selected dates'}. I am reaching out to confirm your booking details.`

  const modalJSX = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl ring-1 ring-charcoal-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-charcoal-900/10 bg-charcoal-50/60 px-5 sm:px-6 py-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Customer Inquiry</span>
            <h3 className="font-display text-base sm:text-lg font-bold text-charcoal-900">{inquiry.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-charcoal-50 p-3.5 gap-2">
            <span className="text-xs font-bold text-charcoal-700">Inquiry Status:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  disabled={updating}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    status === s
                      ? s === 'Confirmed'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : s === 'Cancelled'
                        ? 'bg-red-600 text-white shadow-sm'
                        : s === 'Contacted'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-accent-500 text-white shadow-sm'
                      : 'bg-white text-charcoal-600 hover:bg-charcoal-100 border border-charcoal-900/10'
                  }`}
                >
                  {status === s && <CheckCircle2 size={11} className="inline mr-1" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Customer Contacts</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={createCallLink(inquiry.phone)}
                className="flex items-center gap-2.5 rounded-xl border border-charcoal-900/10 bg-white p-3 hover:border-accent-500 transition-colors"
              >
                <Phone size={16} className="text-accent-500" />
                <div>
                  <p className="text-[10px] text-charcoal-400">Phone</p>
                  <p className="text-xs font-bold text-charcoal-900">{inquiry.phone}</p>
                </div>
              </a>

              {inquiry.email ? (
                <a
                  href={`mailto:${inquiry.email}`}
                  className="flex items-center gap-2.5 rounded-xl border border-charcoal-900/10 bg-white p-3 hover:border-accent-500 transition-colors"
                >
                  <Mail size={16} className="text-accent-500" />
                  <div>
                    <p className="text-[10px] text-charcoal-400">Email</p>
                    <p className="text-xs font-bold text-charcoal-900 truncate">{inquiry.email}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-charcoal-900/10 bg-charcoal-50/50 p-3 opacity-60">
                  <Mail size={16} className="text-charcoal-400" />
                  <div>
                    <p className="text-[10px] text-charcoal-400">Email</p>
                    <p className="text-xs text-charcoal-500">Not provided</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Request Details */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Rental Requirements</h4>
            <div className="rounded-2xl border border-charcoal-900/10 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car size={16} className="text-accent-500" />
                  <span className="text-xs font-bold text-charcoal-900">{inquiry.carName}</span>
                </div>
                {inquiry.estimatedTotal && (
                  <span className="font-display text-sm font-extrabold text-accent-600">
                    {inquiry.estimatedTotal}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-charcoal-900/5 text-xs text-charcoal-600">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-charcoal-400" />
                  <span>
                    {inquiry.pickupDate ? formatDate(inquiry.pickupDate) : 'Not specified'} →{' '}
                    {inquiry.returnDate ? formatDate(inquiry.returnDate) : 'Open'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-charcoal-400" />
                  <span className="truncate">{inquiry.pickupLocation || 'Bangalore'}</span>
                </div>
              </div>

              {inquiry.message && (
                <div className="pt-2 border-t border-charcoal-900/5">
                  <p className="text-[10px] text-charcoal-400 font-bold uppercase">Customer Note:</p>
                  <p className="text-xs text-charcoal-700 mt-0.5 bg-charcoal-50 p-2.5 rounded-xl italic">
                    "{inquiry.message}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-charcoal-900/10 bg-charcoal-50/60 px-5 sm:px-6 py-3.5">
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin text-red-500" />
            ) : (
              <Trash2 size={14} />
            )}
            <span>{deleting ? 'Deleting...' : 'Delete Inquiry'}</span>
          </button>

          <a
            href={createWhatsAppLink(replyMessage, inquiry.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp text-xs !py-2 !px-4"
          >
            <MessageCircle size={15} />
            <span>Reply via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null
}
