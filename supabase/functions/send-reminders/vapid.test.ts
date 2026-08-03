import { beforeAll, describe, expect, test } from 'vitest'
import { vapidKeysToJwk } from './vapid'

/**
 * Les clés VAPID circulent en base64url (format de `web-push
 * generate-vapid-keys`), alors que la librairie d'envoi attend du JWK. Ces
 * tests partent d'une vraie paire P-256 et vérifient que la conversion
 * produit des clés que WebCrypto accepte et qui signent réellement — une
 * erreur ici ne se verrait qu'au moment où aucune notification n'arrive.
 */

const b64url = (buf: ArrayBuffer) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

let publicKey = ''
let privateKey = ''

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])
  // `raw` d'une clé publique EC = point non compressé de 65 octets.
  publicKey = b64url(await crypto.subtle.exportKey('raw', pair.publicKey))
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey)
  privateKey = jwk.d!
})

describe('vapidKeysToJwk', () => {
  test('produit des JWK que WebCrypto importe et qui signent', async () => {
    const keys = vapidKeysToJwk(publicKey, privateKey)

    const priv = await crypto.subtle.importKey(
      'jwk',
      keys.privateKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    )
    const pub = await crypto.subtle.importKey(
      'jwk',
      keys.publicKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    )

    const message = new TextEncoder().encode('goatly')
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      priv,
      message
    )
    // La signature de la privée se vérifie avec la publique : les deux JWK
    // décrivent bien la même paire.
    expect(
      await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, signature, message)
    ).toBe(true)
  })

  test('la clé publique conserve la courbe et le type attendus', () => {
    const keys = vapidKeysToJwk(publicKey, privateKey)
    expect(keys.publicKey).toMatchObject({ kty: 'EC', crv: 'P-256' })
    expect(keys.privateKey.d).toBe(privateKey)
    // La publique ne doit jamais embarquer le scalaire privé.
    expect(keys.publicKey).not.toHaveProperty('d')
  })

  test('rejette une clé publique de mauvaise taille', () => {
    expect(() => vapidKeysToJwk('AAAA', privateKey)).toThrow(/VAPID_PUBLIC_KEY/)
  })

  test('rejette un préfixe de point invalide', () => {
    // Bonne longueur, mais préfixe 0x02 (point compressé) au lieu de 0x04.
    const bytes = Buffer.from(
      publicKey.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    )
    bytes[0] = 0x02
    const compressed = bytes
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(() => vapidKeysToJwk(compressed, privateKey)).toThrow(/65 octets/)
  })

  test('rejette une clé privée de mauvaise taille', () => {
    expect(() => vapidKeysToJwk(publicKey, 'AAAA')).toThrow(/VAPID_PRIVATE_KEY/)
  })
})
