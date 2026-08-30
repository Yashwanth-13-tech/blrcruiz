/**
 * Drivora Razorpay Checkout Integration Helper
 * 
 * Handles SDK loading, order initiation, and secure server-side payment verification.
 * NO API keys or secrets are stored or exposed here.
 */

let sdkPromise = null

/**
 * Dynamically load the official Razorpay Checkout JavaScript SDK
 */
export function loadRazorpaySDK() {
  if (typeof window === 'undefined') return Promise.resolve(false)

  if (window.Razorpay) {
    return Promise.resolve(true)
  }

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => {
        console.error('Failed to load Razorpay Checkout SDK.')
        sdkPromise = null
        resolve(false)
      }
      document.body.appendChild(script)
    })
  }

  return sdkPromise
}

/**
 * Safe JSON Response Parser
 * Prevents "Unexpected end of JSON input" errors when server returns empty, non-JSON, or error responses.
 */
async function safeParseJsonResponse(response, defaultErrorMessage) {
  let text = ''
  try {
    text = await response.text()
  } catch (readErr) {
    throw new Error(`Failed to read server response: ${readErr.message}`)
  }

  // Handle completely empty responses
  if (!text || text.trim() === '') {
    if (!response.ok) {
      throw new Error(
        defaultErrorMessage ||
        `Backend server returned HTTP ${response.status} with empty response. Please ensure the backend server is running (npm run server).`
      )
    }
    return { success: true }
  }

  // Check if content looks like JSON
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed)
      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || defaultErrorMessage || `Server returned error (${response.status})`
        )
      }
      return data
    } catch (parseErr) {
      if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr
      throw new Error(`Invalid JSON received from server: ${trimmed.slice(0, 100)}`)
    }
  }

  // Handle HTML or text error responses (e.g. 404/500 proxy errors)
  const cleanText = trimmed.replace(/<[^>]*>?/gm, '').trim()
  throw new Error(
    `Server returned HTTP ${response.status}: ${cleanText.slice(0, 120) || defaultErrorMessage || 'Unexpected server error'}`
  )
}

/**
 * Fetch public Razorpay config from backend
 */
export async function fetchRazorpayConfig() {
  try {
    const res = await fetch('/api/config/razorpay')
    const data = await safeParseJsonResponse(res, 'Could not fetch Razorpay configuration.')
    return data
  } catch (error) {
    console.warn('Could not fetch Razorpay config from backend:', error.message)
    const envKey = import.meta.env.VITE_RAZORPAY_KEY_ID || ''
    return {
      success: Boolean(envKey),
      keyId: envKey,
      isConfigured: Boolean(envKey && !envKey.includes('your_')),
      mode: envKey.startsWith('rzp_live') ? 'live' : 'test',
    }
  }
}

/**
 * Initiate server-side order creation
 */
export async function createBackendOrder(bookingPayload) {
  let response
  try {
    response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(bookingPayload),
    })
  } catch (fetchErr) {
    throw new Error(
      `Cannot connect to backend server. Please make sure the backend is running on port 5000 (run "npm run server"). Details: ${fetchErr.message}`
    )
  }

  return await safeParseJsonResponse(response, 'Failed to create Razorpay order.')
}

/**
 * Send payment response to backend for cryptographic HMAC SHA256 verification
 */
export async function verifyBackendPayment(razorpayResponse, bookingDetails) {
  let response
  try {
    response = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        bookingDetails,
      }),
    })
  } catch (fetchErr) {
    throw new Error(
      `Cannot connect to backend server for verification. Please make sure the backend is running (run "npm run server"). Details: ${fetchErr.message}`
    )
  }

  return await safeParseJsonResponse(response, 'Payment signature verification failed.')
}
