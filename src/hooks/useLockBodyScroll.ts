import { useEffect } from 'react'

/** Empêche le fond de défiler sous une feuille modale ouverte. */
export function useLockBodyScroll() {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])
}
