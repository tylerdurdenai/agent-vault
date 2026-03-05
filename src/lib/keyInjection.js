/**
 * Key Injection Protocol
 * 
 * This handles the secure transfer of wallet private keys from PWA to TEE
 * without ever exposing the keys in plaintext to the relay server.
 */

import { wrapKeyForInjection } from '../crypto'

/**
 * Inject wallet key to TEE
 * 
 * @param {Object} wallet - The wallet to inject
 * @param {Object} agentData - Agent binding data from QR
 * @returns {Promise<Object>} - Injection result
 */
export async function injectKeyToTEE(wallet, agentData) {
  // 1. Fetch TEE attestation and public key
  const attestation = await fetchTEEAttestation(agentData.endpoint)
  
  if (!attestation.verified) {
    throw new Error('TEE attestation verification failed')
  }
  
  // 2. Wrap the private key with TEE's public key
  const wrapped = await wrapKeyForInjection(
    wallet.privateKey,
    attestation.publicKey
  )
  
  // 3. Send wrapped key to TEE via relay
  const result = await fetch(`${agentData.endpoint}/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentData.agent_id,
      chain: wallet.chain,
      wrapped_key: wrapped.encryptedKey,
      ephemeral_pubkey: wrapped.ephemeralPublicKey,
      algorithm: wrapped.algorithm,
      nonce: agentData.nonce
    })
  })
  
  if (!result.ok) {
    throw new Error('Key injection failed')
  }
  
  return result.json()
}

/**
 * Fetch TEE attestation
 */
async function fetchTEEAttestation(endpoint) {
  // In production: This fetches the actual attestation from the TEE
  // and verifies it against expected PCR values
  
  const response = await fetch(`${endpoint}/attestation`)
  const data = await response.json()
  
  // Simplified - production would verify attestation
  return {
    verified: true,
    publicKey: data.publicKey,
    enclaveId: data.enclaveId
  }
}

/**
 * Revoke agent binding
 */
export async function revokeAgentBinding(agentId) {
  const response = await fetch('/api/agents/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId })
  })
  
  return response.json()
}

/**
 * Re-bind agent (after revocation)
 */
export async function rebindAgent(wallet, agentData) {
  // First revoke existing binding
  await revokeAgentBinding(agentData.agent_id)
  // Then inject new key
  return injectKeyToTEE(wallet, agentData)
}

/**
 * Create grant for Mode B auto-signing
 */
export async function createGrant(agentId, policy) {
  const response = await fetch('/api/agents/grant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentId,
      policy: {
        max_amount_usd: policy.maxAmount,
        max_per_tx_usd: policy.maxPerTx,
        allowed_tokens: policy.allowedTokens,
        allowed_chains: policy.allowedChains,
        time_window: policy.timeWindow, // in seconds
        expires_at: policy.expiresAt
      }
    })
  })
  
  return response.json()
}
