import { useEffect, useMemo, useState } from 'react'
import { mergeFoods } from '../lib/foodSearch'
import { searchLocalFoods } from '../lib/localFoods'
import { searchFoods, SearchError, type Food } from '../lib/openfoodfacts'

/**
 * Recherche fusionnée : la base locale répond à chaque frappe, de façon
 * synchrone — c'est le socle fiable pour les aliments bruts. Open Food Facts
 * arrive ensuite, débouncé (le réseau ne doit pas partir à chaque lettre).
 *
 * L'erreur réseau ne s'affiche que si la base locale n'a elle non plus rien
 * trouvé : `results` fusionne les deux, donc un échec d'OFF derrière des
 * résultats locaux ne remonte jamais comme une panne.
 */
export function useFoodSearch(query: string) {
  const [offResults, setOffResults] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)
  // Brut : le motif exact de l'échec OFF, avant application de la règle
  // d'affichage. `error` (exposé plus bas) est ce qu'on montre réellement.
  const [offError, setOffError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  // Pas de debounce ici : c'est un scan en mémoire, pas un appel réseau.
  const localResults = useMemo(() => searchLocalFoods(query), [query])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setOffResults([])
      setOffError(null)
      setSearching(false)
      return
    }

    const controller = new AbortController()
    setSearching(true)
    setTouched(true)
    // L'erreur précédente disparaît dès qu'une nouvelle recherche part :
    // sinon elle restait affichée au dessus des résultats qui arrivaient.
    setOffError(null)

    const timer = setTimeout(() => {
      searchFoods(term, controller.signal)
        .then((foods) => {
          if (controller.signal.aborted) return
          setOffResults(foods)
          setOffError(null)
          setSearching(false)
        })
        .catch((err: unknown) => {
          // Une requête annulée appartient à une frappe périmée : elle ne doit
          // toucher ni aux résultats, ni à l'état de chargement en cours.
          if (controller.signal.aborted) return
          setOffResults([])
          setOffError(
            err instanceof SearchError
              ? err.message
              : 'Recherche injoignable. Vérifie ta connexion, ou saisis les valeurs à la main.'
          )
          setSearching(false)
        })
    }, 400)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  const results = useMemo(() => mergeFoods(localResults, offResults), [localResults, offResults])

  // La règle demandée : une panne OFF ne s'affiche que si la base locale n'a
  // elle non plus rien trouvé. `results` fusionne déjà les deux sources — un
  // appelant n'a donc pas besoin de refaire ce calcul lui-même.
  const error = results.length === 0 ? offError : null

  return { results, searching, error, touched }
}
