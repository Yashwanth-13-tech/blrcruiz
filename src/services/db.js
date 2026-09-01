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
 * Initialize clean database stores without mock or seed data
 */
export async function initDB() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([CARS_STORE, INQUIRIES_STORE, SETTINGS_STORE], 'readwrite')
    const settingsStore = tx.objectStore(SETTINGS_STORE)

    // Mark as initialized so no automatic seeding ever runs
    settingsStore.put({ key: 'cars_initialized', value: true, timestamp: new Date().toISOString() })
    settingsStore.put({ key: 'inquiries_initialized', value: true, timestamp: new Date().toISOString() })

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
 * Clear all items from a store
 */
export async function clearStore(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.clear()
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Reset store to completely empty
 */
export async function resetCarsStore() {
  return await clearStore(CARS_STORE)
}
