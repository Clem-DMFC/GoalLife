import { describe, expect, test } from 'vitest'
import {
  AvatarError,
  avatarPath,
  initial,
  MAX_BYTES,
  validate,
  withoutVersion,
  withVersion,
} from './avatar'

describe('avatarPath', () => {
  test('range la photo dans le dossier de son propriétaire', () => {
    // Les policies Storage comparent ce premier segment à auth.uid() : un
    // chemin sans dossier ferait échouer toute écriture.
    expect(avatarPath('abc-123')).toBe('abc-123/avatar.jpg')
  })
})

describe('withVersion', () => {
  test('ajoute un jeton pour casser le cache du navigateur', () => {
    // Le chemin ne change jamais : sans jeton, une nouvelle photo garderait
    // l'URL de l'ancienne et le navigateur n'irait pas la rechercher.
    expect(withVersion('https://x/y/avatar.jpg', 42)).toBe('https://x/y/avatar.jpg?v=42')
  })

  test('respecte une URL qui porte déjà des paramètres', () => {
    expect(withVersion('https://x/a.jpg?token=1', 42)).toBe('https://x/a.jpg?token=1&v=42')
  })

  test('le jeton se retire pour comparer deux URL', () => {
    const url = 'https://x/y/avatar.jpg'
    expect(withoutVersion(withVersion(url, 7))).toBe(url)
    expect(withoutVersion(url)).toBe(url)
  })

  test('deux envois successifs produisent des URL différentes', () => {
    expect(withVersion('https://x/a.jpg', 1)).not.toBe(withVersion('https://x/a.jpg', 2))
  })
})

describe('validate', () => {
  const file = (type: string, size: number) =>
    ({ type, size, name: 'photo' }) as unknown as File

  test('accepte une image de taille raisonnable', () => {
    expect(() => validate(file('image/jpeg', 2_000_000))).not.toThrow()
    expect(() => validate(file('image/heic', 4_000_000))).not.toThrow()
  })

  test('refuse ce qui n’est pas une image', () => {
    expect(() => validate(file('application/pdf', 1000))).toThrow(AvatarError)
    expect(() => validate(file('video/mp4', 1000))).toThrow(/Choisis une image/)
  })

  test('refuse un fichier trop lourd avant même de le décoder', () => {
    expect(() => validate(file('image/jpeg', MAX_BYTES + 1))).toThrow(/12 Mo/)
  })
})

describe('initial', () => {
  test('prend la première lettre du prénom, en majuscule', () => {
    expect(initial('clément', 'x@y.fr')).toBe('C')
  })

  test('retombe sur l’email quand le prénom manque', () => {
    expect(initial(null, 'esteves@gmail.com')).toBe('E')
    expect(initial('   ', 'esteves@gmail.com')).toBe('E')
  })

  test('ne rend jamais une pastille vide', () => {
    expect(initial(null, undefined)).toBe('?')
    expect(initial('', '')).toBe('?')
  })
})
