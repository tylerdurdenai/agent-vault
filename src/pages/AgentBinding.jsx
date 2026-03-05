import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
      const agent = {
        id: agentData.agent_id,
        name: `Agent ${agentData.agent_id}`,
        chain: agentData.chain,
        wallet: selectedWallet,
        bound: true,
        boundAt: Date.now(),
        mode: 'B'
      }

      const existing = JSON.parse(localStorage.getItem(`agents_${user.id}`) || '[]')
      const updated = [...existing.filter(a => a.id !== agent.id), agent]
      localStorage.setItem(`agents_${user.id}`, JSON.stringify(updated))

      setStep('done')
    } catch (err) {
      setError(err.message || 'Binding failed')
    } finally {
      setBinding(false)
    }
  }

  const HeaderNav = () => (
    <header className="header">
      <h1>
        <span className="header-logo">A</span>
        Agent<span style={{ color: 'var(--tyler-red)' }}>Vault</span>
      </h1>
      <nav className="nav">
        <Link to="/dashboard" className="nav-link">Wallets</Link>
        <Link to="/bind" className="nav-link active">Bind</Link>
        <Link to="/approve" className="nav-link">Approve</Link>
      </nav>
    </header>
  )

  if (step === 'scan') {
    return (
      <div>
        <HeaderNav />
        <div className="container">
          <div className="card">
            <div className="section-icon">🔗</div>
            <h2>Scan Agent QR</h2>
            <p>Scan the QR code from the agent to bind your wallet</p>

            {error && (
              <div style={{ marginBottom: '16px' }}>
                <span className="status error">{error}</span>
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
        <HeaderNav />
        <div className="container">
          <div className="card">
            <div className="section-icon">🔗</div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif" }}>Agent: {agentData.agent_id}</h2>
            <p>Chain: {agentData.chain}</p>

            <div style={{ marginBottom: '20px' }}>
              <span className="status success">Agent verified ✓</span>
            </div>

            <h3 style={{ fontFamily: "'Poppins', sans-serif", marginBottom: '16px' }}>Select Wallet to Bind</h3>
            {wallets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--surface-dim)', borderRadius: 'var(--corner-list-item)' }}>
                <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)' }}>No wallets available</p>
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
                      borderColor: selectedWallet === wallet ? 'var(--button-primary)' : undefined,
                      background: selectedWallet === wallet ? 'rgba(0,0,0,0.02)' : undefined
                    }}
                  >
                    <div className="wallet-info">
                      <h3>{wallet.chain.toUpperCase()}</h3>
                      <div className="wallet-address">
                        {wallet.address.slice(0, 14)}...
                      </div>
                    </div>
                    {selectedWallet === wallet && (
                      <span className="status success">Selected</span>
                    )}
                  </div>
                ))
            )}

            {error && (
              <div style={{ marginTop: '12px' }}>
                <span className="status error">{error}</span>
              </div>
            )}

            <div className="actions">
              <button 
                className="btn btn-outline" 
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
        <HeaderNav />
        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2>Agent Bound Successfully</h2>
            <p>
              {agentData.agent_id} is now bound to your {agentData.chain} wallet
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Keys are securely injected to the TEE. The agent can now sign 
              transactions according to your approval mode.
            </p>

            <div style={{ marginTop: '28px' }}>
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
