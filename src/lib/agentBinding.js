import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'

/**
 * Agent Binding Utilities
 * 
 * Deterministic, tamper-proof agent identifiers
 * Agent ID = hash(agent_pubkey || wallet_address || chain_id || nonce)
 */

export function computeAgentId(agentPubkey, walletAddress, chain, nonce) {
  const pubkey = normalizePubkey(agentPubkey)
  const wallet = normalizeAddress(walletAddress)
  const chainId = getChainId(chain)
  
  const message = `${pubkey}:${wallet}:${chainId}:${nonce}`
  const msgBytes = new TextEncoder().encode(message)
  const hash = sha256(msgBytes)
  
  return '0x' + bytesToHex(hash)
}

export function createBindingCommitment(agentId, walletAddress, chain, permissions, expiry) {
  return JSON.stringify({
    agent_id: agentId,
    wallet: walletAddress,
    chain,
    permissions: permissions || ['sign', 'send'],
    expiry: expiry || Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    timestamp: Date.now()
  })
}

export function verifyBinding(agentId, agentPubkey, walletAddress, chain, nonce) {
  const computed = computeAgentId(agentPubkey, walletAddress, chain, nonce)
  return computed === agentId
}

function getChainId(chain) {
  const chainIds = {
    evm: 1,
    ethereum: 1,
    base: 8453,
    arbitrum: 42161,
    polygon: 137,
    optimism: 10,
    solana: 'solana-mainnet',
    hyperliquid: 'hyperliquid-mainnet'
  }
  return chainIds[chain?.toLowerCase()] || chain
}

function normalizePubkey(pubkey) {
  if (!pubkey) return ''
  if (pubkey.startsWith('0x')) return pubkey.slice(2).toLowerCase()
  return pubkey.toLowerCase()
}

function normalizeAddress(address) {
  if (!address) return ''
  return address.toLowerCase()
}

export function generateNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function createAgentQRData(agentId, agentPubkey, chain, name) {
  return JSON.stringify({
    type: 'agent_binding',
    version: 1,
    agent_id: agentId,
    agent_pubkey: agentPubkey,
    chain,
    name,
    nonce: generateNonce(),
    timestamp: Date.now()
  })
}
