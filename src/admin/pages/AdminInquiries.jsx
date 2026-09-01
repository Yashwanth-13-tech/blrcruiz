import React, { useState, useMemo, useEffect } from 'react'
import {
  MessageSquare,
  Search,
  Phone,
  Mail,
  Calendar,
  Car,
  Clock,
  Trash2,
  Eye,
  MessageCircle,
} from 'lucide-react'
import { useCars } from '../../context/CarContext.jsx'
import { formatDate } from '../../utils/pricing.js'
import { createCallLink } from '../../utils/whatsapp.js'
import InquiryDetailsModal from '../components/InquiryDetailsModal.jsx'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const STATUS_TABS = ['All', 'New', 'Contacted', 'Confirmed', 'Cancelled']

export default function AdminInquiries() {
  const { inquiries, updateInquiryStatus, deleteInquiry, refreshData } = useCars()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (typeof refreshData === 'function') {
      refreshData()
    }
  }, [refreshData])

  const handleDeleteInquiry = async (inq) => {
    const confirmDelete = window.confirm(
      `Permanently delete customer inquiry from "${inq.name}" (${inq.phone})?\n\nThis will remove the lead permanently from backend storage.`
    )
    if (!confirmDelete) return

    setDeletingId(inq.id)
    setNotification(null)

    try {
      const res = await deleteInquiry(inq.id)
      if (res && res.success === false) {
        throw new Error(res.error || 'Failed to delete inquiry from server.')
      }
      setNotification({
        type: 'success',
        message: `Inquiry from ${inq.name} permanently deleted.`,
      })
      if (selectedInquiry?.id === inq.id) {
        setSelectedInquiry(null)
      }
      setTimeout(() => setNotification(null), 4000)
    } catch (err) {
      console.error('Delete inquiry error:', err)
      setNotification({
        type: 'error',
        message: err.message || 'Could not delete inquiry. Please try again.',
      })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchStatus = statusFilter === 'All' || inq.status === statusFilter
      const q = query.trim().toLowerCase()
      const matchQuery =
        !q ||
        inq.name.toLowerCase().includes(q) ||
        inq.phone.toLowerCase().includes(q) ||
        inq.carName.toLowerCase().includes(q) ||
        inq.pickupLocation.toLowerCase().includes(q) ||
        (inq.email && inq.email.toLowerCase().includes(q))
      return matchStatus && matchQuery
    })
  }, [inquiries, query, statusFilter])

  const newCount = inquiries.filter((i) => i.status === 'New').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-charcoal-900">
            Customer Inquiries &amp; Leads ({inquiries.length})
          </h2>
          <p className="text-xs text-charcoal-500">
            Track and respond to customer booking requests and messages in real-time.
          </p>
        </div>

        {newCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-accent-50 border border-accent-200 px-4 py-2 text-xs font-bold text-accent-700">
            <span className="h-2 w-2 rounded-full bg-accent-500 animate-ping" />
            <span>{newCount} New Uncontacted Lead{newCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-semibold animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-charcoal-900/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer name, phone, vehicle, location..."
              className="input-field pl-10 text-xs py-2.5"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((status) => {
              const count = status === 'All' ? inquiries.length : inquiries.filter((i) => i.status === status).length
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-accent-500 text-white shadow-sm'
                      : 'bg-charcoal-100 text-charcoal-700 hover:bg-charcoal-200'
                  }`}
                >
                  {status} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      {filteredInquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-charcoal-900/10 bg-white py-16 text-center shadow-sm">
          <MessageSquare size={40} className="text-charcoal-300 mb-3" />
          <h3 className="font-display text-base font-bold text-charcoal-900">No inquiries found</h3>
          <p className="text-xs text-charcoal-500 mt-1 max-w-sm">
            Customer booking requests and contact inquiries will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-charcoal-900/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-charcoal-900/10 bg-charcoal-50/70 text-[11px] font-bold uppercase tracking-wider text-charcoal-500">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Vehicle &amp; Dates</th>
                  <th className="px-4 py-3.5">Pickup Location</th>
                  <th className="px-4 py-3.5">Est. Rate</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Received</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-900/5 font-medium text-charcoal-700">
                {filteredInquiries.map((inq) => {
                  const replyMessage = `Hello ${inq.name}, thank you for contacting BLR CRUIZ regarding the ${inq.carName}. I am reaching out to confirm your booking.`
                  return (
                    <tr
                      key={inq.id}
                      className="hover:bg-charcoal-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedInquiry(inq)}
                    >
                      {/* Customer Name & Phone */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-display text-sm font-bold text-charcoal-900">{inq.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-charcoal-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone size={11} className="text-accent-500" /> {inq.phone}
                            </span>
                            {inq.email && (
                              <span className="hidden sm:flex items-center gap-1 truncate max-w-[120px]">
                                • {inq.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Vehicle & Dates */}
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-charcoal-900">{inq.carName}</p>
                          <p className="text-[11px] text-charcoal-500">
                            {inq.pickupDate ? `${formatDate(inq.pickupDate)} (${inq.days}d)` : 'Dates pending'}
                          </p>
                        </div>
                      </td>

                      {/* Pickup Location */}
                      <td className="px-4 py-4 text-charcoal-800">
                        <span className="truncate max-w-[150px] block">
                          {inq.pickupLocation}
                        </span>
                      </td>

                      {/* Estimated Rate */}
                      <td className="px-4 py-4 font-display font-extrabold text-charcoal-900">
                        {inq.estimatedTotal || '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={inq.status}
                          onChange={(e) => updateInquiryStatus(inq.id, e.target.value)}
                          className={`rounded-lg px-2 py-1 text-[11px] font-bold border ${
                            inq.status === 'New'
                              ? 'bg-accent-50 border-accent-200 text-accent-700'
                              : inq.status === 'Confirmed'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : inq.status === 'Cancelled'
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Received Date */}
                      <td className="px-4 py-4 text-[11px] text-charcoal-400">
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {inq.phone && (
                            <a
                              href={`https://wa.me/91${inq.phone.replace(/\D/g, '')}?text=${encodeURIComponent(replyMessage)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedInquiry(inq)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal-900/10 text-charcoal-600 hover:bg-charcoal-100 transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === inq.id}
                            onClick={() => handleDeleteInquiry(inq)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal-900/10 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                            title="Delete Lead"
                          >
                            {deletingId === inq.id ? (
                              <Loader2 size={14} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedInquiry && (
        <InquiryDetailsModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onUpdateStatus={updateInquiryStatus}
          onDelete={handleDeleteInquiry}
        />
      )}
    </div>
  )
}
