import { useState } from 'react'
import { initial } from '../lib/avatar'

/**
 * Pastille de profil : la photo si elle existe, sinon l'initiale sur fond
 * lime. Le repli couvre aussi une URL cassée — une photo supprimée du
 * stockage ne doit pas laisser un carré vide.
 */
export function Avatar({
  url,
  firstName,
  email,
  size = 44,
}: {
  url: string | null
  firstName: string | null
  email?: string
  size?: number
}) {
  const [broken, setBroken] = useState(false)
  const letter = initial(firstName, email)

  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-[#0E1300]"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {letter}
    </div>
  )
}
