import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DatabaseSync } from 'node:sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ----------------------------------------------------------------------------
// Persistent Storage Directory Resolution
// Supports:
// 1. Explicit DATABASE_PATH / DATA_DIR env vars (Render Persistent Disk)
// 2. Standard Render/Docker mounts (/var/data, /data)
// 3. Local server directory fallback (server/data)
// ----------------------------------------------------------------------------
function resolveDatabasePath() {
  if (process.env.DATABASE_PATH) {
    const dir = path.dirname(process.env.DATABASE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return process.env.DATABASE_PATH
  }

  const envDir = process.env.DATA_DIR || process.env.PERSISTENT_STORAGE_PATH || process.env.PERSISTENT_DATA_DIR
  if (envDir) {
    try {
      if (!fs.existsSync(envDir)) fs.mkdirSync(envDir, { recursive: true })
      return path.join(envDir, 'blrcruiz.db')
    } catch {}
  }

  // Check persistent disk mounts
  const persistentMounts = ['/var/data', '/data']
  for (const mount of persistentMounts) {
    if (fs.existsSync(mount)) {
      try {
        const testFile = path.join(mount, '.write_test')
        fs.writeFileSync(testFile, 'ok')
        fs.unlinkSync(testFile)
        return path.join(mount, 'blrcruiz.db')
      } catch {}
    }
  }

  const localDataDir = path.join(__dirname, '..', 'data')
  if (!fs.existsSync(localDataDir)) {
    try {
      fs.mkdirSync(localDataDir, { recursive: true })
    } catch {
      return path.join(__dirname, '..', 'blrcruiz.db')
    }
  }
  return path.join(localDataDir, 'blrcruiz.db')
}

const DB_FILE = resolveDatabasePath()
console.log(`[Database] Initializing SQLite Single-Source-of-Truth at: ${DB_FILE}`)

const db = new DatabaseSync(DB_FILE)

// Enable WAL mode for high concurrency and performance
try {
  db.exec('PRAGMA journal_mode = WAL;')
} catch {}

// ----------------------------------------------------------------------------
// Schema Initializations
// ----------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    category TEXT DEFAULT 'Hatchback',
    year INTEGER DEFAULT 2026,
    seats INTEGER DEFAULT 5,
    transmission TEXT DEFAULT 'Automatic',
    fuel TEXT DEFAULT 'Petrol',
    ac INTEGER DEFAULT 1,
    pricePerDay REAL DEFAULT 1500,
    rating REAL DEFAULT 4.8,
    popular INTEGER DEFAULT 0,
    available INTEGER DEFAULT 1,
    image TEXT,
    images TEXT,
    locations TEXT,
    description TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    carName TEXT,
    carId TEXT,
    pickupLocation TEXT,
    pickupDate TEXT,
    returnDate TEXT,
    days INTEGER DEFAULT 1,
    estimatedTotal TEXT,
    message TEXT,
    status TEXT DEFAULT 'New',
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    bookingId TEXT,
    status TEXT DEFAULT 'CONFIRMED',
    paymentStatus TEXT DEFAULT 'PAID',
    paymentMethod TEXT DEFAULT 'RAZORPAY',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amountPaid REAL,
    carId TEXT,
    carName TEXT,
    customerName TEXT,
    customerPhone TEXT,
    customerEmail TEXT,
    pickupDate TEXT,
    returnDate TEXT,
    pickupLocation TEXT,
    days INTEGER DEFAULT 1,
    needChauffeur INTEGER DEFAULT 0,
    specialRequests TEXT,
    createdAt TEXT,
    verifiedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    name TEXT,
    createdAt INTEGER,
    expiresAt INTEGER
  );
