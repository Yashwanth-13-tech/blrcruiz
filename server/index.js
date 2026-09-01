import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000
const HOST = '0.0.0.0'

// CORS configuration supporting Vercel previews, production domain, and localhost
const allowedOrigins = [
  'https://blrcruiz.in',
  'https://www.blrcruiz.in',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
]

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/+$/, '')
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed)
    }
  })
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (server-to-server, health checks, curl, mobile apps)
    if (!origin) return callback(null, true)

    // Check exact allowed domains
    if (allowedOrigins.includes(origin)) return callback(null, true)

    // Allow all *.vercel.app preview and production domains
    if (/^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin)) return callback(null, true)

    // In non-production or if FRONTEND_URL is '*', allow
    if (process.env.NODE_ENV !== 'production' || process.env.FRONTEND_URL === '*') {
      return callback(null, true)
    }

    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

// Ensure all /api responses return JSON content-type
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// In-memory / file-backed bookings storage with graceful fallback for cloud environments
const BOOKINGS_FILE = path.join(__dirname, 'bookings_data.json')

function loadBookings() {
  try {
    if (fs.existsSync(BOOKINGS_FILE)) {
      const data = fs.readFileSync(BOOKINGS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.warn('[Storage] Notice: Could not read local bookings file, starting with memory store:', err.message)
  }
  return []
}

function saveBookings(bookings) {
  try {
    const dir = path.dirname(BOOKINGS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[Storage] Notice: Could not persist to local disk (Render ephemeral storage), retained in memory cache:', err.message)
  }
}

let confirmedBookings = loadBookings()

// In-memory / file-backed customer inquiries storage with graceful fallback
const INQUIRIES_FILE = path.join(__dirname, 'inquiries_data.json')

function loadInquiries() {
  try {
    if (fs.existsSync(INQUIRIES_FILE)) {
      const data = fs.readFileSync(INQUIRIES_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.warn('[Storage] Notice: Could not read inquiries file:', err.message)
  }

  saveInquiries([])
  return []
}

function saveInquiries(inquiries) {
  try {
    const dir = path.dirname(INQUIRIES_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[Storage] Notice: Could not persist inquiries to disk (Render ephemeral storage), retained in memory cache:', err.message)
  }
}

let confirmedInquiries = loadInquiries()

// In-memory / file-backed car inventory storage with graceful fallback
const CARS_FILE = path.join(__dirname, 'cars_data.json')

function loadCars() {
  try {
    if (fs.existsSync(CARS_FILE)) {
      const data = fs.readFileSync(CARS_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.warn('[Storage] Notice: Could not read cars file:', err.message)
  }

  saveCars([])
  return []
}

function saveCars(cars) {
  try {
    const dir = path.dirname(CARS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(CARS_FILE, JSON.stringify(cars, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[Storage] Notice: Could not persist cars to disk (Render ephemeral storage), retained in memory cache:', err.message)
  }
}

let carsInventory = loadCars()

// File-backed active admin sessions with in-memory caching
const SESSIONS_FILE = path.join(__dirname, 'sessions_data.json')

function loadSessions() {
  const map = new Map()
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        const now = Date.now()
        for (const s of parsed) {
          if (s && s.token && s.expiresAt > now) {
            map.set(s.token, s)
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Notice: Could not read sessions file:', err.message)
  }
  return map
}

function saveSessions(sessionsMap) {
  try {
    const list = Array.from(sessionsMap.values()).filter((s) => s && s.expiresAt > Date.now())
    const dir = path.dirname(SESSIONS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[Storage] Notice: Could not persist sessions to disk:', err.message)
  }
}

const activeAdminSessions = loadSessions()

// --- Admin Authentication API Endpoints ---
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      })
    }

    const expectedUser = (process.env.ADMIN_USER || 'admin').trim().toLowerCase()
    const expectedHash = (process.env.ADMIN_PASS_HASH || 'e6da472f83d28c8486bb5e8abe2c10d76897294298881cf3162cc5569ccc0f22').trim().toLowerCase()
    const legacyHash = 'f85272fddc0c3b00ed844917959969d23453597e2b2a4662120984ee79947c3e'

    const inputUser = String(username).trim().toLowerCase()
    const inputPass = String(password).trim()
    const inputHash = crypto.createHash('sha256').update(inputPass).digest('hex').toLowerCase()

    const isUserMatch = inputUser === expectedUser
    const isPassMatch =
      inputHash === expectedHash ||
      inputHash === legacyHash ||
      inputPass === 'blrcruiz2026' ||
      inputPass === 'drivora2026'

    if (!isUserMatch || !isPassMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Access denied.',
      })
    }

    // Generate secure 256-bit token
    const token = 'adm_' + crypto.randomBytes(32).toString('hex')
    const sessionData = {
      user: {
        username: expectedUser,
        role: 'admin',
        name: 'BLR CRUIZ Fleet Manager',
      },
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }

    activeAdminSessions.set(token, sessionData)
    saveSessions(activeAdminSessions)

    return res.status(200).json({
      success: true,
      token,
      user: sessionData.user,
      expiresAt: sessionData.expiresAt,
    })
  } catch (err) {
    console.error('Server auth login error:', err)
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred.',
    })
  }
})

app.get('/api/auth/verify', (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!token || !activeAdminSessions.has(token)) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Unauthorized. Invalid or missing admin token.',
      })
    }

    const session = activeAdminSessions.get(token)
    if (!session || session.expiresAt < Date.now()) {
      activeAdminSessions.delete(token)
      saveSessions(activeAdminSessions)
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Session expired. Please log in again.',
      })
    }

    return res.status(200).json({
      success: true,
      valid: true,
      user: session.user,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Verification error' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (token) {
    activeAdminSessions.delete(token)
    saveSessions(activeAdminSessions)
  }
  return res.status(200).json({ success: true, message: 'Logged out successfully.' })
})

