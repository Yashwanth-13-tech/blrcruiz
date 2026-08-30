import React, { useState, useMemo } from 'react'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Car,
  AlertCircle,
  Search,
  Navigation,
} from 'lucide-react'
import { useCars } from '../../context/CarContext.jsx'

export default function AdminLocations() {
  const { locations, cars, addLocation, updateLocation, deleteLocation } = useCars()

  const [newName, setNewName] = useState('')
  const [newZone, setNewZone] = useState('')
  const [newLat, setNewLat] = useState('')
  const [newLng, setNewLng] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editZone, setEditZone] = useState('')
  const [editLat, setEditLat] = useState('')
  const [editLng, setEditLng] = useState('')
  const [editError, setEditError] = useState('')

  const [deletingId, setDeletingId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [searchQ, setSearchQ] = useState('')

  // Count how many cars are assigned to each location
  const carCountByLocation = useMemo(() => {
    const map = {}
    for (const car of cars) {
      if (Array.isArray(car.locations)) {
        for (const lid of car.locations) {
          map[lid] = (map[lid] || 0) + 1
        }
      }
    }
    return map
  }, [cars])

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase()
    if (!q) return locations
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.zone && l.zone.toLowerCase().includes(q))
    )
  }, [locations, searchQ])

  const handleAdd = async () => {
    setAddError('')
    if (!newName.trim()) {
      setAddError('Location name is required.')
      return
    }
    setAddLoading(true)
    const res = await addLocation(
      newName,
      newZone,
      newLat ? Number(newLat) : null,
      newLng ? Number(newLng) : null
    )
    setAddLoading(false)
    if (res.success) {
      setNewName('')
      setNewZone('')
      setNewLat('')
      setNewLng('')
    } else {
      setAddError(res.error || 'Failed to add location')
    }
  }

  const startEdit = (loc) => {
    setEditingId(loc.id)
    setEditName(loc.name)
    setEditZone(loc.zone || '')
    setEditLat(loc.lat ? String(loc.lat) : '12.9716')
    setEditLng(loc.lng ? String(loc.lng) : '77.5946')
    setEditError('')
  }

  const handleUpdate = async (id) => {
    setEditError('')
    if (!editName.trim()) {
      setEditError('Name is required.')
      return
    }
    const res = await updateLocation(
      id,
      editName,
      editZone,
      editLat ? Number(editLat) : 12.9716,
      editLng ? Number(editLng) : 77.5946,
      true
    )
    if (res.success) {
      setEditingId(null)
    } else {
      setEditError(res.error || 'Failed to update')
    }
  }

  const handleDelete = async (id) => {
    setDeleteLoading(true)
    await deleteLocation(id)
    setDeleteLoading(false)
    setDeletingId(null)
  }

  const ZONES = ['Airport', 'North', 'South', 'Central', 'East', 'West', 'Other']

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-extrabold text-charcoal-900">
          Bangalore Pickup Hubs ({locations.length})
        </h2>
        <p className="text-xs text-charcoal-500 mt-1">
          Manage Bangalore pickup hubs, GPS coordinates for "Near Me" detection, and car assignments.
        </p>
      </div>

      {/* Add New Location Card */}
      <div className="rounded-2xl border border-charcoal-900/10 bg-white p-5 shadow-sm">
        <h3 className="font-display text-sm font-bold text-charcoal-900 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-accent-500" />
          Add New Bangalore Location
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError('') }}
              placeholder="Hub name (e.g. Yelahanka & Jakkur)"
              className="input-field text-xs py-2.5"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="sm:col-span-2">
            <select
              value={newZone}
              onChange={(e) => setNewZone(e.target.value)}
              className="input-field text-xs py-2.5"
            >
              <option value="">Select Zone</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              step="any"
              value={newLat}
              onChange={(e) => setNewLat(e.target.value)}
              placeholder="Latitude (e.g. 13.1007)"
              className="input-field text-xs py-2.5"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              step="any"
              value={newLng}
              onChange={(e) => setNewLng(e.target.value)}
              placeholder="Longitude (e.g. 77.5963)"
              className="input-field text-xs py-2.5"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={addLoading}
              className="btn-accent text-xs !py-2.5 w-full justify-center"
            >
              <Plus size={15} />
              <span>{addLoading ? 'Adding...' : 'Add Hub'}</span>
            </button>
          </div>
        </div>
        {addError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <AlertCircle size={13} /> {addError}
          </p>
        )}
      </div>

      {/* Location List Table */}
      <div className="rounded-2xl border border-charcoal-900/10 bg-white shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-charcoal-900/5">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search locations..."
              className="input-field pl-9 text-xs py-2"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <MapPin size={36} className="text-charcoal-300 mb-2" />
            <p className="text-sm font-bold text-charcoal-700">No locations found</p>
            <p className="text-xs text-charcoal-400 mt-1">
              {searchQ ? 'Try a different search term.' : 'Add your first Bangalore pickup location above.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-charcoal-900/10 bg-charcoal-50/70 text-[11px] font-bold uppercase tracking-wider text-charcoal-500">
              <tr>
                <th className="px-5 py-3.5">Location Name</th>
                <th className="px-4 py-3.5">Zone</th>
                <th className="px-4 py-3.5">GPS Coordinates (Near Me)</th>
                <th className="px-4 py-3.5">Cars Assigned</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-900/5 font-medium text-charcoal-700">
              {filtered.map((loc) => {
                const count = carCountByLocation[loc.id] || 0
                const isEditing = editingId === loc.id

                return (
                  <tr key={loc.id} className="hover:bg-charcoal-50/50 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => { setEditName(e.target.value); setEditError('') }}
                            className="input-field text-xs py-1.5 font-semibold"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdate(loc.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                          />
                          {editError && (
                            <p className="text-[11px] text-red-500 font-semibold">{editError}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                            <MapPin size={13} />
                          </span>
                          <span className="font-semibold text-charcoal-900">{loc.name}</span>
                        </div>
                      )}
                    </td>

                    {/* Zone */}
                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <select
                          value={editZone}
                          onChange={(e) => setEditZone(e.target.value)}
                          className="input-field text-xs py-1.5 w-auto"
                        >
                          <option value="">Select Zone</option>
                          {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                        </select>
                      ) : (
                        <span className="rounded-md bg-charcoal-100 px-2 py-0.5 text-[11px] font-bold text-charcoal-700">
                          {loc.zone || 'Other'}
                        </span>
                      )}
                    </td>

                    {/* Coordinates */}
                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={editLat}
                            onChange={(e) => setEditLat(e.target.value)}
                            placeholder="Lat"
                            className="input-field text-xs py-1.5 w-24"
                          />
                          <input
                            type="number"
                            step="any"
                            value={editLng}
                            onChange={(e) => setEditLng(e.target.value)}
                            placeholder="Lng"
                            className="input-field text-xs py-1.5 w-24"
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-500">
                          {loc.lat && loc.lng ? `${Number(loc.lat).toFixed(4)}°, ${Number(loc.lng).toFixed(4)}°` : '12.9716°, 77.5946°'}
                        </span>
                      )}
                    </td>

                    {/* Cars count */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-charcoal-600">
                        <Car size={12} className="text-charcoal-400" />
                        <span className="font-semibold">{count} car{count !== 1 ? 's' : ''}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdate(loc.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal-900/10 text-charcoal-500 hover:bg-charcoal-100 transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : deletingId === loc.id ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-red-600">
                              Remove from {count} car{count !== 1 ? 's' : ''}?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(loc.id)}
                              disabled={deleteLoading}
                              className="rounded-lg bg-red-500 px-2.5 py-1 font-bold text-white hover:bg-red-600 text-[11px]"
                            >
                              {deleteLoading ? '...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="rounded-lg bg-charcoal-100 px-2.5 py-1 font-bold text-charcoal-700 text-[11px] hover:bg-charcoal-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(loc)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal-900/10 text-charcoal-600 hover:bg-charcoal-100 hover:text-charcoal-900 transition-colors"
                              title="Edit Location & GPS Coordinates"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(loc.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal-900/10 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                              title="Delete Location"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] text-charcoal-400 text-center">
        GPS coordinates are used automatically by the customer <strong>"Near Me"</strong> feature to match them with the closest pickup hub.
      </p>
    </div>
  )
}
