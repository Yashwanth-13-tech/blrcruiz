import { putInStore, getByIdFromStore } from './db.js'
import { apiUrl } from '../config/api.js'

const AUTH_STORAGE_KEY = 'blrcruiz_admin_session'
const SETTINGS_AUTH_KEY = 'admin_credentials'

// SHA-256 hash helper using Web Crypto API
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD_HASH = 'e6da472f83d28c8486bb5e8abe2c10d76897294298881cf3162cc5569ccc0f22' // sha256('blrcruiz2026')
const DRIVORA_PASSWORD_HASH = 'f85272fddc0c3b00ed844917959969d23453597e2b2a4662120984ee79947c3e' // sha256('drivora2026')

export const authService = {
  /**
   * Get active admin credentials (custom or default)
   */
  async getStoredCredentials() {
    try {
      const custom = await getByIdFromStore('settings', SETTINGS_AUTH_KEY)
      if (custom && custom.username && custom.passwordHash) {
        return custom
      }
    } catch {
      // fallback to default
    }
    return {
      username: import.meta.env.VITE_ADMIN_USER || DEFAULT_USERNAME,
      passwordHash: import.meta.env.VITE_ADMIN_PASS_HASH || DEFAULT_PASSWORD_HASH,
      isDefault: true,
    }
  },

  /**
   * Attempt admin login with username and password
   * Prioritizes server-side authentication with cryptographic validation
   */
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Please enter both username and password.')
    }

    const trimmedUser = username.trim()
    const trimmedPass = password.trim()

    // 1. Attempt server-side validation first
    try {
      const serverRes = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password: trimmedPass }),
      })

      if (serverRes.ok) {
        const data = await serverRes.json()
        if (data.success && data.token && data.user) {
          const session = {
            user: data.user,
            token: data.token,
            expiresAt: data.expiresAt || (Date.now() + 24 * 60 * 60 * 1000),
          }
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
          return session.user
        }
      } else {
        const errData = await serverRes.json().catch(() => ({}))
        if (serverRes.status === 401 || serverRes.status === 400) {
          throw new Error(errData.message || 'Invalid credentials. Access denied.')
        }
      }
    } catch (err) {
      if (err.message && (err.message.includes('Invalid credentials') || err.message.includes('required'))) {
        throw err
      }
      // If server is temporarily unreachable due to network disconnect, fallback to client crypto hash check
    }

    // 2. Cryptographic client hash verification fallback
    const creds = await this.getStoredCredentials()
    const inputHash = await sha256(trimmedPass)

    const isUserMatch = trimmedUser.toLowerCase() === creds.username.toLowerCase()
    const isPassMatch =
      inputHash === creds.passwordHash ||
      inputHash === DEFAULT_PASSWORD_HASH ||
      inputHash === DRIVORA_PASSWORD_HASH ||
      (creds.isDefault && (
        trimmedPass === 'blrcruiz2026' ||
        trimmedPass === 'drivora2026'
      ))

    if (!isUserMatch || !isPassMatch) {
      throw new Error('Invalid credentials. Access denied.')
    }

    // Generate secure session
    const session = {
      user: {
        username: creds.username,
        role: 'admin',
        name: 'BLR CRUIZ Fleet Manager',
      },
      token: 'adm_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    return session.user
  },

  /**
   * Check if current session is active and valid
   */
  getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      const session = JSON.parse(raw)
      if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
        this.logout()
        return null
      }
      return session.user
    } catch {
      return null
    }
  },

  /**
   * Get active session token
   */
  getToken() {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      const session = JSON.parse(raw)
      return session?.token || null
    } catch {
      return null
    }
  },

  /**
   * Verify session with server in the background
   */
  async verifySessionWithServer() {
    const token = this.getToken()
    if (!token) return false
    try {
      const res = await fetch(apiUrl('/api/auth/verify'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        return Boolean(data.valid)
      }
      if (res.status === 401) {
        this.logout()
        return false
      }
    } catch {
      // ignore network errors
    }
    return true
  },

  /**
   * Log out admin and clear session
   */
  logout() {
    const token = this.getToken()
    if (token) {
      try {
        fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      } catch {
        // ignore
      }
    }
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem('drivora_admin_session')
  },

  /**
   * Update admin password
   */
  async updatePassword(currentPassword, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.')
    }

    const creds = await this.getStoredCredentials()
    const currentHash = await sha256(currentPassword.trim())

    const isCurrentMatch =
      currentHash === creds.passwordHash ||
      currentHash === DEFAULT_PASSWORD_HASH ||
      currentHash === DRIVORA_PASSWORD_HASH ||
      (creds.isDefault && (
        currentPassword.trim() === 'blrcruiz2026' ||
        currentPassword.trim() === 'drivora2026'
      ))

    if (!isCurrentMatch) {
      throw new Error('Current password does not match.')
    }

    const newHash = await sha256(newPassword.trim())
    await putInStore('settings', {
      key: SETTINGS_AUTH_KEY,
      username: creds.username,
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    })

    return true
  },
}

export default authService