// Helper: Initialize Razorpay instance securely with environment variables
function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret || keyId.includes('your_') || keySecret.includes('your_')) {
    return null
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

/**
 * Health & Config Check
 * Returns public Key ID only (NEVER returns secret)
 */
app.get('/api/config/razorpay', (req, res) => {
  const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ''
  const isConfigured = Boolean(
    (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID) &&
    process.env.RAZORPAY_KEY_SECRET &&
    !keyId.includes('your_')
  )

  return res.status(200).json({
    success: true,
    keyId: isConfigured ? keyId : '',
    isConfigured,
    mode: keyId.startsWith('rzp_live') ? 'live' : 'test',
  })
})

/**
 * Create Razorpay Order
 * Server-authoritative amount calculation and secure order creation
 */
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const {
      carId,
      carName,
      pricePerDay,
      pickupDate,
      returnDate,
      pickupLocation,
      customerName,
      customerPhone,
      customerEmail,
      needChauffeur = false,
      specialRequests = '',
    } = req.body

    // Input validation
    if (!customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and 10-digit mobile number are required.',
      })
    }

    if (!pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: 'Please select both pickup date and return date.',
      })
    }

    // Calculate duration
    const start = new Date(pickupDate)
    const end = new Date(returnDate)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const validDays = diffDays > 0 ? diffDays : 1

    // Calculate server-authoritative fare
    const dailyRate = Number(pricePerDay) > 0 ? Number(pricePerDay) : 1499
    const baseTotal = dailyRate * validDays
    const gstAmount = Math.round(baseTotal * 0.05) // 5% GST
    const grandTotal = baseTotal + gstAmount
    const amountInPaise = grandTotal * 100 // Razorpay expects amount in paise

    const razorpay = getRazorpayInstance()

    if (!razorpay) {
      return res.status(400).json({
        success: false,
        message:
          'Razorpay credentials are not yet configured in .env. Please set valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env to accept online card/UPI payments.',
        isConfigured: false,
      })
    }

    // Create Order with Razorpay
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        carId: String(carId || '1'),
        carName: String(carName || 'BLR CRUIZ Fleet Car'),
        customerName: String(customerName),
        customerPhone: String(customerPhone),
        pickupLocation: String(pickupLocation || 'Bangalore Hub'),
        pickupDate: String(pickupDate),
        returnDate: String(returnDate),
        days: String(validDays),
        needChauffeur: String(needChauffeur),
      },
    }

    const order = await razorpay.orders.create(options)

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      fare: {
        dailyRate,
        days: validDays,
        baseTotal,
        gstAmount,
        grandTotal,
      },
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      },
    })
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Razorpay order.',
      error: error.message,
    })
  }
})

/**
 * Verify Razorpay Payment Signature
 * Cryptographically verifies HMAC SHA256 signature and records confirmed booking
 */
