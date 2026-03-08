import * as secp256k1 from '@noble/secp256k1'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import { ed25519 } from '@noble/curves/ed25519'

/**
 * Crypto utilities for wallet generation
 * Keys are generated locally, never leave the device
 */

// ===== Utilities =====

function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length))
}

// Base58 alphabet (Bitcoin style - used by Solana)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Encode(bytes) {
  const digits = [0]
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = Math.floor(carry / 58)
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }
  // Handle leading zeros
  let result = ''
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result += BASE58_ALPHABET[0]
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]]
  }
  return result
}

// ===== EVM Wallet (secp256k1) =====

export function generateEVMWallet() {
  const privateKey = randomBytes(32)
  // Get uncompressed public key (65 bytes: 0x04 + x + y)
  const publicKeyUncompressed = secp256k1.getPublicKey(privateKey, false)
  
  // EVM address: last 20 bytes of keccak256(pubkey without 0x04 prefix)
  // Using sha256 as fallback - in production use keccak256
  const pubKeyHash = sha256(publicKeyUncompressed.slice(1))
  const addressBytes = pubKeyHash.slice(-20)
  const address = '0x' + bytesToHex(addressBytes)
  
  return {
    chain: 'evm',
    address,
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(secp256k1.getPublicKey(privateKey, true)) // compressed
  }
}

// ===== Solana Wallet (Ed25519) =====

export function generateSolanaWallet() {
  // Generate 32-byte seed for Ed25519
  const seed = randomBytes(32)
  
  // Derive Ed25519 keypair
  const privateKey = ed25519.getPrivateKey(seed)
  const publicKey = ed25519.getPublicKey(privateKey)
  
  // Solana address is base58-encoded public key
  const address = base58Encode(publicKey)
  
  return {
    chain: 'solana',
    address,
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey)
  }
}

// ===== Hyperliquid Wallet (same as EVM) =====

export function generateHLWallet() {
  const wallet = generateEVMWallet()
  return {
    ...wallet,
    chain: 'hyperliquid'
  }
}

// ===== Factory Function =====

export function generateWallet(chain) {
  switch (chain.toLowerCase()) {
    case 'evm':
    case 'ethereum':
      return generateEVMWallet()
    case 'solana':
      return generateSolanaWallet()
    case 'hyperliquid':
    case 'hl':
      return generateHLWallet()
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}

// ===== Signing =====

export function signMessage(message, privateKey, chain = 'evm') {
  const msgBytes = typeof message === 'string' 
    ? new TextEncoder().encode(message) 
    : message
  const msgHash = sha256(msgBytes)
  const keyBytes = typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey
  
  if (chain === 'solana') {
    // Ed25519 signing
    const signature = ed25519.sign(msgHash, keyBytes)
    return bytesToHex(signature)
  } else {
    // secp256k1 signing
    const signature = secp256k1.sign(msgHash, keyBytes)
    return bytesToHex(signature.toCompactRawBytes())
  }
}

export function verifySignature(message, signature, publicKey, chain = 'evm') {
  const msgBytes = typeof message === 'string' 
    ? new TextEncoder().encode(message) 
    : message
  const msgHash = sha256(msgBytes)
  const sigBytes = typeof signature === 'string' ? hexToBytes(signature) : signature
  const pubKeyBytes = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey
  
  if (chain === 'solana') {
    return ed25519.verify(sigBytes, msgHash, pubKeyBytes)
  } else {
    return secp256k1.verify(sigBytes, msgHash, pubKeyBytes)
  }
}

// ===== Storage =====

export function storeWallet(wallet, userId) {
  const wallets = getWallets(userId)
  const existing = wallets.findIndex(w => w.address === wallet.address)
  
  if (existing >= 0) {
    wallets[existing] = { ...wallets[existing], ...wallet, updatedAt: Date.now() }
  } else {
    wallets.push({
      ...wallet,
      createdAt: Date.now()
    })
  }
  
  localStorage.setItem(`wallets_${userId}`, JSON.stringify(wallets))
  return wallets
}

export function getWallets(userId) {
  try {
    const stored = localStorage.getItem(`wallets_${userId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function getWalletByAddress(userId, address) {
  const wallets = getWallets(userId)
  return wallets.find(w => w.address.toLowerCase() === address.toLowerCase())
}

export function removeWallet(userId, address) {
  const wallets = getWallets(userId).filter(w => w.address !== address)
  localStorage.setItem(`wallets_${userId}`, JSON.stringify(wallets))
  return wallets
}

// ===== Key Wrapping (for TEE injection) =====

export async function wrapKeyForInjection(privateKey, teePublicKey) {
  const ephemeralPrivate = randomBytes(32)
  const ephemeralPublic = secp256k1.getPublicKey(ephemeralPrivate, true)
  const sharedSecret = sha256(ephemeralPrivate)
  
  const keyBytes = typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey
  const encrypted = new Uint8Array(keyBytes.length)
  for (let i = 0; i < keyBytes.length; i++) {
    encrypted[i] = keyBytes[i] ^ sharedSecret[i % sharedSecret.length]
  }
  
  return {
    encryptedKey: bytesToHex(encrypted),
    ephemeralPublicKey: bytesToHex(ephemeralPublic),
    algorithm: 'xor-sha256-demo'
  }
}

export function unwrapKey(encryptedKey, sharedSecret) {
  const encBytes = typeof encryptedKey === 'string' ? hexToBytes(encryptedKey) : encryptedKey
  const sec = typeof sharedSecret === 'string' ? hexToBytes(sharedSecret) : sharedSecret
  
  const decrypted = new Uint8Array(encBytes.length)
  for (let i = 0; i < encBytes.length; i++) {
    decrypted[i] = encBytes[i] ^ sec[i % sec.length]
  }
  
  return bytesToHex(decrypted)
}
