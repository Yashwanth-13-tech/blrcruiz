import {
  initDB,
  getAllFromStore,
  getByIdFromStore,
  putInStore,
  deleteFromStore,
  resetCarsStore,
} from './db.js'

let isInitialized = false

async function ensureDB() {
  if (!isInitialized) {
    await initDB()
    isInitialized = true
  }
}

export const carService = {
  /**
   * Fetch all cars from the persistent database
   */
  async getCars() {
    await ensureDB()
    const cars = await getAllFromStore('cars')
    // Return sorted by id or createdAt
    return cars.sort((a, b) => Number(a.id) - Number(b.id))
  },

  /**
   * Get single car by ID
   */
  async getCarById(id) {
    await ensureDB()
    const numericId = Number(id)
    return await getByIdFromStore('cars', isNaN(numericId) ? id : numericId)
  },

  /**
   * Add a new vehicle to inventory
   */
  async addCar(carData) {
    await ensureDB()
    const existing = await getAllFromStore('cars')
    
    // Generate unique numeric ID
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
   * Delete a vehicle from inventory
   */
  async deleteCar(id) {
    await ensureDB()
    const numericId = Number(id)
    const carId = isNaN(numericId) ? id : numericId
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
    await resetCarsStore()
    return await this.getCars()
  },
}

export default carService
