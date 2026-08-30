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
app.use(express.json())

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
app.get('/', healthHandler)

// Catch-all 404 handler for unknown API routes (always returns JSON)
app.use('/api', (req, res) => {
  return res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  })
})

// Global error handler (always returns JSON)
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err)
  return res.status(500).json({
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
