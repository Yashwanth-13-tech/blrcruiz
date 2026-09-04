import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DatabaseSync } from 'node:sqlite'
import pg from 'pg'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ----------------------------------------------------------------------------
// Database Engine Detection
// If DATABASE_URL / POSTGRES_URL / PGURI is provided -> use PostgreSQL
// Otherwise -> use SQLite with persistent directory resolution
// ----------------------------------------------------------------------------
const POSTGRES_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PGURI

let pgPool = null
let sqliteDb = null
let activeEngine = 'sqlite'

if (POSTGRES_URL) {
  activeEngine = 'postgres'
  console.log('[Database] Connecting to PostgreSQL (Single Source of Truth)...')
  pgPool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: POSTGRES_URL.includes('localhost') || POSTGRES_URL.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
} else {
  activeEngine = 'sqlite'
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

    // Check standard Render persistent disk mount paths
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
  sqliteDb = new DatabaseSync(DB_FILE)
  try {
    sqliteDb.exec('PRAGMA journal_mode = WAL;')
  } catch {}
}

// ----------------------------------------------------------------------------
// Schema Initializations
// ----------------------------------------------------------------------------
async function initSchema() {
  if (activeEngine === 'postgres') {
    const client = await pgPool.connect()
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id SERIAL PRIMARY KEY,
          brand VARCHAR(255) NOT NULL,
          model VARCHAR(255) NOT NULL,
          category VARCHAR(100) DEFAULT 'Hatchback',
          year INTEGER DEFAULT 2026,
          seats INTEGER DEFAULT 5,
          transmission VARCHAR(100) DEFAULT 'Automatic',
          fuel VARCHAR(100) DEFAULT 'Petrol',
          ac BOOLEAN DEFAULT true,
          price_per_day NUMERIC(10,2) DEFAULT 1500,
          rating NUMERIC(3,2) DEFAULT 4.8,
          popular BOOLEAN DEFAULT false,
          available BOOLEAN DEFAULT true,
          image TEXT,
          images JSONB DEFAULT '[]'::jsonb,
          locations JSONB DEFAULT '[]'::jsonb,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inquiries (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(100) NOT NULL,
          email VARCHAR(255),
          car_name VARCHAR(255),
          car_id VARCHAR(255),
          pickup_location VARCHAR(255),
          pickup_date VARCHAR(100),
          return_date VARCHAR(100),
          days INTEGER DEFAULT 1,
          estimated_total VARCHAR(100),
          message TEXT,
          status VARCHAR(100) DEFAULT 'New',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
          id VARCHAR(255) PRIMARY KEY,
          booking_id VARCHAR(255),
          status VARCHAR(100) DEFAULT 'CONFIRMED',
          payment_status VARCHAR(100) DEFAULT 'PAID',
          payment_method VARCHAR(100) DEFAULT 'RAZORPAY',
          razorpay_order_id VARCHAR(255),
          razorpay_payment_id VARCHAR(255),
          razorpay_signature VARCHAR(255),
          amount_paid NUMERIC(10,2),
          car_id VARCHAR(255),
          car_name VARCHAR(255),
          customer_name VARCHAR(255),
          customer_phone VARCHAR(100),
          customer_email VARCHAR(255),
          pickup_date VARCHAR(100),
          return_date VARCHAR(100),
          pickup_location VARCHAR(255),
          days INTEGER DEFAULT 1,
          need_chauffeur BOOLEAN DEFAULT false,
          special_requests TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_sessions (
          token VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          role VARCHAR(100) DEFAULT 'admin',
          name VARCHAR(255),
          created_at BIGINT,
          expires_at BIGINT
        );
      `)
      console.log('[Database] PostgreSQL schema verified successfully.')
    } finally {
      client.release()
    }
  } else {
    sqliteDb.exec(`
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
    console.log('[Database] SQLite schema verified successfully.')
  }
}

// Initialize schema on load
initSchema().catch((err) => {
  console.error('[Database] Schema initialization error:', err)
})

// Helper: Format raw PostgreSQL row to application vehicle object
function formatPgVehicleRow(row) {
  if (!row) return null
  const images = Array.isArray(row.images) ? row.images : []
  const locations = Array.isArray(row.locations) ? row.locations : []
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
    pricePerDay: Number(row.price_per_day) || 1500,
    rating: Number(row.rating) || 4.8,
    popular: Boolean(row.popular),
    available: Boolean(row.available),
    image: row.image || (images.length > 0 ? images[0] : ''),
    images: images.length > 0 ? images : (row.image ? [row.image] : []),
    locations,
    description: String(row.description || ''),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  }
}

