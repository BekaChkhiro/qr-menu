import { randomBytes } from 'node:crypto';

// Excludes 0/O/1/I/L to avoid handwriting / OCR ambiguity on printed QR cards.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a URL-safe, unambiguous table code. 8 chars from a 31-char alphabet
 * gives ≈ 38 bits of entropy, more than enough for collision-resistance against
 * the small number of OPEN tables likely to coexist on one menu.
 */
export function generateTableCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
