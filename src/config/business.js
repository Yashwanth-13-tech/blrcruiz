// ============================================================
// BUSINESS CONFIGURATION
// Replace these values with the real business details.
// Every component in the app reads from this single file.
// ============================================================

export const business = {
  name: 'BLR CRUIZ',
  tagline: 'Car Rental Bangalore',
  description:
    'Reliable self-drive and chauffeur car rentals across Bangalore, with verified fleet, transparent pricing, and instant online booking.',

  // Displayed phone number (used for tel: links)
  phone: '+91 94482 77091',
  phoneRaw: '+919448277091', // digits only version used in tel: href

  // WhatsApp number MUST be in international format, no + or spaces
  // Example: 91 followed by 10-digit mobile number
  whatsapp: '919448277091',

  email: 'vikas@carrentalbanglore.site',

  city: 'Bangalore',
  state: 'Karnataka',
  country: 'India',
  address: 'Bangalore, Karnataka, India',

  hours: {
    days: 'Monday – Sunday',
    time: '8:00 AM – 10:00 PM',
  },

  social: {
    instagram: 'https://www.instagram.com/car._.rental._.bengaluru?igsi=MTFpZXBjdGE0am5tbg==',
    facebook: 'https://facebook.com/blrcruiz',
    youtube: 'https://youtube.com/@blrcruiz',
  },

  stats: {
    happyCustomers: '500+',
    carsAvailable: '25+',
    avgRating: '4.8/5',
    support: '7 Days',
  },
}

// Pickup locations offered across Bangalore
export const pickupLocations = [
  'Bangalore City',
  'Kempegowda International Airport',
  'Koramangala',
  'Indiranagar',
  'Whitefield',
  'Electronic City',
  'HSR Layout',
]

export default business
