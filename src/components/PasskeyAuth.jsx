import { useState } from 'react'
import { useAuth } from '../App'

/**
 * Passkey Authentication (WebAuthn)
 * 
 * Flow:
 * 1. User clicks "Sign up" or "Login"
 * 2. Browser prompts for passkey (create or verify)
 * 3. On success, store user in localStorage
 */

export default function PasskeyAuth() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState(null) // 'signup' | 'login'

  const handlePasskey = async (action) => {
    setLoading(true)
    setError(null)
    
    try {
      if (action === 'signup') {
        // Create passkey
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: {
              name: 'AgentVault',
              id: window.location.hostname
            },
            user: {
              id: new Uint8Array(16),
              name: `user_${Date.now()}`,
              displayName: 'AgentVault User'
            },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 },
              { type: 'public-key', alg: -257 }
            ],
            timeout: 60000,
            attestation: 'preferred'
          }
        })
        
        if (credential) {
          // Account created
          login({
            id: credential.id,
            createdAt: Date.now(),
            passkeyId: Array.from(new Uint8Array(credential.rawId))
          })
        }
      } else {
        // Verify passkey
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            rpId: window.location.hostname
          }
        })
        
        if (credential) {
          login({
            id: credential.id,
            lastLogin: Date.now(),
            passkeyId: Array.from(new Uint8Array(credential.rawId))
          })
        }
      }
    } catch (err) {
      console.error('Passkey error:', err)
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  if (!mode) {
    return (
      <div className="container" style={{ paddingTop: '60px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1>🔐 AgentVault</h1>
          <p>Secure crypto agent management</p>
          
          <div style={{ marginTop: '32px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setMode('login')}
              style={{ width: '200px', marginBottom: '12px' }}
            >
              Login with Passkey
            </button>
            <br />
            <button 
              className="btn btn-outline" 
              onClick={() => setMode('signup')}
              style={{ width: '200px' }}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '60px' }}>
      <div className="card">
        <h2>{mode === 'signup' ? 'Create Account' : 'Login'}</h2>
        <p>
          {mode === 'signup' 
            ? 'Create a passkey to secure your wallet and agents'
            : 'Use your passkey to authenticate'
          }
        </p>

        {error && (
          <div className="status error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button 
          className="btn btn-primary" 
          onClick={() => handlePasskey(mode)}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Processing...' : mode === 'signup' ? 'Create Passkey' : 'Authenticate'}
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={() => setMode(null)}
          disabled={loading}
          style={{ width: '100%', marginTop: '8px' }}
        >
          Back
        </button>
      </div>
    </div>
  )
}
