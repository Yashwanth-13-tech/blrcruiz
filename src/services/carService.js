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
   * Fetch all cars from the persistent backend database with local IndexedDB synchronization
   */
  async getCars() {
    await ensureDB()

    // 1. Try fetching live fleet from backend API
    try {
      const res = await fetch(apiUrl('/api/cars'))
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.cars)) {
          // Sync with local IndexedDB: remove any cars that no longer exist on server
          try {
            const localCars = await getAllFromStore('cars')
            const serverIds = new Set(data.cars.map((c) => String(c.id)))
            for (const localCar of localCars) {
              if (!serverIds.has(String(localCar.id))) {
                await deleteFromStore('cars', localCar.id)
              }
            }
            for (const car of data.cars) {
              await putInStore('cars', car)
            }
          } catch (syncErr) {
            console.warn('[CarService] IndexedDB sync notice:', syncErr.message)
          }

          return data.cars.sort((a, b) => Number(a.id) - Number(b.id))
        }
      }
    } catch (err) {
      console.warn('[CarService] Network notice: Using cached cars:', err.message)
    }

    // 2. Fallback to local store
    const localCars = await getAllFromStore('cars')
    return localCars.sort((a, b) => Number(a.id) - Number(b.id))
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

    // 1. Try backend creation
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
          await putInStore('cars', data.car)
          return data.car
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        if (res.status === 401) {
          throw new Error('Unauthorized. Please log in again to add vehicles.')
        }
        if (errData.message) {
          throw new Error(errData.message)
        }
      }
    } catch (err) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('required')) {
        throw err
      }
      console.warn('[CarService] Server add notice:', err.message)
    }

    // 2. Fallback local addition
    const existing = await getAllFromStore('cars')
    const maxId = existing.reduce((max, c) => (typeof c.id === 'number' && c.id > max ? c.id : max), 0)
    const newId = maxId + 1

    const images = Array.isArray(carData.images) && carData.images.length > 0
      ? carData.images
      : [carData.image || 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=800&q=80']

    const newCar = {
      ...carData,
      id: newId,
      brand: carData.brand.trim(),
      model: carData.model.trim(),
      category: carData.category || 'Hatchback',
      year: Number(carData.year) || new Date().getFullYear(),
      seats: Number(carData.seats) || 5,
      transmission: carData.transmission || 'Automatic',
      fuel: carData.fuel || 'Petrol',
      ac: Boolean(carData.ac ?? true),
      pricePerDay: Number(carData.pricePerDay) || 1500,
      rating: Number(carData.rating) || 4.8,
      popular: Boolean(carData.popular ?? false),
      available: Boolean(carData.available ?? true),
      image: images[0],
      images: images,
      locations: Array.isArray(carData.locations) ? carData.locations : [],
      description: carData.description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await putInStore('cars', newCar)
    return newCar
  },

  /**
   * Update an existing vehicle
   */
  async updateCar(id, updateData) {
    await ensureDB()
    const numericId = Number(id)
    const carId = isNaN(numericId) ? id : numericId
    const token = authService.getToken()

    // 1. Try backend update
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
        if (errData.message) {
          throw new Error(errData.message)
        }
      }
    } catch (err) {
      if (err.message?.includes('Unauthorized')) {
        throw err
      }
      console.warn('[CarService] Server update notice:', err.message)
    }

    // 2. Fallback local update
    const existing = await getByIdFromStore('cars', carId)
    if (!existing) {
      throw new Error(`Car with ID ${id} not found`)
    }

    const images = Array.isArray(updateData.images) && updateData.images.length > 0
      ? updateData.images
      : (updateData.image ? [updateData.image] : existing.images || [existing.image])

    const updatedCar = {
      ...existing,
      ...updateData,
      id: carId,
      brand: updateData.brand ? updateData.brand.trim() : existing.brand,
      model: updateData.model ? updateData.model.trim() : existing.model,
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

    await putInStore('cars', updatedCar)
    return updatedCar
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
          // ignore parse error
        }
        if (res.status === 401) {
          throw new Error('Unauthorized. Please log in again to delete vehicles.')
        }
        if (res.status !== 404) {
          throw new Error(errMessage)
        }
      }
    } catch (err) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('Access denied')) {
        throw err
      }
      console.warn('[CarService] Server delete notice:', err.message)
    }

    // 2. Permanently remove from local IndexedDB cache
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
   * Reset database back to default 12 cars
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
