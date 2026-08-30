import { useEffect, useRef, useState } from 'react'

/**
 * High-performance viewport reveal hook using native IntersectionObserver.
 * Automatically disconnects once revealed so it has ZERO scroll overhead afterwards.
 */
export function useInView(options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -50px 0px', triggerOnce = true } = options
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // If browser doesn't support IntersectionObserver, reveal immediately
    if (!('IntersectionObserver' in window)) {
      setIsInView(true)
      return
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        if (triggerOnce) {
          observer.disconnect()
        }
      } else if (!triggerOnce) {
        setIsInView(false)
      }
    }, { threshold, rootMargin })

    observer.observe(el)

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return [ref, isInView]
}

export default useInView
