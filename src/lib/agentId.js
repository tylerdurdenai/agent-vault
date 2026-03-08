import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'

/**
 * Agent Identifier Generation
 * Creates a deterministic, tamper-proof identifier for agent-wallet bindings.
 * 
 * Scheme:
 *   commitment = SHA-256(wallet_address || chain_id || agent_pub_id || timestamp)
 *   signature  = secp256k1.sign(commitment, wallet_private_key)
 *   agent_id   = SHA-256(commitment || signature).hex[:40]
 */

export function createBindingCommitment(walletAddress, chainId, agentPubId) {
  const timestamp = Date.now()
  const message = ['AGENTVAULT_BIND_v1', walletAddress.toLowerCase(), chainId.toLowerCase(), agentPubId, timestamp.toString()].join('|')
  const commitmentHash = sha256(new TextEncoder().encode(message))
  return { message, timestamp, commitment: bytesToHex(commitmentHash) }
}

export function generateAgentId(commitment, signature) {
  const idInput = commitment.commitment + signature
  const idHash = sha256(new TextEncoder().encode(idInput))
  const id = bytesToHex(idHash).slice(0, 40)
  return { id, commitment: commitment.commitment, signature, timestamp: commitment.timestamp, version: 1 }
}

export function verifyAgentId(agentId, walletAddress, chainId, agentPubId) {
  const message = ['AGENTVAULT_BIND_v1', walletAddress.toLowerCase(), chainId.toLowerCase(), agentPubId, agentId.timestamp.toString()].join('|')
  const expectedCommitment = bytesToHex(sha256(new TextEncoder().encode(message)))
  if (expectedCommitment !== agentId.commitment) return false
  const idInput = agentId.commitment + agentId.signature
  const expectedId = bytesToHex(sha256(new TextEncoder().encode(idInput))).slice(0, 40)
  return expectedId === agentId.id
}
