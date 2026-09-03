import {
  initDB,
  getAllFromStore,
  getByIdFromStore,
  putInStore,
  deleteFromStore,
  resetCarsStore,
} from './db.js'
import { apiUrl } from '../config/api.js'
import { authService } from './authService.js'

let isInitialized = false

async function ensureDB() {
  if (!isInitialized) {
    await initDB()
    isInitialized = true
  }
}

export const carService = {
  /**
   * Fetch all cars from the persistent backend database with resilient synchronization
   * Handles server container restarts/redeployments without losing client or server records.
   */
  async getCars() {
    await ensureDB()

    let serverCars = null

    // 1. Fetch live fleet from backend API
    try {
      const res = await fetch(apiUrl('/api/cars'))
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.cars)) {
          serverCars = data.cars
        }
      }
    } catch (err) {
      console.warn('[CarService] Network notice: Using cached cars:', err.message)
    }

    const localCars = await getAllFromStore('cars')
    const deletedRecords = await getAllFromStore('deleted_records')
    const deletedSet = new Set(deletedRecords.map((r) => String(r.id)))

    if (serverCars !== null) {
      const serverIds = new Set(serverCars.map((c) => String(c.id)))

      // Check if client has valid local cars not present on server (e.g. after ephemeral server restart)
      const unsyncedLocalCars = localCars.filter(
        (c) => !serverIds.has(String(c.id)) && !deletedSet.has(String(c.id))
      )

      if (unsyncedLocalCars.length > 0) {
        try {
          const syncRes = await fetch(apiUrl('/api/cars/sync'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cars: unsyncedLocalCars }),
          })
          if (syncRes.ok) {
            const syncData = await syncRes.json()
            if (syncData.success && Array.isArray(syncData.cars)) {
              serverCars = syncData.cars
            }
          }
        } catch (syncErr) {
          console.warn('[CarService] Auto-sync notice:', syncErr.message)
        }
      }

      // Sync verified server list to local IndexedDB
      const updatedServerIds = new Set(serverCars.map((c) => String(c.id)))
      for (const localCar of localCars) {
        if (!updatedServerIds.has(String(localCar.id)) && deletedSet.has(String(localCar.id))) {
          await deleteFromStore('cars', localCar.id)
        }
      }
      for (const car of serverCars) {
        if (!deletedSet.has(String(car.id))) {
          await putInStore('cars', car)
        }
      }

      return serverCars
        .filter((c) => !deletedSet.has(String(c.id)))
        .sort((a, b) => Number(a.id) - Number(b.id))
    }

    // 2. Offline fallback to local IndexedDB store
    return localCars
      .filter((c) => !deletedSet.has(String(c.id)))
      .sort((a, b) => Number(a.id) - Number(b.id))
  },

  /**
   * Get single car by ID
   */
  async getCarById(id) {
    await ensureDB()
    const numericId = Number(id)
    const carId = isNaN(numericId) ? id : numericId

    // 1. Try backend
    try {
      const res = await fetch(apiUrl(`/api/cars/${encodeURIComponent(id)}`))
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.car) {
          await putInStore('cars', data.car)
          return data.car
        }
      }
    } catch {
      // ignore network errors
    }

    // 2. Fallback
    return await getByIdFromStore('cars', carId)
  },

  /**
   * Add a new vehicle to inventory
   */
  async addCar(carData) {
    await ensureDB()
    const token = authService.getToken()

    // Clear any previous deletion record for this vehicle if re-adding
    if (carData.id) {
      await deleteFromStore('deleted_records', String(carData.id)).catch(() => {})
    }

    // Send POST request to backend API
    try {
      const res = await fetch(apiUrl('/api/cars'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(carData),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.car) {
          await deleteFromStore('deleted_records', String(data.car.id)).catch(() => {})
          await putInStore('cars', data.car)
          return data.car
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        if (res.status === 401) {
          throw new Error('Unauthorized. Please log in again to add vehicles.')
        }
        throw new Error(errData.message || `Failed to add vehicle (Status: ${res.status})`)
      }
    } catch (err) {
      console.error('[CarService] Failed to add vehicle to backend:', err)
      throw err
    }
  },

  /**
   * Update an existing vehicle
   */
  async updateCar(id, updateData) {
    await ensureDB()
    const numericId = Number(id)
    const carId = isNaN(numericId) ? id : numericId
    const token = authService.getToken()

    // Send PUT request to backend API
    try {
      const res = await fetch(apiUrl(`/api/cars/${encodeURIComponent(id)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.car) {
          await putInStore('cars', data.car)
          return data.car
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        if (res.status === 401) {
          throw new Error('Unauthorized. Please log in again to update vehicles.')
        }
        throw new Error(errData.message || `Failed to update vehicle (Status: ${res.status})`)
      }
    } catch (err) {
      console.error('[CarService] Failed to update vehicle on backend:', err)
      throw err
    }
  },

  /**
   * Permanently delete a vehicle from backend inventory and local cache
   */
  async deleteCar(id) {
    await ensureDB()
    const numericId = Number(id)
    const carId = isNaN(numericId) ? id : numericId
    const token = authService.getToken()

    // 1. Send DELETE request to backend server
    try {
      const res = await fetch(apiUrl(`/api/cars/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        let errMessage = `Server returned HTTP ${res.status}`
        try {
          const errData = await res.json()
          if (errData.message) errMessage = errData.message
        } catch {
          // ignore
        }
        if (res.status === 401) {
          throw new Error('Unauthorized. Please log in again to delete vehicles.')
        }
        if (res.status !== 404) {
          throw new Error(errMessage)
        }
      }
    } catch (err) {
      console.error('[CarService] Failed to delete vehicle on backend:', err)
      throw err
    }

    // 2. Record tombstone in deleted_records to prevent resurrecting during sync
    await putInStore('deleted_records', { id: String(id), timestamp: Date.now() })

    // 3. Permanently remove from local IndexedDB cache
    await deleteFromStore('cars', carId)
    return true
  },

  /**
   * Toggle availability status of a car (Available <-> Booked)
   */
  async toggleAvailability(id) {
    const car = await this.getCarById(id)
    if (!car) throw new Error('Car not found')
    return await this.updateCar(id, { available: !car.available })
  },

  /**
   * Toggle popular/featured status
   */
  async togglePopular(id) {
    const car = await this.getCarById(id)
    if (!car) throw new Error('Car not found')
    return await this.updateCar(id, { popular: !car.popular })
  },

  /**
   * Reset database back to default 0 cars
   */
  async resetToDefaults() {
    await ensureDB()
    const token = authService.getToken()

    try {
      const res = await fetch(apiUrl('/api/cars/reset'), {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.cars)) {
          await resetCarsStore()
          return data.cars
        }
      }
    } catch (err) {
      console.warn('[CarService] Server reset notice:', err.message)
    }

    await resetCarsStore()
    return await this.getCars()
  },
}

export default carService
