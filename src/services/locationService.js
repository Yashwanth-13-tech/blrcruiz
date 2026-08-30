import { getAllFromStore, putInStore, deleteFromStore } from './db.js'

const LOCATIONS_STORE = 'locations'

/**
 * Default Bangalore pickup hubs seeded on first run with precise GPS coordinates.
 * Each location has a stable string ID so car assignments remain valid.
 */
export const DEFAULT_LOCATIONS = [
  { id: 'loc_airport', name: 'Bangalore Airport (BLR)', zone: 'Airport', lat: 13.1986, lng: 77.7066, active: true },
  { id: 'loc_koramangala', name: 'Koramangala', zone: 'South', lat: 12.9352, lng: 77.6245, active: true },
  { id: 'loc_indiranagar', name: 'Indiranagar', zone: 'Central', lat: 12.9784, lng: 77.6408, active: true },
  { id: 'loc_whitefield', name: 'Whitefield & ITPL', zone: 'East', lat: 12.9698, lng: 77.7499, active: true },
  { id: 'loc_hsr', name: 'HSR Layout', zone: 'South', lat: 12.9121, lng: 77.6446, active: true },
  { id: 'loc_electronic_city', name: 'Electronic City', zone: 'South', lat: 12.8452, lng: 77.6602, active: true },
  { id: 'loc_mg_road', name: 'MG Road & Brigade', zone: 'Central', lat: 12.9756, lng: 77.6066, active: true },
  { id: 'loc_jayanagar', name: 'Jayanagar & JP Nagar', zone: 'South', lat: 12.9308, lng: 77.5838, active: true },
  { id: 'loc_hebbal', name: 'Hebbal & Manyata', zone: 'North', lat: 13.0358, lng: 77.5970, active: true },
  { id: 'loc_marathahalli', name: 'Marathahalli & ORR', zone: 'East', lat: 12.9591, lng: 77.6974, active: true },
]

export const locationService = {
  /**
   * Fetch all locations, seeding defaults or merging coordinates if missing.
   */
  async getLocations() {
    let locations = await getAllFromStore(LOCATIONS_STORE)

    // Seed defaults on first run
    if (!locations || locations.length === 0) {
      for (const loc of DEFAULT_LOCATIONS) {
        await putInStore(LOCATIONS_STORE, {
          ...loc,
          createdAt: new Date().toISOString(),
        })
      }
      locations = await getAllFromStore(LOCATIONS_STORE)
    } else {
      // Ensure existing stored locations have coordinates backfilled
      let modified = false
      for (const loc of locations) {
        if (!loc.lat || !loc.lng) {
          const matchDefault = DEFAULT_LOCATIONS.find((d) => d.id === loc.id || d.name === loc.name)
          if (matchDefault) {
            loc.lat = matchDefault.lat
            loc.lng = matchDefault.lng
            loc.active = loc.active !== false
            await putInStore(LOCATIONS_STORE, loc)
            modified = true
          }
        }
      }
      if (modified) {
        locations = await getAllFromStore(LOCATIONS_STORE)
      }
    }

    // Sort alphabetically by name
    return locations.sort((a, b) => a.name.localeCompare(b.name))
  },

  /**
   * Add a new Bangalore location with coordinates.
   */
  async addLocation(name, zone = 'Other', lat = null, lng = null) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Location name is required')

    const existing = await getAllFromStore(LOCATIONS_STORE)
    const duplicate = existing.find(
      (l) => l.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) throw new Error(`Location "${trimmed}" already exists`)

    const newLoc = {
      id: `loc_${Date.now()}`,
      name: trimmed,
      zone: zone.trim() || 'Other',
      lat: lat !== null && !isNaN(Number(lat)) ? Number(lat) : 12.9716, // Default to Bangalore Center
      lng: lng !== null && !isNaN(Number(lng)) ? Number(lng) : 77.5946,
      active: true,
      createdAt: new Date().toISOString(),
    }
    await putInStore(LOCATIONS_STORE, newLoc)
    return newLoc
  },

  /**
   * Update a location's name, zone, and coordinates.
   */
  async updateLocation(id, name, zone, lat, lng, active = true) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Location name is required')

    const existing = await getAllFromStore(LOCATIONS_STORE)
    const current = existing.find((l) => l.id === id)
    if (!current) throw new Error('Location not found')

    const updated = {
      ...current,
      name: trimmed,
      zone: zone ? zone.trim() : current.zone,
      lat: lat !== undefined && lat !== null && !isNaN(Number(lat)) ? Number(lat) : (current.lat || 12.9716),
      lng: lng !== undefined && lng !== null && !isNaN(Number(lng)) ? Number(lng) : (current.lng || 77.5946),
      active: active !== undefined ? Boolean(active) : (current.active !== false),
      updatedAt: new Date().toISOString(),
    }
    await putInStore(LOCATIONS_STORE, updated)
    return updated
  },

  /**
   * Delete a location. Cars that had this location assigned will
   * have it removed automatically via CarContext.
   */
  async deleteLocation(id) {
    await deleteFromStore(LOCATIONS_STORE, id)
    return true
  },
}

export default locationService
