import { supabase } from './supabase'

/**
 * Photo de profil : redimensionnement côté client, puis dépôt dans le bucket
 * `avatars`.
 *
 * Une photo prise à l'iPhone pèse 3 à 5 Mo pour 4000 px de côté. La servir
 * telle quelle dans une pastille de 44 px gaspillerait la bande passante à
 * chaque ouverture de l'app, et l'envoi échouerait en 4G moyenne. Elle est
 * donc réduite avant d'être envoyée.
 */

export const BUCKET = 'avatars'

/** Côté maximal de l'image stockée. Large pour un avatar, léger à charger. */
export const MAX_SIDE = 512

/** Au delà, on refuse avant même de décoder : c'est une photo, pas une vidéo. */
export const MAX_BYTES = 12 * 1024 * 1024

export class AvatarError extends Error {}

/** Chemin de l'avatar d'un utilisateur. Un seul fichier, écrasé à chaque fois. */
export function avatarPath(userId: string): string {
  return `${userId}/avatar.jpg`
}

/**
 * L'URL publique porte un jeton de version.
 *
 * Le chemin ne changeant jamais, une nouvelle photo garderait la même URL et
 * le navigateur continuerait d'afficher l'ancienne, en cache. Le paramètre
 * force le rechargement sans invalider quoi que ce soit côté serveur.
 */
export function withVersion(url: string, version: number = Date.now()): string {
  return `${url}${url.includes('?') ? '&' : '?'}v=${version}`
}

/** Retire le jeton de version, pour comparer deux URL d'avatar. */
export function withoutVersion(url: string): string {
  return url.split(/[?&]v=/)[0]
}

/**
 * Réduit l'image à un carré de `MAX_SIDE` au plus, recadré au centre.
 *
 * Le recadrage carré évite d'avoir à gérer des proportions dans l'interface :
 * une pastille ronde affiche toujours un carré, autant le décider ici.
 */
export async function resizeToSquare(file: File, side: number = MAX_SIDE): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const source = Math.min(bitmap.width, bitmap.height)
    // Ne jamais agrandir : une petite photo resterait floue et pèserait plus.
    const target = Math.min(side, source)

    const canvas = document.createElement('canvas')
    canvas.width = target
    canvas.height = target
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new AvatarError("Le navigateur n'a pas pu préparer l'image.")

    ctx.drawImage(
      bitmap,
      (bitmap.width - source) / 2,
      (bitmap.height - source) / 2,
      source,
      source,
      0,
      0,
      target,
      target
    )

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    )
    if (!blob) throw new AvatarError("L'image n'a pas pu être convertie.")
    return blob
  } finally {
    bitmap.close()
  }
}

/** Refuse tôt ce qui n'ira pas, avec un motif lisible. */
export function validate(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new AvatarError('Choisis une image.')
  }
  if (file.size > MAX_BYTES) {
    throw new AvatarError('Image trop lourde (12 Mo maximum).')
  }
}

/**
 * Redimensionne, dépose et renvoie l'URL publique versionnée.
 * `upsert` : un second envoi remplace le fichier au lieu d'en empiler un.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  validate(file)
  const blob = await resizeToSquare(file)

  const path = avatarPath(userId)
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  })
  if (error) throw new AvatarError(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return withVersion(data.publicUrl)
}

/** Retire la photo du stockage. L'échec n'est pas bloquant : la colonne fait foi. */
export async function removeAvatar(userId: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([avatarPath(userId)])
}

/** Initiale affichée à défaut de photo. */
export function initial(firstName: string | null, email: string | undefined): string {
  const source = firstName?.trim() || email?.trim() || ''
  return source.charAt(0).toUpperCase() || '?'
}
