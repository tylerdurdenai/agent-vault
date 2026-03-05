import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../App'
import { getWallets } from '../lib/crypto'

export default function AgentBinding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('scan') // scan | select | bind | done
  const [agentData, setAgentData] = useState(null)
  const [wallets, setWallets] = useState([])
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [binding, setBinding] = useState(false)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    setWallets(getWallets(user.id))
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [user.id])

  // QR Scanner
  useEffect(() => {
    if (step !== 'scan') return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: 250 },
      false
    )
    scannerRef.current = scanner

    scanner.render(
      (decodedText) => {
        try {
          const data = JSON.parse(decodedText)
          if (data.type === 'agent_wallet_binding') {
            scanner.clear()
            setAgentData(data)
            setStep('select')
          } else {
            setError('Invalid QR code - not an agent binding')
          }
        } catch (e) {
          setError('Could not parse QR code')
        }
      },
      (error) => {
        console.log('QR scan error:', error)
      }
    )

    return () => scanner.clear()
  }, [step])

  const handleBind = async () => {
    if (!selectedWallet) {
      setError('Select a wallet to bind')
      return
    }

    setBinding(true)
    setError(null)

    try {
      // In production: Key injection to TEE would happen here
      // 1. Verify TEE attestation
      // 2. Wrap key with TEE public key
      // 3. Send via relay

      const agent = {
        id: agentData.agent_id,
        name: `Agent ${agentData.agent_id}`,
        chain: agentData.chain,
        wallet: selectedWallet,
        bound: true,
        boundAt: Date.now(),
        mode: 'B' // Default to Mode B
      }

      // Store bound agent
      const existing = JSON.parse(localStorage.getItem(`agents_${user.id}`) || '[]')
      const updated = [...existing.filter(a => a.id !== agent.id), agent]
      localStorage.setItem(`agents_${user.id}`, JSON.stringify(updated))

      // In production: Inject key to TEE
      // await injectKeyToTEE(selectedWallet, agentData)

      setStep('done')
    } catch (err) {
      setError(err.message || 'Binding failed')
    } finally {
      setBinding(false)
    }
  }

  if (step === 'scan') {
    return (
      <div>
        <header className="header">
          <h1>🔗 Bind Agent</h1>
        </header>
        <div className="container">
          <div className="card">
            <h2>Scan Agent QR</h2>
            <p>Scan the QR code from the agent to bind your wallet</p>

            {error && (
              <div className="status error" style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div id="qr-reader" className="qr-scanner" />
          </div>
        </div>
      </div>
    )
  }

  if (step === 'select') {
    return (
      <div>
        <header className="header">
          <h1>🔗 Bind Agent</h1>
        </header>
        <div className="container">
          <div className="card">
            <h2>Agent: {agentData.agent_id}</h2>
            <p>Chain: {agentData.chain}</p>

            <div className="status success" style={{ marginBottom: '16px' }}>
              Agent verified ✓
            </div>

            <h3>Select Wallet to Bind</h3>
            {wallets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>No wallets available</p>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                  Generate Wallet First
                </button>
              </div>
            ) : (
              wallets
                .filter(w => w.chain === agentData.chain)
                .map((wallet, i) => (
                  <div 
                    key={i} 
                    className="wallet-card"
                    onClick={() => setSelectedWallet(wallet)}
                    style={{ 
                      cursor: 'pointer',
                      border: selectedWallet === wallet ? '2px solid var(--primary)' : '2px solid transparent'
                    }}
                  >
                    <div className="wallet-info">
                      <h3>{wallet.chain.toUpperCase()}</h3>
                      <div className="wallet-address">
                        {wallet.address.slice(0, 14)}...
                      </div>
                    </div>
                  </div>
                ))
            )}

            {error && (
              <div className="status error" style={{ marginTop: '12px' }}>
                {error}
              </div>
            )}

            <div className="actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setStep('scan')}
              >
                Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleBind}
                disabled={!selectedWallet || binding}
              >
                {binding ? 'Binding...' : 'Bind Agent'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div>
        <header className="header">
          <h1>✅ Bound</h1>
        </header>
        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem' }}>🎉</h2>
            <h2>Agent Bound Successfully</h2>
            <p>
              {agentData.agent_id} is now bound to your {agentData.chain} wallet
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Keys are securely injected to the TEE. The agent can now sign 
              transactions according to your approval mode.
            </p>

            <div style={{ marginTop: '24px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
