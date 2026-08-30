import { useEffect } from 'react'
import { business } from '../config/business.js'

const DEFAULT_SEO = {
  title: 'Car Rental in Bangalore | Self Drive & Rental Cars | BLR CRUIZ',
  description:
    'Rent verified self-drive and chauffeur cars in Bangalore with BLR CRUIZ. Transparent daily fares from ₹1,499/day, hatchbacks to luxury SUVs, and Bangalore airport delivery.',
  keywords:
    'car rental Bangalore, self drive car rental Bangalore, car hire Bangalore, rental cars Bangalore, airport car rental Bangalore, luxury car rental Bangalore, monthly car rental Bangalore, Bangalore self drive cars',
  canonical: 'https://blrcruiz.in/',
  ogImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
  type: 'website',
  robots: 'index, follow',
}

const ROUTE_SEO = {
  public: DEFAULT_SEO,
  terms: {
    title: 'Terms and Conditions | BLR CRUIZ Car Rental Bangalore',
    description:
      'Read the official car rental terms and conditions of BLR CRUIZ Bangalore. Information on advance booking, insurance, customer responsibilities, and rental guidelines.',
    keywords:
      'BLR CRUIZ terms, car rental terms Bangalore, car rental policy Bangalore, rental agreement Bangalore',
    canonical: 'https://blrcruiz.in/terms',
    ogImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
    type: 'article',
    robots: 'index, follow',
  },
  admin: {
    title: 'Admin Portal | BLR CRUIZ Central Fleet Control Hub',
    description: 'Secure administrator management console for BLR CRUIZ Bangalore.',
    keywords: 'admin',
    canonical: 'https://blrcruiz.in/#admin',
    ogImage: '',
    type: 'website',
    robots: 'noindex, nofollow, noarchive',
  },
}

export default function SEO({ route = 'public' }) {
  useEffect(() => {
    const meta = ROUTE_SEO[route] || DEFAULT_SEO

    // Document Title
    document.title = meta.title

    // Helper function to create or update meta tags
    const setMetaTag = (selector, attributeName, attributeValue, content) => {
      let element = document.querySelector(selector)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attributeName, attributeValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Standard Meta
    setMetaTag('meta[name="description"]', 'name', 'description', meta.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', meta.keywords)
    setMetaTag('meta[name="robots"]', 'name', 'robots', meta.robots)

    // Open Graph
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', meta.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', meta.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', meta.canonical)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', meta.type)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', business.name)
    if (meta.ogImage) {
      setMetaTag('meta[property="og:image"]', 'property', 'og:image', meta.ogImage)
    }

    // Twitter Card
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description)
    if (meta.ogImage) {
      setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', meta.ogImage)
    }

    // Canonical Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', meta.canonical)
  }, [route])

  return null
}