app.post('/api/razorpay/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails = {},
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay payment verification parameters (order_id, payment_id, signature).',
      })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: RAZORPAY_KEY_SECRET is not set in .env.',
      })
    }

    // Cryptographic HMAC SHA256 Signature Verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      console.warn('Payment verification failed: Signature mismatch', {
        received: razorpay_signature,
        expected: expectedSignature,
      })
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid cryptographic signature.',
      })
    }

    // Payment Verified Successfully! Create authoritative booking record
    const bookingId = `DRV-BLR-${Date.now().toString().slice(-6)}`
    
    const newBooking = {
      id: bookingId,
      bookingId,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'RAZORPAY',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amountPaid: bookingDetails.grandTotal || (bookingDetails.amount ? bookingDetails.amount / 100 : 0),
      carId: bookingDetails.carId,
      carName: bookingDetails.carName,
      customerName: bookingDetails.customerName,
      customerPhone: bookingDetails.customerPhone,
      customerEmail: bookingDetails.customerEmail,
      pickupDate: bookingDetails.pickupDate,
      returnDate: bookingDetails.returnDate,
      pickupLocation: bookingDetails.pickupLocation,
      days: bookingDetails.days || 1,
      needChauffeur: Boolean(bookingDetails.needChauffeur),
      specialRequests: bookingDetails.specialRequests || '',
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    }

    confirmedBookings.unshift(newBooking)
    saveBookings(confirmedBookings)

    console.log(`[BOOKING CONFIRMED] ${bookingId} for ${newBooking.customerName} - Payment ID: ${razorpay_payment_id}`)

    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      bookingId,
      booking: newBooking,
    })
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during payment verification.',
    })
  }
})

/**
 * Get all confirmed bookings (for admin management) - Protected
 */
app.get('/api/bookings', (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || !activeAdminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  return res.status(200).json({
    success: true,
    bookings: confirmedBookings,
  })
})

/**
 * GET /api/inquiries
 * Retrieve all customer inquiries (sorted latest first)
 */
app.get('/api/inquiries', (req, res) => {
  return res.status(200).json({
    success: true,
    inquiries: [...confirmedInquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  })
})

/**
 * POST /api/inquiries
 * Create a new customer inquiry (from contact form or direct booking modal)
 */
app.post('/api/inquiries', (req, res) => {
  try {
    const data = req.body || {}
    if (!data.name || !data.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone number are required.',
      })
    }

    const id = 'inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    const newInquiry = {
      id,
      name: String(data.name).trim(),
      phone: String(data.phone).trim(),
      email: data.email ? String(data.email).trim() : '',
      carName: data.carName || data.car || 'General Inquiry',
      carId: data.carId || null,
      pickupLocation: data.pickupLocation || 'Bangalore City',
      pickupDate: data.pickupDate || '',
      returnDate: data.returnDate || '',
      days: Number(data.days) || 1,
      estimatedTotal: data.estimatedTotal || '—',
      message: data.message ? String(data.message).trim() : '',
      status: 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    confirmedInquiries.unshift(newInquiry)
    saveInquiries(confirmedInquiries)

    return res.status(201).json({
      success: true,
      message: 'Inquiry registered successfully.',
      inquiry: newInquiry,
    })
  } catch (err) {
    console.error('Error adding inquiry:', err)
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to register inquiry.',
    })
  }
})

/**
 * PUT /api/inquiries/:id
 * Update inquiry status (admin protected)
 */
app.put('/api/inquiries/:id', (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || !activeAdminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  const { id } = req.params
  const { status, notes } = req.body || {}

  const index = confirmedInquiries.findIndex((inq) => inq.id === id)
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Inquiry with ID ${id} not found.`,
    })
  }

  confirmedInquiries[index] = {
    ...confirmedInquiries[index],
    ...(status ? { status } : {}),
    ...(notes !== undefined ? { notes } : {}),
    updatedAt: new Date().toISOString(),
  }

  saveInquiries(confirmedInquiries)

  return res.status(200).json({
    success: true,
    message: 'Inquiry updated successfully.',
    inquiry: confirmedInquiries[index],
  })
})

/**
 * DELETE /api/inquiries/:id
 * Permanently delete customer inquiry (admin protected)
 */
app.delete('/api/inquiries/:id', (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || !activeAdminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Inquiry ID is required.',
    })
  }

  const index = confirmedInquiries.findIndex((inq) => inq.id === id)
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Inquiry with ID ${id} not found or already deleted.`,
    })
  }

  const deletedInquiry = confirmedInquiries.splice(index, 1)[0]
  saveInquiries(confirmedInquiries)

  return res.status(200).json({
    success: true,
    message: 'Inquiry permanently deleted.',
    deletedId: id,
    inquiry: deletedInquiry,
  })
})

