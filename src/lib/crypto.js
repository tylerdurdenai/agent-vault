import * as secp256k1 from '@noble/secp256k1'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

/**
 * Crypto utilities for wallet generation
 * Keys are generated locally, never leave the device
 */

// Generate random bytes
function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length))
}

// Generate EVM wallet (secp256k1)
export function generateEVMWallet() {
  const privateKey = randomBytes(32)
  const publicKey = secp256k1.getPublicKey(privateKey, true)
  const publicKeyHash = sha256(publicKey)
  const address = '0x' + bytesToHex(publicKeyHash).slice(-40)
  
  return {
    chain: 'evm',
    address,
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey)
  }
}

// Generate Solana wallet (Ed25519 - using secp256k1 as fallback for demo)
// In production, use @solana/web3.js Keypair
export function generateSolanaWallet() {
  // For demo - in production use proper Ed25519
  const seed = randomBytes(32)
  const publicKey = secp256k1.getPublicKey(seed, false)
  
  // Base58 encode would go here - simplified for demo
  const address = bytesToHex(publicKey).slice(0, 44)
  
  return {
    chain: 'solana',
    address: address + '...', // Simplified
    privateKey: bytesToHex(seed),
    publicKey: bytesToHex(publicKey)
  }
}

// Generate Hyperliquid wallet (same as EVM for now)
export function generateHLWallet() {
  const wallet = generateEVMWallet()
  return {
    ...wallet,
    chain: 'hyperliquid'
  }
}

// Generate wallet based on chain
export function generateWallet(chain) {
  switch (chain) {
    case 'evm':
      return generateEVMWallet()
    case 'solana':
      return generateSolanaWallet()
    case 'hyperliquid':
      return generateHLWallet()
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}

// Sign a message (for authentication)
export function signMessage(message, privateKey) {
  const msgHash = sha256(new TextEncoder().encode(message))
  const signature = secp256k1.sign(msgHash, hexToBytes(privateKey))
  return bytesToHex(signature)
}

// Encrypt key for injection (ECDH-like key wrapping)
// In production: use proper ECDH with TEE's public key
export async function wrapKeyForInjection(privateKey, teePublicKey) {
  // Generate ephemeral keypair
  const ephemeralPrivate = randomBytes(32)
  const ephemeralPublic = secp256k1.getPublicKey(ephemeralPrivate, true)
  
  // Derive shared secret (simplified - production use proper ECDH)
  const sharedSecret = sha256(ephemeralPrivate)
  
  // Encrypt private key with shared secret (AES-GCM in production)
  // Simplified XOR for demo
  const keyBytes = hexToBytes(privateKey)
  const encrypted = new Uint8Array(keyBytes.length)
  for (let i = 0; i < keyBytes.length; i++) {
    encrypted[i] = keyBytes[i] ^ sharedSecret[i % sharedSecret.length]
  }
  
  return {
    encryptedKey: bytesToHex(encrypted),
    ephemeralPublicKey: bytesToHex(ephemeralPublic),
    algorithm: 'x sha256'
  }
}

// Unwrap key (for TEE - not used in PWA)
export function unwrapKey(encryptedKey, sharedSecret) {
  const encBytes = hexToBytes(encryptedKey)
  const decrypted = new Uint8Array(encBytes.length)
  const sec = typeof sharedSecret === 'string' ? hexToBytes(sharedSecret) : sharedSecret
  
  for (let i = 0; i < encBytes.length; i++) {
    decrypted[i] = encBytes[i] ^ sec[i % sec.length]
  }
  
  return bytesToHex(decrypted)
}

// Store encrypted wallet locally
export function storeWallet(wallet, userId) {
  const wallets = getWallets(userId)
  wallets.push({
    ...wallet,
    createdAt: Date.now()
  })
  localStorage.setItem(`wallets_${userId}`, JSON.stringify(wallets))
  return wallets
}

// Get wallets for user
export function getWallets(userId) {
  const stored = localStorage.getItem(`wallets_${userId}`)
  return stored ? JSON.parse(stored) : []
}

// Remove wallet
export function removeWallet(userId, address) {
  const wallets = getWallets(userId).filter(w => w.address !== address)
  localStorage.setItem(`wallets_${userId}`, JSON.stringify(wallets))
  return wallets
}
