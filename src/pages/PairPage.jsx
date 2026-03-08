import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth, useToast } from '../App'
import { getWallets, signMessage } from '../lib/crypto'
import { generateAgentId, createBindingCommitment } from '../lib/agentId'

const STEPS = ['Wallet', 'Scan', 'Review', 'Done']

export default function PairPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [wallets, setWallets] = useState([])
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [agentData, setAgentData] = useState(null)
  const [binding, setBinding] = useState(false)
  const [bindingResult, setBindingResult] = useState(null)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    const w = getWallets(user.id)
    setWallets(w)
    const savedAddr = localStorage.getItem(`selected_wallet_${user.id}`)
    if (savedAddr) {
      const found = w.find(x => x.address === savedAddr)
      if (found) setSelectedWallet(found)
    }
  }, [user.id])

  useEffect(() => {
    if (step !== 1) return
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 }, false)
      scannerRef.current = scanner
      scanner.render(
        (decoded) => {
          try {
            const data = JSON.parse(decoded)
            if (data.type === 'agent_wallet_binding' || data.agent_id) {
              scanner.clear().catch(() => {})
              setAgentData(data)
              setStep(2)
            } else {
              setError('Invalid QR — not an agent binding request')
            }
          } catch {
            if (decoded.startsWith('wc:')) {
              scanner.clear().catch(() => {})
              setAgentData({ type: 'walletconnect', uri: decoded, agent_id: 'wc_' + decoded.slice(3, 15), chain: selectedWallet?.chain || 'evm' })
              setStep(2)
            } else {
              setError('Could not parse QR code')
            }
          }
        },
        () => {}
      )
    }, 100)
    return () => {
      clearTimeout(timer)
      if (scannerRef.current) { scannerRef.current.clear().catch(() => {}); scannerRef.current = null }
    }
  }, [step, selectedWallet])

  const handleBind = useCallback(async () => {
    if (!selectedWallet || !agentData) return
    setBinding(true); setError(null)
    try {
      const commitment = createBindingCommitment(selectedWallet.address, agentData.chain || selectedWallet.chain, agentData.agent_id)
      const signature = signMessage(commitment.message, selectedWallet.privateKey)
      const agentId = generateAgentId(commitment, signature)
      const agent = {
        id: agentId.id,
        agentIdentifier: agentId,
        name: agentData.name || `Agent ${agentData.agent_id?.slice(0, 8) || 'Unknown'}`,
        chain: agentData.chain || selectedWallet.chain,
        wallet: { address: selectedWallet.address, chain: selectedWallet.chain },
        bound: true, boundAt: Date.now(), mode: 'A'
      }
      const existing = JSON.parse(localStorage.getItem(`agents_${user.id}`) || '[]')
      localStorage.setItem(`agents_${user.id}`, JSON.stringify([...existing.filter(a => a.id !== agent.id), agent]))
      setBindingResult(agent)
      setStep(3)
      toast('Agent bound successfully ✓')
    } catch (err) {
      setError(err.message || 'Binding failed')
    } finally {
      setBinding(false)
    }
  }, [selectedWallet, agentData, user.id, toast])

  const Stepper = () => (
    <div className="stepper">
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'contents' }}>
          <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'upcoming'}`}>{i < step ? '✓' : i + 1}</div>
          {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  )

  if (step === 0) {
    return (
      <div className="page animate-in">
        <Stepper />
        <h1 className="page-title">Pair Agent</h1>
        <p className="page-subtitle">Select a wallet to bind to an agent</p>
        {wallets.length === 0 ? (
          <div className="card"><div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">No wallets</div>
            <div className="empty-state-desc">Generate a wallet first, then come back to pair.</div>
            <button className="btn btn-medium btn-primary" onClick={() => window.location.href = '/wallets'}>Go to Wallets</button>
          </div></div>
        ) : (
          <>
            <div className="section-label">Select Wallet</div>
            {wallets.map((w, i) => (
              <div key={w.address || i} className={`list-item ${selectedWallet?.address === w.address ? 'selected' : ''}`} onClick={() => setSelectedWallet(w)}>
                <div className="list-item-icon">{w.chain === 'evm' ? '⟠' : w.chain === 'solana' ? '◎' : '⚡'}</div>
                <div className="list-item-content">
                  <div className="list-item-title">{w.chain.toUpperCase()}</div>
                  <div className="list-item-desc mono">{w.address.slice(0, 12)}...{w.address.slice(-6)}</div>
                </div>
                {selectedWallet?.address === w.address && <span className="badge badge-success">✓</span>}
              </div>
            ))}
            <div className="btn-stack">
              <button className="btn btn-large btn-primary" onClick={() => setStep(1)} disabled={!selectedWallet}>Continue — Scan QR</button>
            </div>
          </>
        )}
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="page animate-in">
        <Stepper />
        <h1 className="page-title">Scan QR</h1>
        <p className="page-subtitle">Point your camera at the agent's QR code</p>
        {error && <div className="mb-md"><span className="badge badge-error">{error}</span> <button className="btn-ghost text-sm mt-sm" onClick={() => setError(null)}>Dismiss</button></div>}
        <div style={{ marginBottom: 'var(--space-lg)' }}><div id="qr-reader" /></div>
        <p className="text-center text-xs text-muted">Scanning for agent binding QR or WalletConnect URI</p>
        <div className="btn-stack"><button className="btn btn-large btn-outline" onClick={() => { setError(null); setStep(0) }}>← Back</button></div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="page animate-in">
        <Stepper />
        <h1 className="page-title">Review Binding</h1>
        <p className="page-subtitle">Verify details before signing</p>
        <div className="card mb-md">
          <div className="detail-table">
            <div className="detail-row"><span className="detail-label">Agent</span><span className="detail-value">{agentData?.agent_id || 'Unknown'}</span></div>
            <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value"><span className="badge badge-info">{agentData?.type === 'walletconnect' ? 'WalletConnect' : 'Direct'}</span></span></div>
            <div className="detail-row"><span className="detail-label">Chain</span><span className="detail-value">{(agentData?.chain || selectedWallet?.chain || 'evm').toUpperCase()}</span></div>
            <div className="detail-row"><span className="detail-label">Wallet</span><span className="detail-value">{selectedWallet?.address?.slice(0, 10)}...{selectedWallet?.address?.slice(-6)}</span></div>
          </div>
        </div>
        <div className="agent-id-card mb-md">
          <div className="agent-id-label">Agent Identifier</div>
          <p className="text-xs text-muted" style={{ marginBottom: 0, marginTop: 8 }}>Deterministic commitment signed by your wallet key. Tamper-proof.</p>
        </div>
        {error && <div className="mb-md"><span className="badge badge-error">{error}</span></div>}
        <div className="btn-row">
          <button className="btn btn-large btn-outline" onClick={() => { setAgentData(null); setError(null); setStep(1) }} disabled={binding}>Back</button>
          <button className="btn btn-large btn-cta" onClick={handleBind} disabled={binding}>{binding ? 'Signing...' : 'Sign & Bind'}</button>
        </div>
        <p className="text-center text-xs text-muted mt-md">🔐 Your wallet key signs a commitment — it never leaves this device</p>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="page">
        <Stepper />
        <div className="result-screen animate-slide-up">
          <div className="result-icon success">🎉</div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>Bound!</h1>
          <p className="page-subtitle" style={{ marginBottom: 24 }}>Agent is now paired with your {selectedWallet?.chain?.toUpperCase()} wallet</p>
          {bindingResult?.agentIdentifier && (
            <div className="agent-id-card" style={{ width: '100%', marginBottom: 24 }}>
              <div className="agent-id-label">Agent Identifier</div>
              <div className="agent-id-value">{bindingResult.agentIdentifier.id}</div>
            </div>
          )}
          <div className="btn-stack" style={{ width: '100%' }}>
            <button className="btn btn-large btn-primary" onClick={() => window.location.href = '/wallets'}>Go to Wallets</button>
            <button className="btn btn-large btn-outline" onClick={() => { setStep(0); setAgentData(null); setSelectedWallet(null); setBindingResult(null); setError(null) }}>Pair Another</button>
          </div>
        </div>
      </div>
    )
  }
  return null
}
