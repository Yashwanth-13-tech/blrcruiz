/**
 * Drivora Pricing & Date Utilities
 */

/**
 * Safely parse any price input (number, "₹1,499", "1499/day", "₹ 2,099") into a clean number.
 */
export function parsePrice(val) {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val
  }
  if (!val) return 0
  const cleaned = String(val).replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Format a number or numeric string as Indian Rupees, e.g. formatPrice(8397) -> "₹8,397"
 */
export function formatPrice(amount) {
  const num = parsePrice(amount)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Format a date input value (YYYY-MM-DD) as "28 Aug 2026".
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Calculate rental duration in whole days between two YYYY-MM-DD strings.
 * Always returns a minimum of 1 day, and 0 if either date is missing/invalid
 * or the return date is before the pickup date.
 */
export function calculateDays(pickupDate, returnDate) {
  if (!pickupDate || !returnDate) return 0
  const start = new Date(pickupDate + 'T00:00:00')
  const end = new Date(returnDate + 'T00:00:00')
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
  const diffMs = end.getTime() - start.getTime()
  if (diffMs < 0) return -1 // signals invalid range (return before pickup)
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(diffDays, 1) // same-day pickup/return = minimum 1 day rental
}

/**
 * Calculate structured total price breakdown for a vehicle given a day count.
 * Returns an object containing { dailyRate, days, base, tax, total } and numeric value.
 */
export function calculateTotal(pricePerDay, days, gstRate = 0.05) {
  const numericPrice = parsePrice(pricePerDay) || 1499
  const validDays = Number(days) > 0 ? Number(days) : 1
  const base = Math.round(numericPrice * validDays)
  const tax = Math.round(base * gstRate)
  const total = base + tax

  return {
    dailyRate: numericPrice,
    days: validDays,
    base,
    tax,
    gstRate,
    total,
    // Support valueOf so numeric operations like +priceInfo also work
    valueOf() {
      return total
    },
    toString() {
      return String(total)
    },
  }
}

/**
 * Today's date as YYYY-MM-DD, used as the min attribute for date inputs.
 */
export function todayStr() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().split('T')[0]
}