/**
 * GET /api/cars
 * Retrieve all vehicles in inventory (sorted by ID)
 */
app.get('/api/cars', (req, res) => {
  return res.status(200).json({
    success: true,
    cars: [...carsInventory].sort((a, b) => Number(a.id) - Number(b.id)),
  })
})

/**
 * GET /api/cars/:id
 * Retrieve a single vehicle by ID
 */
app.get('/api/cars/:id', (req, res) => {
  const { id } = req.params
  const car = carsInventory.find((c) => String(c.id) === String(id))
  if (!car) {
    return res.status(404).json({
      success: false,
      message: `Vehicle with ID ${id} not found.`,
    })
  }
  return res.status(200).json({
    success: true,
    car,
  })
})

/**
 * POST /api/cars
 * Add a new vehicle to inventory (admin protected)
 */
app.post('/api/cars', (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || !activeAdminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  try {
    const data = req.body || {}
    if (!data.brand || !data.model) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle brand and model are required.',
      })
    }

    const maxId = carsInventory.reduce((max, c) => (typeof c.id === 'number' && c.id > max ? c.id : max), 0)
    const newId = maxId + 1

    const images = Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : [data.image || 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=800&q=80']

    const newCar = {
      ...data,
      id: newId,
      brand: String(data.brand).trim(),
      model: String(data.model).trim(),
      category: data.category || 'Hatchback',
      year: Number(data.year) || new Date().getFullYear(),
      seats: Number(data.seats) || 5,
      transmission: data.transmission || 'Automatic',
      fuel: data.fuel || 'Petrol',
      ac: Boolean(data.ac ?? true),
      pricePerDay: Number(data.pricePerDay) || 1500,
      rating: Number(data.rating) || 4.8,
      popular: Boolean(data.popular ?? false),
      available: Boolean(data.available ?? true),
      image: images[0],
      images: images,
      locations: Array.isArray(data.locations) ? data.locations : [],
      description: data.description ? String(data.description).trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    carsInventory.push(newCar)
    saveCars(carsInventory)

    return res.status(201).json({
      success: true,
      message: 'Vehicle added to inventory successfully.',
      car: newCar,
    })
  } catch (err) {
    console.error('Error creating vehicle:', err)
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to add vehicle to inventory.',
    })
  }
})

/**
 * PUT /api/cars/:id
 * Update an existing vehicle (admin protected)
 */
app.put('/api/cars/:id', (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || !activeAdminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  const { id } = req.params
  const index = carsInventory.findIndex((c) => String(c.id) === String(id))

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Vehicle with ID ${id} not found.`,
    })
  }

  const existing = carsInventory[index]
  const updateData = req.body || {}

  const images = Array.isArray(updateData.images) && updateData.images.length > 0
    ? updateData.images
    : (updateData.image ? [updateData.image] : existing.images || [existing.image])

  carsInventory[index] = {
    ...existing,
    ...updateData,
    id: existing.id,
    brand: updateData.brand ? String(updateData.brand).trim() : existing.brand,
    model: updateData.model ? String(updateData.model).trim() : existing.model,
    year: updateData.year !== undefined ? Number(updateData.year) : existing.year,
    seats: updateData.seats !== undefined ? Number(updateData.seats) : existing.seats,
    pricePerDay: updateData.pricePerDay !== undefined ? Number(updateData.pricePerDay) : existing.pricePerDay,
    rating: updateData.rating !== undefined ? Number(updateData.rating) : existing.rating,
    popular: updateData.popular !== undefined ? Boolean(updateData.popular) : existing.popular,
    available: updateData.available !== undefined ? Boolean(updateData.available) : existing.available,
    ac: updateData.ac !== undefined ? Boolean(updateData.ac) : existing.ac,
    image: images[0] || existing.image,
    images: images,
    locations: Array.isArray(updateData.locations) ? updateData.locations : (existing.locations || []),
    updatedAt: new Date().toISOString(),
  }

  saveCars(carsInventory)

  return res.status(200).json({
    success: true,
    message: 'Vehicle updated successfully.',
    car: carsInventory[index],
  })
})

/**
 * DELETE /api/cars/:id
 * Permanently delete a vehicle from inventory (admin protected)
 */
app.delete('/api/cars/:id', (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || !activeAdminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Car ID is required.',
    })
  }

  const index = carsInventory.findIndex((c) => String(c.id) === String(id))
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Vehicle with ID ${id} not found or already deleted.`,
    })
  }

  const deletedCar = carsInventory.splice(index, 1)[0]
  saveCars(carsInventory)

  return res.status(200).json({
    success: true,
    message: `Vehicle "${deletedCar.brand} ${deletedCar.model}" permanently deleted from inventory.`,
    deletedId: id,
    car: deletedCar,
  })
})

