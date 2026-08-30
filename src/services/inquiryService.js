import {
  initDB,
  getAllFromStore,
  getByIdFromStore,
  putInStore,
  deleteFromStore,
} from './db.js'

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
   */
  async getInquiries() {
    await ensureDB()
    const inquiries = await getAllFromStore('inquiries')
    return inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  /**
   * Add a new inquiry from booking modal or contact form
   */
  async addInquiry(data) {
    await ensureDB()
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
      days: data.days || 1,
      estimatedTotal: data.estimatedTotal || '—',
      message: data.message?.trim() || '',
      status: 'New', // New | Contacted | Confirmed | Cancelled
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
   * Delete an inquiry
   */
  async deleteInquiry(id) {
    await ensureDB()
    await deleteFromStore('inquiries', id)
    return true
  },
}

export default inquiryService
