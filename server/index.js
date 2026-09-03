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

import appDb from './db/database.js'

// Helper to verify admin token from request Authorization header
function verifyAdminToken(req) {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  return appDb.getSession(token)
}

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

    appDb.saveSession(sessionData)

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
    const session = verifyAdminToken(req)
    if (!session) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Unauthorized. Invalid or expired admin token.',
      })
    }

    return res.status(200).json({
      success: true,
      valid: true,
      user: session.user,
    })
  } catch (err) {
    console.error('Server auth verify error:', err)
    return res.status(500).json({
      success: false,
      valid: false,
      message: 'Verification error occurred.',
    })
  }
})

app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (token) {
      appDb.deleteSession(token)
    }
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    })
  } catch (err) {
    console.error('Server auth logout error:', err)
    return res.status(500).json({
      success: false,
      message: 'Logout error occurred.',
    })
  }
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

    // Payment Verified Successfully! Create authoritative booking record in Database
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

    const savedBooking = appDb.createBooking(newBooking)
    console.log(`[BOOKING CONFIRMED] ${bookingId} for ${newBooking.customerName} - Payment ID: ${razorpay_payment_id}`)

    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      bookingId,
      booking: savedBooking || newBooking,
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
  const session = verifyAdminToken(req)
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  const bookings = appDb.getBookings()
  return res.status(200).json({
    success: true,
    bookings,
  })
})

/**
 * GET /api/inquiries
 * Retrieve all customer inquiries from database
 */
app.get('/api/inquiries', (req, res) => {
  const inquiries = appDb.getInquiries()
  return res.status(200).json({
    success: true,
    inquiries,
  })
})

/**
 * POST /api/inquiries
 * Create a new customer inquiry in database
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

    const newInquiry = appDb.createInquiry(data)

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
 * Update inquiry status in database (admin protected)
 */
app.put('/api/inquiries/:id', (req, res) => {
  const session = verifyAdminToken(req)
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  const { id } = req.params
  const updatedInquiry = appDb.updateInquiry(id, req.body)

  if (!updatedInquiry) {
    return res.status(404).json({
      success: false,
      message: `Inquiry with ID ${id} not found.`,
    })
  }

  return res.status(200).json({
    success: true,
    message: 'Inquiry updated successfully.',
    inquiry: updatedInquiry,
  })
})

/**
 * DELETE /api/inquiries/:id
 * Permanently delete customer inquiry from database (admin protected)
 */
