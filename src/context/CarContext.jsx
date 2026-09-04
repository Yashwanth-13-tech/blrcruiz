import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { carService } from '../services/carService.js'
import { inquiryService } from '../services/inquiryService.js'
import { locationService } from '../services/locationService.js'

const CarContext = createContext(null)

export function CarProvider({ children }) {
  const [cars, setCars] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load cars, inquiries, and locations on mount
  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      const [fetchedCars, fetchedInquiries, fetchedLocations] = await Promise.all([
        carService.getCars(),
        inquiryService.getInquiries(),
        locationService.getLocations(),
      ])
      setCars(fetchedCars)
      setInquiries(fetchedInquiries)
      setLocations(fetchedLocations)
      setError(null)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.message || 'Failed to load cars.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // ─── Car Actions ───────────────────────────────────────────────────────────

  const addCar = async (carData) => {
    try {
      const newCar = await carService.addCar(carData)
      setCars((prev) => [...prev, newCar])
      return { success: true, car: newCar }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateCar = async (id, updateData) => {
    try {
      const updatedCar = await carService.updateCar(id, updateData)
      setCars((prev) => prev.map((c) => (String(c.id) === String(id) ? updatedCar : c)))
      return { success: true, car: updatedCar }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteCar = async (id) => {
    try {
      await carService.deleteCar(id)
      setCars((prev) => prev.filter((c) => String(c.id) !== String(id)))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const toggleAvailability = async (id) => {
    try {
      const updated = await carService.toggleAvailability(id)
      setCars((prev) => prev.map((c) => (String(c.id) === String(id) ? updated : c)))
      return { success: true, car: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const togglePopular = async (id) => {
    try {
      const updated = await carService.togglePopular(id)
      setCars((prev) => prev.map((c) => (String(c.id) === String(id) ? updated : c)))
      return { success: true, car: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteAllCars = async () => {
    try {
      setLoading(true)
      const res = await carService.deleteAllCars()
      setCars([])
      return { success: true, deletedCount: res.deletedCount || 0 }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const resetCars = async () => {
    try {
      setLoading(true)
      const resetted = await carService.resetToDefaults()
      setCars(resetted)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // ─── Inquiry Actions ───────────────────────────────────────────────────────

  const addInquiry = async (inquiryData) => {
    try {
      const newInq = await inquiryService.addInquiry(inquiryData)
      setInquiries((prev) => [newInq, ...prev])
      return { success: true, inquiry: newInq }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateInquiryStatus = async (id, status) => {
    try {
      const updated = await inquiryService.updateInquiryStatus(id, status)
      setInquiries((prev) => prev.map((i) => (i.id === id ? updated : i)))
      return { success: true, inquiry: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteInquiry = async (id) => {
    try {
      await inquiryService.deleteInquiry(id)
      setInquiries((prev) => prev.filter((i) => i.id !== id))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // ─── Location Actions ──────────────────────────────────────────────────────

  const addLocation = async (name, zone, lat, lng) => {
    try {
      const newLoc = await locationService.addLocation(name, zone, lat, lng)
      setLocations((prev) => [...prev, newLoc].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, location: newLoc }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateLocation = async (id, name, zone, lat, lng, active) => {
    try {
      const updated = await locationService.updateLocation(id, name, zone, lat, lng, active)
      setLocations((prev) =>
        prev.map((l) => (l.id === id ? updated : l)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return { success: true, location: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteLocation = async (id) => {
    try {
      await locationService.deleteLocation(id)
      setLocations((prev) => prev.filter((l) => l.id !== id))
      // Also strip the deleted location from all cars in local state
      setCars((prev) =>
        prev.map((car) => ({
          ...car,
          locations: Array.isArray(car.locations)
            ? car.locations.filter((lid) => lid !== id)
            : [],
        }))
      )
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return (
    <CarContext.Provider
      value={{
        cars,
        inquiries,
        locations,
        loading,
        error,
        refreshData,
        addCar,
        updateCar,
        deleteCar,
        deleteAllCars,
        toggleAvailability,
        togglePopular,
        resetCars,
        addInquiry,
        updateInquiryStatus,
        deleteInquiry,
        addLocation,
        updateLocation,
        deleteLocation,
      }}
    >
      {children}
    </CarContext.Provider>
  )
}

export function useCars() {
  const context = useContext(CarContext)
  if (!context) {
    throw new Error('useCars must be used within a CarProvider')
  }
  return context
}

export default CarContext