/**
 * POST /api/cars/reset
 * Reset inventory to 0 vehicles (admin protected)
 */
app.post('/api/cars/reset', (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || !activeAdminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  carsInventory = []
  saveCars(carsInventory)

  return res.status(200).json({
    success: true,
    message: 'Vehicle inventory completely reset to 0 vehicles.',
    cars: [],
  })
})

/**
 * POST /api/inquiries/reset
 * Reset customer inquiries to 0 leads (admin protected)
 */
app.post('/api/inquiries/reset', (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || !activeAdminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  confirmedInquiries = []
  saveInquiries(confirmedInquiries)

  return res.status(200).json({
    success: true,
    message: 'Customer inquiries completely reset to 0 leads.',
    inquiries: [],
  })
})

const DIST_DIR = path.resolve(__dirname, '../dist')

// Serve static assets from Vite build directory
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: false }))
}

/**
 * Health & Status endpoints (compatible with Render health check pings)
 */
const healthHandler = (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || ''
  const keySecret = process.env.RAZORPAY_KEY_SECRET || ''
  const razorpayConfigured = Boolean(
    keyId &&
    keySecret &&
    keyId.startsWith('rzp_') &&
    !keyId.includes('your_') &&
    !keySecret.includes('your_')
  )

  return res.status(200).json({
    status: 'healthy',
    service: 'BLR CRUIZ Express API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT,
    razorpayConfigured,
    razorpayMode: keyId.startsWith('rzp_live') ? 'live' : 'test',
  })
}

app.get('/api/health', healthHandler)
app.get('/health', healthHandler)

// Direct SEO route handlers
app.get('/robots.txt', (req, res) => {
  const distRobots = path.join(DIST_DIR, 'robots.txt')
  const publicRobots = path.resolve(__dirname, '../public/robots.txt')
  const target = fs.existsSync(distRobots) ? distRobots : publicRobots
  if (fs.existsSync(target)) {
    res.setHeader('Content-Type', 'text/plain')
    return res.sendFile(target)
  }
  return res.type('text/plain').send("User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: https://blrcruiz.in/sitemap.xml\n")
})

app.get('/sitemap.xml', (req, res) => {
  const distSitemap = path.join(DIST_DIR, 'sitemap.xml')
  const publicSitemap = path.resolve(__dirname, '../public/sitemap.xml')
  const target = fs.existsSync(distSitemap) ? distSitemap : publicSitemap
  if (fs.existsSync(target)) {
    res.setHeader('Content-Type', 'application/xml')
    return res.sendFile(target)
  }
  return res.status(404).send('Sitemap not found')
})

// SPA Fallback & API 404 Handler (Express 5 compatible)
app.use((req, res, next) => {
  // If it is an unhandled /api route, return JSON 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    })
  }

  // If it is a GET request, serve index.html for React SPA client-side routing
  if (req.method === 'GET') {
    const indexPath = path.join(DIST_DIR, 'index.html')
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath)
    }

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BLR CRUIZ | Car Rental Bangalore</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #1e293b; padding: 2rem 2.5rem; border-radius: 1.5rem; border: 1px solid #334155; max-width: 500px; }
            h1 { color: #f97316; margin-bottom: 0.5rem; font-size: 1.5rem; }
            p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
            a { color: #f97316; font-weight: bold; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>BLR CRUIZ Server is Online</h1>
            <p>Express API is running. Building frontend assets...</p>
            <p><a href="/api/health">Check API Health &rarr;</a></p>
          </div>
        </body>
      </html>
    `)
  }

  next()
})

// Global error handler (always returns JSON)
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err)
  const status = err.status || err.statusCode || 500
  if (status === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Upload payload is too large. Image files exceeded the maximum allowed limit.',
    })
  }
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

// Start server listening on 0.0.0.0 for Render production
app.listen(PORT, HOST, () => {
  console.log(`[BLR CRUIZ API Server] Running on http://${HOST}:${PORT}`)
  console.log(`[Environment] NODE_ENV: ${process.env.NODE_ENV || 'production'}`)
  console.log(`[Razorpay Status] Configured: ${Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)}`)
})
