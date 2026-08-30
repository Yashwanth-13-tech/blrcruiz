import React from 'react'
import { useInView } from '../hooks/useInView.js'

export default function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'none'
  duration = 600,
}) {
  const [ref, isInView] = useInView()

  const getTransform = () => {
    if (isInView) return 'translate3d(0, 0, 0)'
    switch (direction) {
      case 'up':
        return 'translate3d(0, 24px, 0)'
      case 'down':
        return 'translate3d(0, -24px, 0)'
      case 'left':
        return 'translate3d(24px, 0, 0)'
      case 'right':
        return 'translate3d(-24px, 0, 0)'
      case 'none':
      default:
        return 'translate3d(0, 0, 0)'
    }
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: isInView ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
