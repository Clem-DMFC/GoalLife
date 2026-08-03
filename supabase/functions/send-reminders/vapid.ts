/**
 * Conversion des clés VAPID au format JWK.
 *
 * Les générateurs courants (`npx web-push generate-vapid-keys`, le panneau de
 * la plupart des services) rendent deux chaînes base64url : la clé publique
 * est un point P-256 non compressé de 65 octets (`0x04 || X || Y`), la clé
 * privée le scalaire de 32 octets. La librairie d'envoi, elle, attend du JWK.
 *
 * On convertit ici plutôt que d'imposer un format de secret exotique : la
 * clé publique stockée reste celle que le client passe à `applicationServerKey`,
 * un seul et même texte des deux côtés.
 */

function decodeBase64Url(s: string): Uint8Array {
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function encodeBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export type ExportedVapidKeys = {
  publicKey: JsonWebKey
  privateKey: JsonWebKey
}

/**
 * Construit la paire JWK à partir des deux clés base64url.
 * Lève si le format ne colle pas — mieux vaut échouer au démarrage de la
 * fonction qu'envoyer des notifications signées n'importe comment.
 */
export function vapidKeysToJwk(publicKey: string, privateKey: string): ExportedVapidKeys {
  const pub = decodeBase64Url(publicKey)
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error(
      `VAPID_PUBLIC_KEY invalide : attendu un point P-256 non compressé de 65 octets, reçu ${pub.length}.`
    )
  }

  const priv = decodeBase64Url(privateKey)
  if (priv.length !== 32) {
    throw new Error(
      `VAPID_PRIVATE_KEY invalide : attendu 32 octets, reçu ${priv.length}.`
    )
  }

  const x = encodeBase64Url(pub.slice(1, 33))
  const y = encodeBase64Url(pub.slice(33, 65))

  return {
    publicKey: { kty: 'EC', crv: 'P-256', x, y, ext: true },
    privateKey: { kty: 'EC', crv: 'P-256', x, y, d: encodeBase64Url(priv), ext: true },
  }
}
