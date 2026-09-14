/**
 * Watch Club Loyalty & POS System - Cryptographic Security Engine
 * Native Web Crypto API PBKDF2 (100,000 iterations, SHA-256, 16-byte random salt)
 */

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback if needed
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bufferToHex(bytes);
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (subtle) is not available in this environment');
}

/**
 * Derives a PBKDF2 hash from a 6-digit PIN using SHA-256 and 100,000 iterations.
 * @param pin 6-digit numeric string
 * @param saltHex Optional 16-byte hex salt; if not provided, a random 16-byte salt is generated.
 */
export async function hashPin(
  pin: string, 
  saltHex?: string
): Promise<{ hashHex: string; saltHex: string }> {
  const cleanPin = pin.trim();
  if (!cleanPin || cleanPin.length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }

  const salt = saltHex || generateSalt(16);
  const saltBytes = hexToBuffer(salt);
  const subtle = getSubtleCrypto();

  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(cleanPin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );

  const hashHex = bufferToHex(derivedBits);
  return { hashHex, saltHex: salt };
}

/**
 * Deterministically verifies an entered PIN against a stored salt and expected hash.
 * Includes constant-time comparison to prevent side-channel timing attacks.
 */
export async function verifyPin(
  pin: string, 
  saltHex: string, 
  expectedHashHex: string
): Promise<boolean> {
  if (!pin || !saltHex || !expectedHashHex) return false;
  try {
    const { hashHex } = await hashPin(pin, saltHex);
    if (hashHex.length !== expectedHashHex.length) return false;
    
    // Timing-safe comparison
    let diff = 0;
    for (let i = 0; i < hashHex.length; i++) {
      diff |= hashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.error('Error verifying PIN:', err);
    return false;
  }
}
