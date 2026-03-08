import { useState } from 'react'
import { useAuth } from '../App'

export default function PasskeyAuth() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePasskey = async (action) => {
    setLoading(true); setError(null)
    try {
      if (action === 'signup') {
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { name: 'AgentVault', id: window.location.hostname },
            user: { id: crypto.getRandomValues(new Uint8Array(16)), name: `user_${Date.now()}`, displayName: 'AgentVault User' },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
            timeout: 60000, attestation: 'preferred',
            authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'required' }
          }
        })
        if (credential) login({ id: credential.id, createdAt: Date.now(), passkeyId: Array.from(new Uint8Array(credential.rawId)) })
      } else {
        const credential = await navigator.credentials.get({
          publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), timeout: 60000, rpId: window.location.hostname, userVerification: 'required' }
        })
        if (credential) login({ id: credential.id, lastLogin: Date.now(), passkeyId: Array.from(new Uint8Array(credential.rawId)) })
      }
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Authentication cancelled or timed out' : err.message || 'Authentication failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse 80% 50% at 30% 0%, var(--decorative-purple) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 80%, var(--decorative-pink) 0%, transparent 40%), var(--surface)' }}>
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: 380 }}>
        <div className="text-center mb-lg">
          <div className="app-header-mark" style={{ width: 56, height: 56, fontSize: 24, borderRadius: 18, margin: '0 auto 16px' }}>A</div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 32, letterSpacing: '-0.04em', marginBottom: 4 }}>Agent<span style={{ color: 'var(--tyler-red)' }}>Vault</span></h1>
          <p>Secure agent wallet management</p>
        </div>
        <div className="card">
          {error && <div className="mb-md"><span className="badge badge-error">{error}</span></div>}
          <div className="btn-stack" style={{ marginTop: 0 }}>
            <button className="btn btn-large btn-primary" onClick={() => handlePasskey('login')} disabled={loading}>{loading ? 'Authenticating...' : '🔐  Login with Passkey'}</button>
            <button className="btn btn-large btn-outline" onClick={() => handlePasskey('signup')} disabled={loading}>Create Account</button>
          </div>
          <p className="text-center text-xs text-muted mt-lg" style={{ marginBottom: 0 }}>Keys never leave your device. Secured by WebAuthn.</p>
        </div>
      </div>
    </div>
  )
}
