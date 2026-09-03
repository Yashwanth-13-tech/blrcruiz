import dotenv from 'dotenv'
import crypto from 'crypto'
import Razorpay from 'razorpay'

function parseRequestBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function getEnvCredentials() {
  // Dynamically re-read .env if changed
  dotenv.config()

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || ''
  const keySecret = process.env.RAZORPAY_KEY_SECRET || ''

  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    keyId.startsWith('rzp_') &&
    !keyId.includes('your_') &&
    !keySecret.includes('your_')
  )

  return { keyId, keySecret, isConfigured }
}

// In-memory active authenticated admin sessions store
const activeAdminSessions = new Map()

export function razorpayApiPlugin() {
  return {
    name: 'drivora-razorpay-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''

        // --- Admin Authentication API Endpoints ---
        if (url === '/api/auth/login' && req.method === 'POST') {
          try {
            const body = await parseRequestBody(req)
            const { username, password } = body

            if (!username || !password) {
              return sendJson(res, 400, {
                success: false,
                message: 'Username and password are required.',
              })
            }

            dotenv.config()
            const expectedUser = (process.env.ADMIN_USER || 'admin').trim().toLowerCase()
            const expectedHash = (process.env.ADMIN_PASS_HASH || 'e6da472f83d28c8486bb5e8abe2c10d76897294298881cf3162cc5569ccc0f22').trim().toLowerCase() // blrcruiz2026
            const legacyHash = 'f85272fddc0c3b00ed844917959969d23453597e2b2a4662120984ee79947c3e' // drivora2026

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
              return sendJson(res, 401, {
                success: false,
                message: 'Invalid credentials. Access denied.',
              })
            }

            // Generate secure 256-bit cryptographically random token
            const token = 'adm_' + crypto.randomBytes(32).toString('hex')
            const sessionData = {
              user: {
                username: expectedUser,
                role: 'admin',
                name: 'BLR CRUIZ Fleet Manager',
              },
              token,
              createdAt: Date.now(),
              expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            }

            activeAdminSessions.set(token, sessionData)

            return sendJson(res, 200, {
              success: true,
              token,
              user: sessionData.user,
              expiresAt: sessionData.expiresAt,
            })
          } catch (err) {
            console.error('Server auth login error:', err)
            return sendJson(res, 500, {
              success: false,
              message: 'Authentication error occurred.',
            })
          }
        }

        if (url === '/api/auth/verify' && (req.method === 'GET' || req.method === 'POST')) {
          try {
            const authHeader = req.headers['authorization'] || ''
            const token = authHeader.replace(/^Bearer\s+/i, '').trim()

            if (!token || !activeAdminSessions.has(token)) {
              return sendJson(res, 401, {
                success: false,
                valid: false,
                message: 'Unauthorized. Invalid or missing admin token.',
              })
            }

            const session = activeAdminSessions.get(token)
            if (!session || session.expiresAt < Date.now()) {
              activeAdminSessions.delete(token)
              return sendJson(res, 401, {
                success: false,
                valid: false,
                message: 'Session expired. Please log in again.',
              })
            }

            return sendJson(res, 200, {
              success: true,
              valid: true,
              user: session.user,
            })
          } catch (err) {
            return sendJson(res, 500, { success: false, message: 'Verification error' })
          }
        }

        if (url === '/api/auth/logout' && req.method === 'POST') {
          const authHeader = req.headers['authorization'] || ''
          const token = authHeader.replace(/^Bearer\s+/i, '').trim()
          if (token) {
            activeAdminSessions.delete(token)
          }
          return sendJson(res, 200, { success: true, message: 'Logged out successfully.' })
        }

        // 1. GET /api/config/razorpay
        if (url === '/api/config/razorpay' && req.method === 'GET') {
          const { keyId, isConfigured } = getEnvCredentials()

          return sendJson(res, 200, {
            success: true,
            keyId: isConfigured ? keyId : (keyId.startsWith('rzp_') && !keyId.includes('your_') ? keyId : ''),
            isConfigured,
            mode: keyId.startsWith('rzp_live') ? 'live' : 'test',
          })
        }

        // 2. GET /api/health
        if (url === '/api/health' && req.method === 'GET') {
          const { isConfigured } = getEnvCredentials()
          return sendJson(res, 200, {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            razorpayConfigured: isConfigured,
          })
        }

        // 3. POST /api/razorpay/create-order
        if (url === '/api/razorpay/create-order' && req.method === 'POST') {
          try {
            const body = await parseRequestBody(req)
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
            } = body

            if (!customerName || !customerPhone) {
              return sendJson(res, 400, {
                success: false,
                message: 'Full name and mobile number are required.',
              })
            }

            if (!pickupDate || !returnDate) {
              return sendJson(res, 400, {
                success: false,
                message: 'Please specify both pickup and return dates.',
              })
            }

            // Calculate duration
            const start = new Date(pickupDate + 'T00:00:00')
            const end = new Date(returnDate + 'T00:00:00')
            const diffTime = end.getTime() - start.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            const validDays = diffDays > 0 ? diffDays : 1

            // Price calculation
            const rawPrice = String(pricePerDay || '').replace(/[^0-9.]/g, '')
            const dailyRate = Number(rawPrice) > 0 ? Number(rawPrice) : 1499
            const baseTotal = dailyRate * validDays
            const gstAmount = Math.round(baseTotal * 0.05)
            const grandTotal = baseTotal + gstAmount
            const amountInPaise = Math.round(grandTotal * 100)

            const { keyId, keySecret, isConfigured } = getEnvCredentials()

            if (!isConfigured) {
              return sendJson(res, 400, {
                success: false,
                message:
                  'Razorpay credentials are not yet configured in your .env file. Please create a .env file with RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable online payments.',
                isConfigured: false,
              })
            }

            // Create Order with official Razorpay SDK
            const razorpay = new Razorpay({
              key_id: keyId,
              key_secret: keySecret,
            })

            const order = await razorpay.orders.create({
              amount: amountInPaise,
              currency: 'INR',
              receipt: `rcpt_${Date.now().toString().slice(-8)}`,
              notes: {
                carId: String(carId || '1'),
                carName: String(carName || 'BLR CRUIZ Car'),
                customerName: String(customerName),
                customerPhone: String(customerPhone),
                pickupLocation: String(pickupLocation),
                pickupDate: String(pickupDate),
                returnDate: String(returnDate),
                days: String(validDays),
                needChauffeur: String(needChauffeur),
              },
            })

            return sendJson(res, 200, {
              success: true,
              orderId: order.id,
              amount: order.amount,
              currency: order.currency,
              keyId: keyId,
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
          } catch (err) {
            console.error('[Razorpay Order Creation Error]:', err.message)
            return sendJson(res, 500, {
              success: false,
              message: err.message || 'Failed to create Razorpay order.',
            })
          }
        }

        // 4. POST /api/razorpay/verify-payment
        if (url === '/api/razorpay/verify-payment' && req.method === 'POST') {
          try {
            const body = await parseRequestBody(req)
            const {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              bookingDetails = {},
            } = body

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
              return sendJson(res, 400, {
                success: false,
                message: 'Missing Razorpay verification parameters (order_id, payment_id, signature).',
              })
            }

            const { keySecret } = getEnvCredentials()

            if (!keySecret) {
              return sendJson(res, 500, {
                success: false,
                message: 'Server configuration error: RAZORPAY_KEY_SECRET is not set.',
              })
            }

            // Cryptographic HMAC SHA256 Signature Verification
            const expectedSignature = crypto
              .createHmac('sha256', keySecret)
              .update(`${razorpay_order_id}|${razorpay_payment_id}`)
              .digest('hex')

            if (expectedSignature !== razorpay_signature) {
              return sendJson(res, 400, {
                success: false,
                message: 'Cryptographic payment verification failed. Invalid signature.',
              })
            }

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

            return sendJson(res, 200, {
              success: true,
              message: 'Payment verified and booking confirmed successfully.',
              bookingId,
              booking: newBooking,
            })
          } catch (err) {
            return sendJson(res, 500, {
              success: false,
              message: err.message || 'Payment verification error.',
            })
          }
        }

        // --- Cars Inventory API Endpoints for Dev Server ---
        const fs = await import('fs')
        const path = await import('path')
        const CARS_FILE = path.join(process.cwd(), 'server', 'cars_data.json')

        function loadDevCars() {
          try {
            if (fs.existsSync(CARS_FILE)) {
              const data = fs.readFileSync(CARS_FILE, 'utf-8')
              return JSON.parse(data)
            }
          } catch {}
          return []
        }

        function saveDevCars(cars) {
          try {
            fs.writeFileSync(CARS_FILE, JSON.stringify(cars, null, 2), 'utf-8')
          } catch {}
        }

        if (url === '/api/cars' && req.method === 'GET') {
          const cars = loadDevCars()
          return sendJson(res, 200, {
            success: true,
            cars: cars.sort((a, b) => Number(a.id) - Number(b.id)),
          })
        }

        if (url === '/api/cars/sync' && req.method === 'POST') {
          try {
            const body = await parseRequestBody(req)
            const { cars = [] } = body
            let current = loadDevCars()
            let count = 0
            for (const c of cars) {
              if (c && c.brand && c.model && !current.some((x) => String(x.id) === String(c.id))) {
                current.push(c)
                count++
              }
            }
            if (count > 0) saveDevCars(current)
            return sendJson(res, 200, {
              success: true,
              cars: current.sort((a, b) => Number(a.id) - Number(b.id)),
            })
          } catch (err) {
            return sendJson(res, 500, { success: false, message: err.message })
          }
        }

        if (url === '/api/cars' && req.method === 'POST') {
          try {
            const authHeader = req.headers['authorization'] || ''
            const token = authHeader.replace(/^Bearer\s+/i, '').trim()
            if (!token || !activeAdminSessions.has(token)) {
              return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin token required.' })
            }

            const data = await parseRequestBody(req)
            if (!data.brand || !data.model) {
              return sendJson(res, 400, { success: false, message: 'Vehicle brand and model are required.' })
            }

            const cars = loadDevCars()
            const maxId = cars.reduce((max, c) => (typeof c.id === 'number' && c.id > max ? c.id : max), 0)
            const newId = maxId + 1
            const images = Array.isArray(data.images) && data.images.length > 0 ? data.images : [data.image || 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=800&q=80']

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

            cars.push(newCar)
            saveDevCars(cars)
            return sendJson(res, 201, { success: true, car: newCar })
          } catch (err) {
            return sendJson(res, 500, { success: false, message: err.message })
          }
        }

        if (url.startsWith('/api/cars/') && req.method === 'DELETE') {
          try {
            const authHeader = req.headers['authorization'] || ''
            const token = authHeader.replace(/^Bearer\s+/i, '').trim()
            if (!token || !activeAdminSessions.has(token)) {
              return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin token required.' })
            }

            const id = url.replace('/api/cars/', '')
            const cars = loadDevCars()
            const idx = cars.findIndex((c) => String(c.id) === String(id))
            if (idx === -1) {
              return sendJson(res, 404, { success: false, message: 'Vehicle not found.' })
            }
            const deleted = cars.splice(idx, 1)[0]
            saveDevCars(cars)
            return sendJson(res, 200, { success: true, car: deleted })
          } catch (err) {
            return sendJson(res, 500, { success: false, message: err.message })
          }
        }

        if (url.startsWith('/api/cars/') && req.method === 'PUT') {
          try {
            const authHeader = req.headers['authorization'] || ''
            const token = authHeader.replace(/^Bearer\s+/i, '').trim()
            if (!token || !activeAdminSessions.has(token)) {
              return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin token required.' })
            }

            const id = url.replace('/api/cars/', '')
            const cars = loadDevCars()
            const idx = cars.findIndex((c) => String(c.id) === String(id))
            if (idx === -1) {
              return sendJson(res, 404, { success: false, message: 'Vehicle not found.' })
            }
            const updateData = await parseRequestBody(req)
            cars[idx] = {
              ...cars[idx],
              ...updateData,
              id: cars[idx].id,
              updatedAt: new Date().toISOString(),
            }
            saveDevCars(cars)
            return sendJson(res, 200, { success: true, car: cars[idx] })
          } catch (err) {
            return sendJson(res, 500, { success: false, message: err.message })
          }
        }

        next()
      })
    },
  }
}
