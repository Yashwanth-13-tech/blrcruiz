import { cars as initialCars } from '../data/cars.js'

const DB_NAME = 'drivora_db'
const DB_VERSION = 2
const CARS_STORE = 'cars'
const INQUIRIES_STORE = 'inquiries'
const SETTINGS_STORE = 'settings'
const LOCATIONS_STORE = 'locations'

/**
 * Open or create the IndexedDB database
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Store for cars
      if (!db.objectStoreNames.contains(CARS_STORE)) {
        const carStore = db.createObjectStore(CARS_STORE, { keyPath: 'id' })
        carStore.createIndex('category', 'category', { unique: false })
        carStore.createIndex('available', 'available', { unique: false })
        carStore.createIndex('popular', 'popular', { unique: false })
      }

      // Store for customer inquiries / leads
      if (!db.objectStoreNames.contains(INQUIRIES_STORE)) {
        const inqStore = db.createObjectStore(INQUIRIES_STORE, { keyPath: 'id' })
        inqStore.createIndex('createdAt', 'createdAt', { unique: false })
        inqStore.createIndex('status', 'status', { unique: false })
      }

      // Store for settings
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' })
      }

      // Store for Bangalore pickup locations (added in DB_VERSION 2)
      if (!db.objectStoreNames.contains(LOCATIONS_STORE)) {
        db.createObjectStore(LOCATIONS_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Initialize and seed initial data if database is empty
 */
export async function initDB() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([CARS_STORE, INQUIRIES_STORE], 'readwrite')
    const carStore = tx.objectStore(CARS_STORE)
    const inqStore = tx.objectStore(INQUIRIES_STORE)

    const countReq = carStore.count()
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        // Seed initial cars with images array support
        initialCars.forEach((car) => {
          carStore.add({
            ...car,
            images: car.images || [car.image],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        })
      }
    }

    // Seed sample inquiries if empty for demo clarity
    const inqCountReq = inqStore.count()
    inqCountReq.onsuccess = () => {
      if (inqCountReq.result === 0) {
        const sampleInquiries = [
          {
            id: 'inq_1',
            name: 'Rohan Sharma',
            phone: '9845012345',
            email: 'rohan.sharma@example.com',
            carName: 'Hyundai Creta',
            carId: 6,
            pickupLocation: 'Kempegowda International Airport',
            pickupDate: '2026-09-01',
            returnDate: '2026-09-04',
            days: 3,
            estimatedTotal: '₹8,397',
            message: 'Need the car delivered to Terminal 2 arrival gate.',
            status: 'New',
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            id: 'inq_2',
            name: 'Ananya Deshmukh',
            phone: '9988776655',
            email: 'ananya.d@example.com',
            carName: 'BMW 3 Series',
            carId: 10,
            pickupLocation: 'Indiranagar',
            pickupDate: '2026-09-05',
            returnDate: '2026-09-07',
            days: 2,
            estimatedTotal: '₹15,998',
            message: 'Looking for a clean luxury car for client visit.',
            status: 'Contacted',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ]
        sampleInquiries.forEach((inq) => inqStore.add(inq))
      }
    }

    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Generic query to get all items from a store
 */
export async function getAllFromStore(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

/**
 * Generic query to get single item by ID
 */
export async function getByIdFromStore(storeName, id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Add or update an item in a store
 */
export async function putInStore(storeName, item) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.put(item)
    req.onsuccess = () => resolve(item)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Delete an item from a store by key
 */
export async function deleteFromStore(storeName, id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.delete(id)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Reset store to initial seed data
 */
export async function resetCarsStore() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CARS_STORE, 'readwrite')
    const store = tx.objectStore(CARS_STORE)
    store.clear()
    initialCars.forEach((car) => {
      store.add({
        ...car,
        images: car.images || [car.image],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}
