import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

// In-memory store (use database in production)
const keys = new Map()
const grants = new Map()

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

/**
 * TEE Attestation endpoint
 * In production: returns real attestation from Nitro Enclave
 */
app.get('/attestation', (req, res) => {
  res.json({
    publicKey: '0x' + '0'.repeat(64), // Placeholder
    enclaveId: 'enclave_' + Date.now(),
    pcr0: process.env.TEE_PCR0 || 'development',
    verified: true
  })
})

/**
 * Key Injection endpoint
 * Receives wrapped key, stores in TEE memory
 */
app.post('/inject', (req, res) => {
  const { agent_id, chain, wrapped_key, ephemeral_pubkey, algorithm, nonce } = req.body
  
  // In production: 
  // 1. Verify nonce hasn't been used
  // 2. Decrypt wrapped_key inside TEE
  // 3. Store in TEE memory, bind to agent_id
  
  const keyId = `${agent_id}_${chain}`
  keys.set(keyId, {
    wrappedKey: wrapped_key,
    ephemeralPubkey: ephemeral_pubkey,
    algorithm,
    injectedAt: Date.now()
  })
  
  console.log(`[inject] Key injected for ${keyId}`)
  
  res.json({
    success: true,
    key_id: keyId,
    injected_at: Date.now()
  })
})

/**
 * Sign transaction (Mode A - requires approval)
 */
app.post('/sign', async (req, res) => {
  const { agent_id, chain, tx, approval_token } = req.body
  
  const keyId = `${agent_id}_${chain}`
  const keyData = keys.get(keyId)
  
  if (!keyData) {
    return res.status(404).json({ error: 'Key not found for agent' })
  }
  
  // Mode A: Verify approval token
  if (!approval_token) {
    return res.status(403).json({ 
      error: 'Mode A requires approval_token',
      mode: 'A'
    })
  }
  
  // In production:
  // 1. Verify approval_token signature (passkey)
  // 2. Sign tx inside TEE
  // 3. Return signature
  
  console.log(`[sign] Signing tx for ${keyId}`)
  
  res.json({
    success: true,
    signature: '0x' + '0'.repeat(130), // Placeholder
    tx_hash: '0x' + '0'.repeat(64),
    signed_at: Date.now()
  })
})

/**
 * Auto-sign (Mode B - within grant limits)
 */
app.post('/auto-sign', async (req, res) => {
  const { agent_id, chain, tx } = req.body
  
  const keyId = `${agent_id}_${chain}`
  const keyData = keys.get(keyId)
  const grant = grants.get(agent_id)
  
  if (!keyData) {
    return res.status(404).json({ error: 'Key not found for agent' })
  }
  
  if (!grant) {
    return res.status(403).json({ 
      error: 'No grant found for agent',
      mode: 'B'
    })
  }
  
  // Check grant limits
  const txValueUsd = parseFloat(tx.value_usd || 0)
  if (txValueUsd > grant.max_per_tx_usd) {
    return res.status(403).json({ 
      error: 'Transaction exceeds per-tx limit',
      max_allowed: grant.max_per_tx_usd,
      requested: txValueUsd
    })
  }
  
  if (grant.used_usd + txValueUsd > grant.max_amount_usd) {
    return res.status(403).json({ 
      error: 'Transaction would exceed total grant limit',
      remaining: grant.max_amount_usd - grant.used_usd,
      requested: txValueUsd
    })
  }
  
  // Update grant usage
  grant.used_usd += txValueUsd
  grants.set(agent_id, grant)
  
  console.log(`[auto-sign] Auto-signed tx for ${keyId}, value: $${txValueUsd}`)
  
  res.json({
    success: true,
    signature: '0x' + '0'.repeat(130),
    tx_hash: '0x' + '0'.repeat(64),
    signed_at: Date.now(),
    grant_remaining: grant.max_amount_usd - grant.used_usd
  })
})

/**
 * Create/Update grant (Mode B policy)
 */
app.post('/grant', (req, res) => {
  const { agent_id, policy } = req.body
  
  grants.set(agent_id, {
    ...policy,
    used_usd: 0,
    created_at: Date.now()
  })
  
  console.log(`[grant] Grant created for ${agent_id}: $${policy.max_amount_usd}`)
  
  res.json({
    success: true,
    agent_id,
    policy: grants.get(agent_id)
  })
})

/**
 * Revoke agent binding
 */
app.post('/revoke', (req, res) => {
  const { agent_id } = req.body
  
  // Remove keys
  for (const [keyId] of keys) {
    if (keyId.startsWith(agent_id)) {
      keys.delete(keyId)
    }
  }
  
  // Remove grants
  grants.delete(agent_id)
  
  console.log(`[revoke] Agent ${agent_id} revoked`)
  
  res.json({ success: true, agent_id })
})

/**
 * Get agent status
 */
app.get('/agents/:agentId', (req, res) => {
  const { agentId } = req.params
  const grant = grants.get(agentId)
  
  let boundChains = []
  for (const [keyId] of keys) {
    if (keyId.startsWith(agentId)) {
      boundChains.push(keyId.split('_')[1])
    }
  }
  
  res.json({
    agent_id: agentId,
    bound_chains: boundChains,
    grant: grant || null
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`AgentVault API running on port ${PORT}`)
})
