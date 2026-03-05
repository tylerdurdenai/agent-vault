import { useState } from 'react'
import { useAuth } from '../App'

export default function PasskeyAuth() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState(null)

  const handlePasskey = async (action) => {
    setLoading(true)
    setError(null)
    
    try {
      if (action === 'signup') {
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
          login({
            id: credential.id,
            createdAt: Date.now(),
            passkeyId: Array.from(new Uint8Array(credential.rawId))
          })
        }
      } else {
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
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 30% -10%, var(--decorative-purple) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 80% 70%, var(--decorative-pink) 0%, transparent 40%), var(--surface)',
        padding: '24px'
      }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}>
          <div style={{ marginBottom: '8px' }}>
            <span className="header-logo" style={{ width: '56px', height: '56px', fontSize: '24px', display: 'inline-flex', borderRadius: 'var(--corner-list-item)' }}>A</span>
          </div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '28px', letterSpacing: '-0.04em', marginBottom: '8px' }}>
            Agent<span style={{ color: 'var(--tyler-red)' }}>Vault</span>
          </h1>
          <p style={{ fontSize: '16px', marginBottom: '32px' }}>Secure crypto agent management</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setMode('login')}
              style={{ width: '100%', padding: '16px 28px', fontSize: '16px' }}
            >
              Login with Passkey
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => setMode('signup')}
              style={{ width: '100%', padding: '16px 28px', fontSize: '16px' }}
            >
              Create Account
            </button>
          </div>

          <p style={{ fontSize: '12px', marginTop: '24px', color: 'var(--text-secondary)', marginBottom: 0 }}>
            Keys never leave your device. Secured by WebAuthn.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 30% -10%, var(--decorative-purple) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 80% 70%, var(--decorative-pink) 0%, transparent 40%), var(--surface)',
      padding: '24px'
    }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="section-icon">
          {mode === 'signup' ? '🆕' : '🔐'}
        </div>
        <h2>{mode === 'signup' ? 'Create Account' : 'Login'}</h2>
        <p>
          {mode === 'signup' 
            ? 'Create a passkey to secure your wallet and agents'
            : 'Use your passkey to authenticate'
          }
        </p>

        {error && (
          <div style={{ marginBottom: '16px' }}>
            <span className="status error">{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => handlePasskey(mode)}
            disabled={loading}
            style={{ width: '100%', padding: '16px 28px' }}
          >
            {loading ? 'Processing...' : mode === 'signup' ? 'Create Passkey' : 'Authenticate'}
          </button>

          <button 
            className="btn btn-outline" 
            onClick={() => setMode(null)}
            disabled={loading}
            style={{ width: '100%', padding: '16px 28px' }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
