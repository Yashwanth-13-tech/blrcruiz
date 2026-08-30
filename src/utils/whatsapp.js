import { business } from '../config/business.js'

/**
 * Build a WhatsApp deep link that opens a chat with the business
 * number, pre-filled with the given message.
 * @param {string} message - Plain text message (will be URL-encoded)
 * @returns {string} WhatsApp URL, safe to use in target="_blank"
 */
export function createWhatsAppLink(message = '') {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${business.whatsapp}?text=${encoded}`
}

/**
 * Build the tel: link for calling the business.
 */
export function createCallLink() {
  return `tel:${business.phoneRaw}`
}

/**
 * Standard "general inquiry" WhatsApp message.
 */
export function genericInquiryMessage() {
  return `Hello ${business.name}, I would like to know more about your car rental options in Bangalore.`
}

/**
 * Booking-specific WhatsApp message, built dynamically from
 * whatever the customer selected. Nothing here is hardcoded.
 */
export function buildBookingMessage({
  carName,
  pickupLocation,
  pickupDate,
  returnDate,
  days,
  estimatedTotal,
  name,
  phone,
}) {
  const lines = [
    `Hello ${business.name},`,
    '',
    'I would like to rent a car.',
    '',
    `Car: ${carName || 'Not selected'}`,
    `Pickup: ${pickupLocation || 'Not selected'}`,
    `Pickup Date: ${pickupDate || 'Not selected'}`,
    `Return Date: ${returnDate || 'Not selected'}`,
    `Rental Duration: ${days ? `${days} day${days > 1 ? 's' : ''}` : 'Not selected'}`,
    `Estimated Price: ${estimatedTotal || 'Not calculated'}`,
    '',
    `Name: ${name || 'Not provided'}`,
    `Phone: ${phone || 'Not provided'}`,
    '',
    'Please confirm availability and final pricing.',
  ]
  return lines.join('\n')
}

/**
 * Monthly / long-term rental inquiry message.
 */
export function monthlyRentalMessage() {
  return `Hello ${business.name}, I'm interested in a monthly / long-term car rental in Bangalore. Could you share the available options and pricing?`
}

/**
 * Airport pickup inquiry message.
 */
export function airportRentalMessage() {
  return `Hello ${business.name}, I'm landing in Bangalore and would like to rent a car from Kempegowda International Airport. Please share availability and pricing.`
}
