import {
  initDB,
  getAllFromStore,
  getByIdFromStore,
  putInStore,
  deleteFromStore,
} from './db.js'
import { apiUrl } from '../config/api.js'
import { authService } from './authService.js'

let isInitialized = false

async function ensureDB() {
  if (!isInitialized) {
    await initDB()
    isInitialized = true
  }
}

export const inquiryService = {
  /**
   * Get all inquiries, sorted by latest first
   * Connects to backend API and synchronizes with IndexedDB
   */
  async getInquiries() {
    await ensureDB()

    // 1. Try fetching live inquiries from backend API
    try {
      const res = await fetch(apiUrl('/api/inquiries'))
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.inquiries)) {
          // Sync with local IndexedDB cache
          for (const inq of data.inquiries) {
            await putInStore('inquiries', inq)
          }
          return data.inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        }
      }
    } catch (err) {
      console.warn('[InquiryService] Network notice: Using cached inquiries:', err.message)
    }

    // 2. Fallback to local store
    const localInquiries = await getAllFromStore('inquiries')
    return localInquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  /**
   * Add a new inquiry from booking modal or contact form
   */
  async addInquiry(data) {
    await ensureDB()

    // 1. Try sending to backend server
    try {
      const res = await fetch(apiUrl('/api/inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.inquiry) {
          await putInStore('inquiries', result.inquiry)
          return result.inquiry
        }
      }
    } catch (err) {
      console.warn('[InquiryService] Server submission failed, saving locally:', err.message)
    }

    // 2. Fallback local generation
    const id = 'inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    const newInquiry = {
      id,
      name: data.name?.trim() || 'Anonymous',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      carName: data.carName || data.car || 'General Inquiry',
      carId: data.carId || null,
      pickupLocation: data.pickupLocation || 'Bangalore City',
      pickupDate: data.pickupDate || '',
      returnDate: data.returnDate || '',
      days: Number(data.days) || 1,
      estimatedTotal: data.estimatedTotal || '—',
      message: data.message?.trim() || '',
      status: 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await putInStore('inquiries', newInquiry)
    return newInquiry
  },

  /**
   * Update inquiry status or notes
   */
  async updateInquiryStatus(id, status) {
    await ensureDB()
    const token = authService.getToken()

    // 1. Try updating on backend
    try {
      const res = await fetch(apiUrl(`/api/inquiries/${encodeURIComponent(id)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.inquiry) {
          await putInStore('inquiries', result.inquiry)
          return result.inquiry
        }
      }
    } catch (err) {
      console.warn('[InquiryService] Server update notice:', err.message)
    }

    // 2. Fallback local store update
    const existing = await getByIdFromStore('inquiries', id)
    if (!existing) throw new Error('Inquiry not found')

    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    }
    await putInStore('inquiries', updated)
    return updated
  },

  /**
   * Permanently delete an inquiry from backend and local cache
   */
  async deleteInquiry(id) {
    await ensureDB()
    const token = authService.getToken()

    // 1. Send DELETE request to backend server
    let serverSuccess = false
    try {
      const res = await fetch(apiUrl(`/api/inquiries/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        let errMessage = `Server returned HTTP ${res.status}`
        try {
          const errData = await res.json()
          if (errData.message) errMessage = errData.message
        } catch {
          // ignore json parse error
        }
        if (res.status === 401) {
          throw new Error('Unauthorized. Please log in again to delete inquiries.')
        }
        if (res.status !== 404) {
          throw new Error(errMessage)
        }
      } else {
        serverSuccess = true
      }
    } catch (err) {
      // Re-throw authentication or server rejection errors
      if (err.message?.includes('Unauthorized') || err.message?.includes('Access denied')) {
        throw err
      }
      console.warn('[InquiryService] Server delete notice:', err.message)
    }

    // 2. Permanently remove from local IndexedDB cache
    await deleteFromStore('inquiries', id)
    return true
  },
}

export default inquiryService
