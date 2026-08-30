/**
 * Centralized API Base URL and Endpoint Resolution
 * Supports:
 * 1. Production deployments (Vercel frontend pointing to Render backend via VITE_API_URL)
 * 2. Local development (relative URLs seamlessly handled by Vite proxy / local server)
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || ''
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '')

/**
 * Returns fully qualified URL when VITE_API_URL is set, or clean relative path.
 * @param {string} endpoint - e.g. '/api/config/razorpay' or 'api/auth/login'
 * @returns {string}
 */
export function apiUrl(endpoint) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

export default apiUrl
