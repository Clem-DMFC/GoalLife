import { useEffect } from 'react'

/*
 * Le verrou est compté, pas empilé. La feuille d'ajout rend la feuille de
 * recherche : les deux verrouillent, et à la fermeture React démonte le parent
 * avant l'enfant. Chacune restaurant « la valeur d'avant elle », l'enfant
 * réappliquait `hidden` après que le parent l'eut retiré — le corps restait
 * bloqué et l'app paraissait figée, jusqu'à relance.
 *
 * Avec un compteur, seul le passage de 1 à 0 restaure le style, quel que soit
 * l'ordre de démontage.
 */
let locks = 0
let previousOverflow = ''

/** Empêche le fond de défiler sous une feuille modale ouverte. */
export function useLockBodyScroll() {
  useEffect(() => {
    if (locks === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    locks += 1

    return () => {
      locks -= 1
      if (locks === 0) document.body.style.overflow = previousOverflow
    }
  }, [])
}