// Helper: Format raw SQLite row to application vehicle object
function formatSqliteVehicleRow(row) {
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
// Database Operations API (Async Universal Interface)
// ----------------------------------------------------------------------------
export const appDb = {
  engine: activeEngine,

  // --- VEHICLES ---
  async getVehicles() {
    if (activeEngine === 'postgres') {
      const res = await pgPool.query('SELECT * FROM vehicles ORDER BY id ASC')
      return res.rows.map(formatPgVehicleRow)
    }
    const rows = sqliteDb.prepare('SELECT * FROM vehicles ORDER BY id ASC').all()
    return rows.map(formatSqliteVehicleRow)
  },

  async getVehicleById(id) {
    const numericId = Number(id)
    if (activeEngine === 'postgres') {
      const res = await pgPool.query('SELECT * FROM vehicles WHERE id = $1', [numericId])
      return formatPgVehicleRow(res.rows[0])
    }
    const row = sqliteDb.prepare('SELECT * FROM vehicles WHERE id = ?').get(numericId)
    return formatSqliteVehicleRow(row)
  },

  async createVehicle(data) {
    const brand = String(data.brand || '').trim()
    const model = String(data.model || '').trim()
    const category = String(data.category || 'Hatchback').trim()
    const year = Number(data.year) || new Date().getFullYear()
    const seats = Number(data.seats) || 5
    const transmission = String(data.transmission || 'Automatic').trim()
    const fuel = String(data.fuel || 'Petrol').trim()
    const ac = data.ac !== undefined ? Boolean(data.ac) : true
    const pricePerDay = Number(data.pricePerDay) || 1500
    const rating = Number(data.rating) || 4.8
    const popular = Boolean(data.popular)
    const available = data.available !== undefined ? Boolean(data.available) : true

    const images = Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : [data.image || 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=800&q=80']
    const image = images[0] || (data.image || '')
    const locations = Array.isArray(data.locations) ? data.locations : []
    const description = String(data.description || '').trim()
    const now = new Date().toISOString()

    if (activeEngine === 'postgres') {
      const query = `
        INSERT INTO vehicles (
          brand, model, category, year, seats, transmission, fuel, ac,
          price_per_day, rating, popular, available, image, images, locations,
          description, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *;
      `
      const res = await pgPool.query(query, [
        brand, model, category, year, seats, transmission, fuel, ac,
        pricePerDay, rating, popular, available, image, JSON.stringify(images),
        JSON.stringify(locations), description, now, now,
      ])
      return formatPgVehicleRow(res.rows[0])
    }

    const stmt = sqliteDb.prepare(`
      INSERT INTO vehicles (
        brand, model, category, year, seats, transmission, fuel, ac,
        pricePerDay, rating, popular, available, image, images, locations,
        description, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      brand, model, category, year, seats, transmission, fuel, ac ? 1 : 0,
      pricePerDay, rating, popular ? 1 : 0, available ? 1 : 0, image, JSON.stringify(images),
      JSON.stringify(locations), description, now, now
    )

    const newId = Number(result.lastInsertRowid)
    return await this.getVehicleById(newId)
  },

  async updateVehicle(id, data) {
    const numericId = Number(id)
    const existing = await this.getVehicleById(numericId)
    if (!existing) return null

    const brand = data.brand !== undefined ? String(data.brand).trim() : existing.brand
    const model = data.model !== undefined ? String(data.model).trim() : existing.model
    const category = data.category !== undefined ? String(data.category).trim() : existing.category
    const year = data.year !== undefined ? Number(data.year) : existing.year
    const seats = data.seats !== undefined ? Number(data.seats) : existing.seats
    const transmission = data.transmission !== undefined ? String(data.transmission).trim() : existing.transmission
    const fuel = data.fuel !== undefined ? String(data.fuel).trim() : existing.fuel
    const ac = data.ac !== undefined ? Boolean(data.ac) : existing.ac
    const pricePerDay = data.pricePerDay !== undefined ? Number(data.pricePerDay) : existing.pricePerDay
    const rating = data.rating !== undefined ? Number(data.rating) : existing.rating
    const popular = data.popular !== undefined ? Boolean(data.popular) : existing.popular
    const available = data.available !== undefined ? Boolean(data.available) : existing.available

    const images = Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : (data.image ? [data.image] : existing.images)
    const image = images[0] || existing.image
    const locations = Array.isArray(data.locations) ? data.locations : existing.locations
    const description = data.description !== undefined ? String(data.description).trim() : existing.description
    const now = new Date().toISOString()

    if (activeEngine === 'postgres') {
      const query = `
        UPDATE vehicles SET
          brand = $1, model = $2, category = $3, year = $4, seats = $5, transmission = $6,
          fuel = $7, ac = $8, price_per_day = $9, rating = $10, popular = $11, available = $12,
          image = $13, images = $14, locations = $15, description = $16, updated_at = $17
        WHERE id = $18
        RETURNING *;
      `
      const res = await pgPool.query(query, [
        brand, model, category, year, seats, transmission, fuel, ac,
        pricePerDay, rating, popular, available, image, JSON.stringify(images),
        JSON.stringify(locations), description, now, numericId,
      ])
      return formatPgVehicleRow(res.rows[0])
    }

    const stmt = sqliteDb.prepare(`
      UPDATE vehicles SET
        brand = ?, model = ?, category = ?, year = ?, seats = ?, transmission = ?,
        fuel = ?, ac = ?, pricePerDay = ?, rating = ?, popular = ?, available = ?,
        image = ?, images = ?, locations = ?, description = ?, updatedAt = ?
      WHERE id = ?
    `)

    stmt.run(
      brand, model, category, year, seats, transmission, fuel, ac ? 1 : 0,
      pricePerDay, rating, popular ? 1 : 0, available ? 1 : 0, image, JSON.stringify(images),
      JSON.stringify(locations), description, now, numericId
    )

    return await this.getVehicleById(numericId)
  },

  async deleteVehicle(id) {
    const numericId = Number(id)
    const existing = await this.getVehicleById(numericId)
    if (!existing) return null

    if (activeEngine === 'postgres') {
      await pgPool.query('DELETE FROM vehicles WHERE id = $1', [numericId])
    } else {
      sqliteDb.prepare('DELETE FROM vehicles WHERE id = ?').run(numericId)
    }
    return existing
  },

  async resetVehicles() {
    if (activeEngine === 'postgres') {
      await pgPool.query('DELETE FROM vehicles')
    } else {
      sqliteDb.prepare('DELETE FROM vehicles').run()
    }
    return []
  },

  // --- INQUIRIES ---
  async getInquiries() {
    if (activeEngine === 'postgres') {
      const res = await pgPool.query('SELECT * FROM inquiries ORDER BY created_at DESC')
      return res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email || '',
        carName: r.car_name || '',
        carId: r.car_id || null,
        pickupLocation: r.pickup_location || '',
        pickupDate: r.pickup_date || '',
        returnDate: r.return_date || '',
        days: Number(r.days) || 1,
        estimatedTotal: r.estimated_total || '—',
        message: r.message || '',
        status: r.status || 'New',
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }))
    }
    const rows = sqliteDb.prepare('SELECT * FROM inquiries ORDER BY createdAt DESC').all()
    return rows.map((r) => ({
      ...r,
      days: Number(r.days) || 1,
    }))
  },

  async createInquiry(data) {
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

    if (activeEngine === 'postgres') {
      const query = `
        INSERT INTO inquiries (
          id, name, phone, email, car_name, car_id, pickup_location, pickup_date,
          return_date, days, estimated_total, message, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *;
      `
      const res = await pgPool.query(query, [
        id, name, phone, email, carName, carId, pickupLocation, pickupDate,
        returnDate, days, estimatedTotal, message, status, now, now,
      ])
      const r = res.rows[0]
      return {
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email || '',
        carName: r.car_name || '',
        carId: r.car_id || null,
        pickupLocation: r.pickup_location || '',
        pickupDate: r.pickup_date || '',
        returnDate: r.return_date || '',
        days: Number(r.days) || 1,
        estimatedTotal: r.estimated_total || '—',
        message: r.message || '',
        status: r.status || 'New',
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : now,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : now,
      }
    }

    sqliteDb.prepare(`
      INSERT INTO inquiries (
        id, name, phone, email, carName, carId, pickupLocation, pickupDate,
        returnDate, days, estimatedTotal, message, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, phone, email, carName, carId, pickupLocation, pickupDate,
      returnDate, days, estimatedTotal, message, status, now, now
    )

    return sqliteDb.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
  },

  async updateInquiry(id, data) {
    const now = new Date().toISOString()
    if (activeEngine === 'postgres') {
      const existingRes = await pgPool.query('SELECT * FROM inquiries WHERE id = $1', [id])
      if (existingRes.rows.length === 0) return null
      const existing = existingRes.rows[0]
      const status = data.status !== undefined ? String(data.status).trim() : existing.status
      const message = data.message !== undefined ? String(data.message).trim() : existing.message

      const res = await pgPool.query(
        'UPDATE inquiries SET status = $1, message = $2, updated_at = $3 WHERE id = $4 RETURNING *;',
        [status, message, now, id]
      )
      const r = res.rows[0]
      return {
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        status: r.status,
        message: r.message,
        updatedAt: new Date(r.updated_at).toISOString(),
      }
    }

    const existing = sqliteDb.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
    if (!existing) return null

    const status = data.status !== undefined ? String(data.status).trim() : existing.status
    const message = data.message !== undefined ? String(data.message).trim() : existing.message

    sqliteDb.prepare(`
      UPDATE inquiries SET status = ?, message = ?, updatedAt = ? WHERE id = ?
    `).run(status, message, now, id)

    return sqliteDb.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
  },

  async deleteInquiry(id) {
    if (activeEngine === 'postgres') {
      const res = await pgPool.query('DELETE FROM inquiries WHERE id = $1 RETURNING *;', [id])
      return res.rows[0] || null
    }
    const existing = sqliteDb.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
    if (!existing) return null
    sqliteDb.prepare('DELETE FROM inquiries WHERE id = ?').run(id)
    return existing
  },

  async resetInquiries() {
    if (activeEngine === 'postgres') {
      await pgPool.query('DELETE FROM inquiries')
    } else {
      sqliteDb.prepare('DELETE FROM inquiries').run()
    }
    return []
  },

  // --- BOOKINGS ---
  async getBookings() {
    if (activeEngine === 'postgres') {
      const res = await pgPool.query('SELECT * FROM bookings ORDER BY created_at DESC')
      return res.rows
    }
    return sqliteDb.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all()
  },

  async createBooking(data) {
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
    const needChauffeur = Boolean(data.needChauffeur)
    const specialRequests = String(data.specialRequests || '')
    const now = new Date().toISOString()

    if (activeEngine === 'postgres') {
      const query = `
        INSERT INTO bookings (
          id, booking_id, status, payment_status, payment_method,
          razorpay_order_id, razorpay_payment_id, razorpay_signature,
          amount_paid, car_id, car_name, customer_name, customer_phone, customer_email,
          pickup_date, return_date, pickup_location, days, need_chauffeur, special_requests,
          created_at, verified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING *;
      `
      const res = await pgPool.query(query, [
        id, bookingId, status, paymentStatus, paymentMethod,
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        amountPaid, carId, carName, customerName, customerPhone, customerEmail,
        pickupDate, returnDate, pickupLocation, days, needChauffeur, specialRequests,
        now, now,
      ])
      return res.rows[0]
    }

    sqliteDb.prepare(`
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
      pickupDate, returnDate, pickupLocation, days, needChauffeur ? 1 : 0, specialRequests,
      now, now
    )

    return sqliteDb.prepare('SELECT * FROM bookings WHERE id = ?').get(id)
  },

  // --- SESSIONS ---
  async getSession(token) {
    if (activeEngine === 'postgres') {
      const res = await pgPool.query('SELECT * FROM admin_sessions WHERE token = $1', [token])
      if (res.rows.length === 0) return null
      const row = res.rows[0]
      if (Number(row.expires_at) < Date.now()) {
        await this.deleteSession(token)
        return null
      }
      return {
        token: row.token,
        user: {
          username: row.username,
          role: row.role,
          name: row.name,
        },
        createdAt: Number(row.created_at),
        expiresAt: Number(row.expires_at),
      }
    }

    const row = sqliteDb.prepare('SELECT * FROM admin_sessions WHERE token = ?').get(token)
    if (!row) return null
    if (row.expiresAt < Date.now()) {
      await this.deleteSession(token)
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

  async saveSession(session) {
    const username = session.user?.username || 'admin'
    const role = session.user?.role || 'admin'
    const name = session.user?.name || 'BLR CRUIZ Admin'
    const createdAt = session.createdAt || Date.now()
    const expiresAt = session.expiresAt || (Date.now() + 24 * 60 * 60 * 1000)

    if (activeEngine === 'postgres') {
      await pgPool.query(`
        INSERT INTO admin_sessions (token, username, role, name, created_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (token) DO UPDATE SET
          username = EXCLUDED.username,
          role = EXCLUDED.role,
          name = EXCLUDED.name,
          expires_at = EXCLUDED.expires_at;
      `, [session.token, username, role, name, createdAt, expiresAt])
      return
    }

    sqliteDb.prepare(`
      INSERT OR REPLACE INTO admin_sessions (token, username, role, name, createdAt, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(session.token, username, role, name, createdAt, expiresAt)
  },

  async deleteSession(token) {
    if (activeEngine === 'postgres') {
      await pgPool.query('DELETE FROM admin_sessions WHERE token = $1', [token])
    } else {
      sqliteDb.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token)
    }
  },
}

export default appDb
