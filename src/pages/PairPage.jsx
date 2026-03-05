import { useState, useEffect, useRef } from 'react'
import { useAuth, useToast } from '../App'
import { getWallets } from '../lib/crypto'
import { computeAgentId } from '../lib/agentBinding'

export default function PairPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState('select')
  const [wallets, setWallets] = useState([])
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [agentData, setAgentData] = useState(null)
  const [agentId, setAgentId] = useState(null)
  const [binding, setBinding] = useState(false)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (user) {
      const w = getWallets(user.id)
      setWallets(w)
      const saved = localStorage.getItem(`selected_wallet_${user.id}`)
      if (saved && w.find(wal => wal.address === saved)) {
        setSelectedWallet(saved)
        setStep('scan')
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [user])

  useEffect(() => {
    if (step !== 'scan') return

    let mounted = true
    const initScanner = async () => {
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      if (!mounted) return

      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )
      scannerRef.current = scanner

      scanner.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText)
            if (data.type === 'agent_binding' && data.agent_id && data.chain) {
              scanner.clear().catch(() => {})
              const computedId = computeAgentId(
                data.agent_pubkey || data.agent_id,
                selectedWallet,
                data.chain,
                data.nonce || Date.now()
              )
              setAgentData(data)
              setAgentId(computedId)
              setStep('confirm')
            } else {
              setError('Invalid QR: not an agent binding code')
              toast('Invalid QR code')
            }
          } catch (e) {
            setError('Could not parse QR code')
            toast('QR parse error')
          }
        },
        () => {}
      )
    }
    initScanner()

    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [step, selectedWallet, toast])

  const handleConfirmBind = async () => {
    if (!selectedWallet || !agentData) return
    setBinding(true)
    setError(null)

    try {
      const wallet = wallets.find(w => w.address === selectedWallet)
      const agent = {
        id: agentId,
        name: agentData.name || `Agent ${agentData.agent_id.slice(0, 8)}`,
        agentPubkey: agentData.agent_pubkey || agentData.agent_id,
        chain: agentData.chain,
        wallet: wallet,
        bound: true,
        boundAt: Date.now(),
        mode: 'B'
      }

      const existing = JSON.parse(localStorage.getItem(`agents_${user.id}`) || '[]')
      const updated = [...existing.filter(a => a.id !== agent.id), agent]
      localStorage.setItem(`agents_${user.id}`, JSON.stringify(updated))

      setStep('done')
      toast('Agent bound successfully ✓')
    } catch (err) {
      setError(err.message || 'Binding failed')
      toast('Binding failed')
    } finally {
      setBinding(false)
    }
  }

  const chainIcon = (chain) => {
    const icons = { evm: '⟠', solana: '◎', hyperliquid: '⚡' }
    return icons[chain] || '🔑'
  }

  if (step === 'select') {
    return (
      <div className="page animate-in">
        <h1 className="page-title">Pair Agent</h1>
        <p className="page-subtitle">Select a wallet to pair with an agent</p>

        {wallets.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-title">No wallets available</div>
              <div className="empty-state-desc">Generate a wallet first to pair with agents</div>
            </div>
          </div>
        ) : (
          <div className="section">
            <div className="section-label">Select Wallet</div>
            {wallets.map((wallet, i) => (
              <div
                key={wallet.address || i}
                className={`list-item ${selectedWallet === wallet.address ? 'selected' : ''}`}
                onClick={() => setSelectedWallet(wallet.address)}
              >
                <div className="list-item-icon">{chainIcon(wallet.chain)}</div>
                <div className="list-item-content">
                  <div className="list-item-title">{wallet.chain.toUpperCase()}</div>
                  <div className="list-item-desc mono">
                    {wallet.address.slice(0, 12)}...{wallet.address.slice(-6)}
                  </div>
                </div>
                {selectedWallet === wallet.address && (
                  <span className="badge badge-success">Selected</span>
                )}
              </div>
            ))}
            <button
              className="btn btn-large btn-primary"
              disabled={!selectedWallet}
              onClick={() => setStep('scan')}
            >
              Continue to Scan
            </button>
          </div>
        )}
      </div>
    )
  }

  if (step === 'scan') {
    const wallet = wallets.find(w => w.address === selectedWallet)
    return (
      <div className="page animate-in">
        <h1 className="page-title">Scan Agent QR</h1>
        <p className="page-subtitle">Point camera at agent's pairing QR code</p>

        <div className="card card-compact">
          <div className="section-label" style={{ marginBottom: 8 }}>Pairing with</div>
          <div className="list-item selected" style={{ margin: 0 }}>
            <div className="list-item-icon">{chainIcon(wallet?.chain)}</div>
            <div className="list-item-content">
              <div className="list-item-title">{wallet?.chain?.toUpperCase()}</div>
              <div className="list-item-desc mono">
                {wallet?.address?.slice(0, 12)}...{wallet?.address?.slice(-6)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div id="qr-reader" style={{ width: '100%' }}></div>
          {error && (
            <div className="alert alert-error" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}
        </div>

        <button className="btn btn-large btn-secondary" onClick={() => setStep('select')}>
          Change Wallet
        </button>
      </div>
    )
  }

  if (step === 'confirm') {
    const wallet = wallets.find(w => w.address === selectedWallet)
    return (
      <div className="page animate-in">
        <h1 className="page-title">Confirm Binding</h1>
        <p className="page-subtitle">Review and confirm agent connection</p>

        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <div className="section-label">Agent</div>
            <div className="list-item" style={{ margin: 0 }}>
              <div className="list-item-icon" style={{ background: 'rgba(139,0,0,0.1)' }}>🤖</div>
              <div className="list-item-content">
                <div className="list-item-title">{agentData?.name || 'Unknown Agent'}</div>
                <div className="list-item-desc">Chain: {agentData?.chain}</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="section-label">Wallet</div>
            <div className="list-item" style={{ margin: 0 }}>
              <div className="list-item-icon">{chainIcon(wallet?.chain)}</div>
              <div className="list-item-content">
                <div className="list-item-title">{wallet?.chain?.toUpperCase()}</div>
                <div className="list-item-desc mono">
                  {wallet?.address?.slice(0, 12)}...{wallet?.address?.slice(-6)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="section-label">Agent ID (Deterministic)</div>
            <div className="mono" style={{ 
              background: 'var(--surface-dim)', 
              padding: 12, 
              borderRadius: 8,
              wordBreak: 'break-all',
              fontSize: 12
            }}>
              {agentId}
            </div>
          </div>

          <div className="alert alert-warning">
            <strong>⚠️ Important:</strong> This allows the agent to sign transactions for this wallet.
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}
        </div>

        <div className="button-row">
          <button className="btn btn-large btn-secondary" onClick={() => setStep('scan')} disabled={binding}>
            Back
          </button>
          <button className="btn btn-large btn-primary" onClick={handleConfirmBind} disabled={binding}>
            {binding ? 'Binding...' : 'Confirm'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    const wallet = wallets.find(w => w.address === selectedWallet)
    return (
      <div className="page animate-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h1 className="page-title">Agent Bound!</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          {agentData?.name || 'Agent'} is now connected to your {agentData?.chain} wallet
        </p>

        <div className="card" style={{ textAlign: 'left' }}>
          <div className="section-label">Binding Details</div>
          <div style={{ marginTop: 12 }}>
            <div className="detail-row">
              <span className="detail-label">Agent ID</span>
              <span className="detail-value mono" style={{ fontSize: 12 }}>{agentId?.slice(0, 20)}...</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Wallet</span>
              <span className="detail-value mono" style={{ fontSize: 12 }}>{wallet?.address?.slice(0, 12)}...</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Chain</span>
              <span className="detail-value">{agentData?.chain}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Mode</span>
              <span className="detail-value">Auto-sign (Mode B)</span>
            </div>
          </div>
        </div>

        <button className="btn btn-large btn-primary" onClick={() => window.location.href = '/wallets'}>
          Back to Wallets
        </button>
      </div>
    )
  }

  return null
}