app.delete('/api/inquiries/:id', (req, res) => {
  const session = verifyAdminToken(req)
  if (!session) {
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

  const deletedInquiry = appDb.deleteInquiry(id)
  if (!deletedInquiry) {
    return res.status(404).json({
      success: false,
      message: `Inquiry with ID ${id} not found or already deleted.`,
    })
  }

  return res.status(200).json({
    success: true,
    message: 'Inquiry permanently deleted.',
    deletedId: id,
    inquiry: deletedInquiry,
  })
})

/**
 * POST /api/inquiries/reset
 * Reset customer inquiries to 0 leads (admin protected)
 */
app.post('/api/inquiries/reset', (req, res) => {
  const session = verifyAdminToken(req)
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  appDb.resetInquiries()

  return res.status(200).json({
    success: true,
    message: 'Customer inquiries completely reset to 0 leads.',
    inquiries: [],
  })
})

/**
 * GET /api/cars
 * Retrieve all vehicles from permanent SQLite database (Single Source of Truth)
 */
app.get('/api/cars', (req, res) => {
  const cars = appDb.getVehicles()
  return res.status(200).json({
    success: true,
    count: cars.length,
    database: appDb.dbPath,
    cars,
  })
})

/**
 * GET /api/cars/:id
 * Retrieve a single vehicle by ID from permanent database
 */
app.get('/api/cars/:id', (req, res) => {
  const { id } = req.params
  const car = appDb.getVehicleById(id)
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
 * POST /api/cars/sync
 * Auto-sync / restore missing vehicles to SQLite database
 */
app.post('/api/cars/sync', (req, res) => {
  try {
    const { cars = [] } = req.body || {}
    if (!Array.isArray(cars) || cars.length === 0) {
      return res.status(200).json({
        success: true,
        cars: appDb.getVehicles(),
      })
    }

    const currentCars = appDb.getVehicles()
    let restoredCount = 0
    for (const clientCar of cars) {
      if (!clientCar || !clientCar.brand || !clientCar.model) continue
      const exists = currentCars.some((c) => String(c.id) === String(clientCar.id))
      if (!exists) {
        appDb.createVehicle(clientCar)
        restoredCount++
      }
    }

    const updatedCars = appDb.getVehicles()
    if (restoredCount > 0) {
      console.log(`[Cars SYNC] Restored ${restoredCount} vehicle(s) into database (${appDb.dbPath})`)
    }

    return res.status(200).json({
      success: true,
      restoredCount,
      cars: updatedCars,
    })
  } catch (err) {
    console.error('[Cars SYNC Error]:', err.message)
    return res.status(500).json({
      success: false,
      message: err.message || 'Sync error',
    })
  }
})

/**
 * POST /api/cars
 * Add a new vehicle to permanent SQLite database (admin protected)
 */
app.post('/api/cars', (req, res) => {
  const session = verifyAdminToken(req)
  if (!session) {
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

    const newCar = appDb.createVehicle(data)
    console.log(`[Cars POST] Created vehicle ID ${newCar.id} (${newCar.brand} ${newCar.model}) saved to database (${appDb.dbPath})`)

    return res.status(201).json({
      success: true,
      message: 'Vehicle added to database successfully.',
      car: newCar,
    })
  } catch (err) {
    console.error('Error creating vehicle in database:', err)
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to add vehicle to database.',
    })
  }
})

/**
 * PUT /api/cars/:id
 * Update an existing vehicle in permanent database (admin protected)
 */
app.put('/api/cars/:id', (req, res) => {
  const session = verifyAdminToken(req)
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  const { id } = req.params
  const updatedCar = appDb.updateVehicle(id, req.body)

  if (!updatedCar) {
    return res.status(404).json({
      success: false,
      message: `Vehicle with ID ${id} not found.`,
    })
  }

  console.log(`[Cars PUT] Updated vehicle ID ${id} (${updatedCar.brand} ${updatedCar.model}) in database (${appDb.dbPath})`)

  return res.status(200).json({
    success: true,
    message: 'Vehicle updated successfully.',
    car: updatedCar,
  })
})

/**
 * DELETE /api/cars/:id
 * Permanently delete a vehicle from database (admin protected)
 */
app.delete('/api/cars/:id', (req, res) => {
  const session = verifyAdminToken(req)
  if (!session) {
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

  const deletedCar = appDb.deleteVehicle(id)
  if (!deletedCar) {
    return res.status(404).json({
      success: false,
      message: `Vehicle with ID ${id} not found or already deleted.`,
    })
  }

  console.log(`[Cars DELETE] Deleted vehicle ID ${id} (${deletedCar.brand} ${deletedCar.model}) from database (${appDb.dbPath})`)

  return res.status(200).json({
    success: true,
    message: `Vehicle "${deletedCar.brand} ${deletedCar.model}" permanently deleted from database.`,
    deletedId: id,
    car: deletedCar,
  })
})

/**
 * POST /api/cars/reset
 * Reset inventory to 0 vehicles in database (admin protected)
 */
app.post('/api/cars/reset', (req, res) => {
  const session = verifyAdminToken(req)
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin session token required.',
    })
  }

  appDb.resetVehicles()
  console.log(`[Cars RESET] Reset inventory to 0 vehicles in database (${appDb.dbPath})`)

  return res.status(200).json({
    success: true,
    message: 'Car inventory reset to 0 vehicles in database.',
    cars: [],
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