`)

// Helper: Format raw database row to application vehicle object
function formatVehicleRow(row) {
  if (!row) return null
  let images = []
  try {
    images = typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || [])
  } catch {
    images = row.image ? [row.image] : []
  }

  let locations = []
  try {
    locations = typeof row.locations === 'string' ? JSON.parse(row.locations) : (row.locations || [])
  } catch {
    locations = []
  }

  return {
    id: Number(row.id),
    brand: String(row.brand),
    model: String(row.model),
    category: String(row.category || 'Hatchback'),
    year: Number(row.year) || 2026,
    seats: Number(row.seats) || 5,
    transmission: String(row.transmission || 'Automatic'),
    fuel: String(row.fuel || 'Petrol'),
    ac: Boolean(row.ac),
    pricePerDay: Number(row.pricePerDay) || 1500,
    rating: Number(row.rating) || 4.8,
    popular: Boolean(row.popular),
    available: Boolean(row.available),
    image: row.image || (images.length > 0 ? images[0] : ''),
    images: Array.isArray(images) && images.length > 0 ? images : (row.image ? [row.image] : []),
    locations: Array.isArray(locations) ? locations : [],
    description: String(row.description || ''),
    createdAt: String(row.createdAt || new Date().toISOString()),
    updatedAt: String(row.updatedAt || new Date().toISOString()),
  }
}

// ----------------------------------------------------------------------------
// Database Operations API
// ----------------------------------------------------------------------------
export const appDb = {
  dbPath: DB_FILE,

  // --- VEHICLES ---
  getVehicles() {
    const rows = db.prepare('SELECT * FROM vehicles ORDER BY id ASC').all()
    return rows.map(formatVehicleRow)
  },

  getVehicleById(id) {
    const row = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(Number(id))
    return formatVehicleRow(row)
  },

  createVehicle(data) {
    const brand = String(data.brand || '').trim()
    const model = String(data.model || '').trim()
    const category = String(data.category || 'Hatchback').trim()
    const year = Number(data.year) || new Date().getFullYear()
    const seats = Number(data.seats) || 5
    const transmission = String(data.transmission || 'Automatic').trim()
    const fuel = String(data.fuel || 'Petrol').trim()
    const ac = data.ac !== undefined ? (data.ac ? 1 : 0) : 1
    const pricePerDay = Number(data.pricePerDay) || 1500
    const rating = Number(data.rating) || 4.8
    const popular = data.popular ? 1 : 0
    const available = data.available !== undefined ? (data.available ? 1 : 0) : 1

    const images = Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : [data.image || 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=800&q=80']
    const image = images[0] || (data.image || '')
    const locations = Array.isArray(data.locations) ? data.locations : []
    const description = String(data.description || '').trim()
    const now = new Date().toISOString()

    const stmt = db.prepare(`
      INSERT INTO vehicles (
        brand, model, category, year, seats, transmission, fuel, ac,
        pricePerDay, rating, popular, available, image, images, locations,
        description, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      brand, model, category, year, seats, transmission, fuel, ac,
      pricePerDay, rating, popular, available, image, JSON.stringify(images),
      JSON.stringify(locations), description, now, now
    )

    const newId = Number(result.lastInsertRowid)
    return this.getVehicleById(newId)
  },

  updateVehicle(id, data) {
    const numericId = Number(id)
    const existing = this.getVehicleById(numericId)
    if (!existing) return null

    const brand = data.brand !== undefined ? String(data.brand).trim() : existing.brand
    const model = data.model !== undefined ? String(data.model).trim() : existing.model
    const category = data.category !== undefined ? String(data.category).trim() : existing.category
    const year = data.year !== undefined ? Number(data.year) : existing.year
    const seats = data.seats !== undefined ? Number(data.seats) : existing.seats
    const transmission = data.transmission !== undefined ? String(data.transmission).trim() : existing.transmission
    const fuel = data.fuel !== undefined ? String(data.fuel).trim() : existing.fuel
    const ac = data.ac !== undefined ? (data.ac ? 1 : 0) : (existing.ac ? 1 : 0)
    const pricePerDay = data.pricePerDay !== undefined ? Number(data.pricePerDay) : existing.pricePerDay
    const rating = data.rating !== undefined ? Number(data.rating) : existing.rating
    const popular = data.popular !== undefined ? (data.popular ? 1 : 0) : (existing.popular ? 1 : 0)
    const available = data.available !== undefined ? (data.available ? 1 : 0) : (existing.available ? 1 : 0)

    const images = Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : (data.image ? [data.image] : existing.images)
    const image = images[0] || existing.image
    const locations = Array.isArray(data.locations) ? data.locations : existing.locations
    const description = data.description !== undefined ? String(data.description).trim() : existing.description
    const now = new Date().toISOString()

    const stmt = db.prepare(`
      UPDATE vehicles SET
        brand = ?, model = ?, category = ?, year = ?, seats = ?, transmission = ?,
        fuel = ?, ac = ?, pricePerDay = ?, rating = ?, popular = ?, available = ?,
        image = ?, images = ?, locations = ?, description = ?, updatedAt = ?
      WHERE id = ?
    `)

    stmt.run(
      brand, model, category, year, seats, transmission, fuel, ac,
      pricePerDay, rating, popular, available, image, JSON.stringify(images),
      JSON.stringify(locations), description, now, numericId
    )

    return this.getVehicleById(numericId)
  },

  deleteVehicle(id) {
    const numericId = Number(id)
    const existing = this.getVehicleById(numericId)
    if (!existing) return null

    db.prepare('DELETE FROM vehicles WHERE id = ?').run(numericId)
    return existing
  },

  resetVehicles() {
    db.prepare('DELETE FROM vehicles').run()
    return []
  },

  // --- INQUIRIES ---
  getInquiries() {
    const rows = db.prepare('SELECT * FROM inquiries ORDER BY createdAt DESC').all()
    return rows.map((r) => ({
      ...r,
      days: Number(r.days) || 1,
    }))
  },

  createInquiry(data) {
    const id = data.id || `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const name = String(data.name || 'Anonymous').trim()
    const phone = String(data.phone || '').trim()
    const email = String(data.email || '').trim()
    const carName = String(data.carName || data.car || 'General Inquiry').trim()
    const carId = data.carId ? String(data.carId) : null
    const pickupLocation = String(data.pickupLocation || 'Bangalore City').trim()
    const pickupDate = String(data.pickupDate || '')
    const returnDate = String(data.returnDate || '')
    const days = Number(data.days) || 1
    const estimatedTotal = String(data.estimatedTotal || '—')
    const message = String(data.message || '').trim()
    const status = String(data.status || 'New').trim()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO inquiries (
        id, name, phone, email, carName, carId, pickupLocation, pickupDate,
        returnDate, days, estimatedTotal, message, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, phone, email, carName, carId, pickupLocation, pickupDate,
      returnDate, days, estimatedTotal, message, status, now, now
    )

    return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
  },

  updateInquiry(id, data) {
    const existing = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
    if (!existing) return null

    const status = data.status !== undefined ? String(data.status).trim() : existing.status
    const message = data.message !== undefined ? String(data.message).trim() : existing.message
    const now = new Date().toISOString()

    db.prepare(`
      UPDATE inquiries SET status = ?, message = ?, updatedAt = ? WHERE id = ?
    `).run(status, message, now, id)

    return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
  },

  deleteInquiry(id) {
    const existing = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
    if (!existing) return null

    db.prepare('DELETE FROM inquiries WHERE id = ?').run(id)
    return existing
  },

  resetInquiries() {
    db.prepare('DELETE FROM inquiries').run()
    return []
  },

  // --- BOOKINGS ---
  getBookings() {
    return db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all()
  },

  createBooking(data) {
    const id = data.id || data.bookingId || `DRV-BLR-${Date.now().toString().slice(-6)}`
    const bookingId = data.bookingId || id
    const status = data.status || 'CONFIRMED'
    const paymentStatus = data.paymentStatus || 'PAID'
    const paymentMethod = data.paymentMethod || 'RAZORPAY'
    const razorpay_order_id = data.razorpay_order_id || ''
    const razorpay_payment_id = data.razorpay_payment_id || ''
    const razorpay_signature = data.razorpay_signature || ''
    const amountPaid = Number(data.amountPaid) || 0
    const carId = String(data.carId || '')
    const carName = String(data.carName || '')
    const customerName = String(data.customerName || '')
    const customerPhone = String(data.customerPhone || '')
    const customerEmail = String(data.customerEmail || '')
    const pickupDate = String(data.pickupDate || '')
    const returnDate = String(data.returnDate || '')
    const pickupLocation = String(data.pickupLocation || '')
    const days = Number(data.days) || 1
    const needChauffeur = data.needChauffeur ? 1 : 0
    const specialRequests = String(data.specialRequests || '')
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO bookings (
        id, bookingId, status, paymentStatus, paymentMethod,
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        amountPaid, carId, carName, customerName, customerPhone, customerEmail,
        pickupDate, returnDate, pickupLocation, days, needChauffeur, specialRequests,
        createdAt, verifiedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, bookingId, status, paymentStatus, paymentMethod,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      amountPaid, carId, carName, customerName, customerPhone, customerEmail,
      pickupDate, returnDate, pickupLocation, days, needChauffeur, specialRequests,
      now, now
    )

    return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id)
  },

  // --- SESSIONS ---
  getSession(token) {
    const row = db.prepare('SELECT * FROM admin_sessions WHERE token = ?').get(token)
    if (!row) return null
    if (row.expiresAt < Date.now()) {
      this.deleteSession(token)
      return null
    }
    return {
      token: row.token,
      user: {
        username: row.username,
        role: row.role,
        name: row.name,
      },
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    }
  },

  saveSession(session) {
    db.prepare(`
      INSERT OR REPLACE INTO admin_sessions (token, username, role, name, createdAt, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      session.token,
      session.user?.username || 'admin',
      session.user?.role || 'admin',
      session.user?.name || 'BLR CRUIZ Admin',
      session.createdAt || Date.now(),
      session.expiresAt || (Date.now() + 24 * 60 * 60 * 1000)
    )
  },

  deleteSession(token) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token)
  },
}

export default appDb
