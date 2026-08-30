/**
 * Drivora Geolocation & Distance Utilities
 * 
 * Provides robust, secure-context-aware location detection and Haversine distance
 * calculations to match users with their nearest Bangalore pickup hub.
 */

/**
 * Default Bangalore coordinates for known pickup hubs
 */
export const DEFAULT_BANGALORE_COORDINATES = {
  loc_airport: { lat: 13.1986, lng: 77.7066 },
  loc_koramangala: { lat: 12.9352, lng: 77.6245 },
  loc_indiranagar: { lat: 12.9784, lng: 77.6408 },
  loc_whitefield: { lat: 12.9698, lng: 77.7499 },
  loc_hsr: { lat: 12.9121, lng: 77.6446 },
  loc_electronic_city: { lat: 12.8452, lng: 77.6602 },
  loc_mg_road: { lat: 12.9756, lng: 77.6066 },
  loc_jayanagar: { lat: 12.9308, lng: 77.5838 },
  loc_hebbal: { lat: 13.0358, lng: 77.5970 },
  loc_marathahalli: { lat: 12.9591, lng: 77.6974 },
  loc_yelahanka: { lat: 13.1007, lng: 77.5963 },
  loc_rajajinagar: { lat: 12.9982, lng: 77.5530 },
}

/**
 * Default Bangalore City Center Fallback (MG Road)
 */
export const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 }

/**
 * Calculate great-circle distance between two GPS coordinates in kilometers using Haversine formula
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (angle * Math.PI) / 180
  const R = 6371 // Earth radius in km

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Find the nearest location object from an array of locations given user coordinates
 */
export function findNearestLocation(userLat, userLng, locations = []) {
  if (!locations || locations.length === 0) return null

  let nearest = null
  let minDistance = Infinity

  for (const loc of locations) {
    // Read coordinates from location object or fallback to known coordinates map
    const coords =
      loc.lat && loc.lng
        ? { lat: Number(loc.lat), lng: Number(loc.lng) }
        : DEFAULT_BANGALORE_COORDINATES[loc.id] || null

    if (coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
      const distance = haversineDistance(userLat, userLng, coords.lat, coords.lng)
      if (distance < minDistance) {
        minDistance = distance
        nearest = {
          ...loc,
          distanceKm: Number(distance.toFixed(1)),
        }
      }
    }
  }

  return nearest
}

/**
 * Secure, cross-browser Geolocation request
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    // 1. Check if browser supports Geolocation API
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject({
        code: 'NOT_SUPPORTED',
        message: 'Geolocation is not supported by your browser.',
      })
    }

    // 2. Check for Secure Context (HTTPS or localhost)
    // Note: Modern browsers block geolocation over non-localhost HTTP (e.g. http://192.168.x.x)
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '[::1]')

    if (typeof window !== 'undefined' && window.isSecureContext === false && !isLocalhost) {
      return reject({
        code: 'INSECURE_CONTEXT',
        message:
          'Browser location requires a secure HTTPS connection or localhost. Please select your pickup hub manually.',
      })
    }

    // 3. Request Geolocation with optimized options
    // Using enableHighAccuracy: false first or with 10s timeout ensures fast response on laptops/desktops
    const geoOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000, // Accept cached location up to 5 minutes old
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        let userMessage = 'Location access is optional. You can select your pickup hub manually.'
        let errorCode = 'UNKNOWN'

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorCode = 'PERMISSION_DENIED'
            userMessage = 'Location access is optional. You can select your pickup hub manually.'
            break
          case 2: // POSITION_UNAVAILABLE
            errorCode = 'POSITION_UNAVAILABLE'
            userMessage = 'Could not pinpoint your position. Please select your pickup hub manually.'
            break
          case 3: // TIMEOUT
            errorCode = 'TIMEOUT'
            userMessage = 'Location request timed out. Please select your pickup hub manually.'
            break
          default:
            errorCode = 'ERROR'
            userMessage = 'Could not detect location. Please select your pickup hub manually.'
        }

        reject({
          code: errorCode,
          message: userMessage,
          originalError: error,
        })
      },
      geoOptions
    )
  })
}
