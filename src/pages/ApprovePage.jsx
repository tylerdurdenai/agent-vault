import { useState } from 'react'
import { useAuth, useToast } from '../App'

const mockPendingTx = {
  id: 'tx_' + Date.now(),
  agent: 'trader_alpha',
  chain: 'evm',
  from: '0xb348765EE70096Ef7C77a21eC99270F3483E7ec1',
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f1cD12',
  amount: '0.5',
  token: 'ETH',
  usdValue: '$1,250',
  gas: '0.003',
  gasUsd: '$7.50',
  data: '0xa9059cbb000000000000000000000000...',
  nonce: 5,
  timestamp: Date.now()
}

export default function ApprovePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [tx, setTx] = useState(mockPendingTx)
  const [processing, setProcessing] = useState(false)
  const [mode, setMode] = useState('review')

  const handleApprove = async () => {
    setProcessing(true)
    setMode('signing')

    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode(`approve_${tx.id}_${Date.now()}`),
          timeout: 60000,
          rpId: window.location.hostname
        }
      })

      if (credential) {
        await new Promise(r => setTimeout(r, 1000))
        setMode('success')
        toast('Transaction approved ✓')
      }
    } catch (err) {
      console.error('Approval failed:', err)
      setMode('review')
      toast('Approval failed: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = () => {
    setMode('rejected')
    toast('Transaction rejected')
  }

  const handleNewTx = () => {
    setTx({ ...mockPendingTx, id: 'tx_' + Date.now() })
    setMode('review')
  }

  if (mode === 'success') {
    return (
      <div className="page animate-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
        <h1 className="page-title">Transaction Sent</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          Your transaction has been submitted
        </p>

        <div className="card" style={{ textAlign: 'left' }}>
          <div className="detail-row">
            <span className="detail-label">TX Hash</span>
            <span className="detail-value mono" style={{ fontSize: 12 }}>0x7a3b2c...</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount</span>
            <span className="detail-value">{tx.amount} {tx.token}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Agent</span>
            <span className="detail-value">{tx.agent}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="badge badge-success">Confirmed</span>
          </div>
        </div>

        <button className="btn btn-large btn-primary" onClick={handleNewTx}>
          Done
        </button>
      </div>
    )
  }

  if (mode === 'rejected') {
    return (
      <div className="page animate-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>❌</div>
        <h1 className="page-title">Transaction Rejected</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          This transaction has been cancelled
        </p>

        <button className="btn btn-large btn-primary" onClick={handleNewTx}>
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="page animate-in">
      <h1 className="page-title">Approve Transaction</h1>
      <p className="page-subtitle">
        {mode === 'signing' ? 'Complete authentication to sign...' : 'Review transaction details'}
      </p>

      <div className="card card-compact" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Approval Mode</span>
          <span className="badge badge-pending">Mode A — Per-Transaction</span>
        </div>
      </div>

      <div className="card">
        <div className="tx-section">
          <div className="tx-label">Agent</div>
          <div className="tx-value">
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(139,0,0,0.08)',
              padding: '4px 12px',
              borderRadius: 20
            }}>
              🤖 {tx.agent}
            </span>
          </div>
        </div>

        <div className="tx-section">
          <div className="tx-label">Chain</div>
          <div className="tx-value">⟠ {tx.chain.toUpperCase()}</div>
        </div>

        <div className="tx-section">
          <div className="tx-label">From</div>
          <div className="tx-value mono">{tx.from.slice(0, 10)}...{tx.from.slice(-6)}</div>
        </div>

        <div className="tx-section">
          <div className="tx-label">To</div>
          <div className="tx-value mono">{tx.to.slice(0, 10)}...{tx.to.slice(-6)}</div>
        </div>

        <div className="tx-section" style={{ 
          background: 'rgba(23, 178, 106, 0.06)', 
          margin: '12px -20px',
          padding: '16px 20px',
          borderRadius: 12
        }}>
          <div className="tx-label">Amount</div>
          <div className="tx-value" style={{ fontSize: 24, fontWeight: 700, color: 'var(--status-success)' }}>
            {tx.amount} {tx.token}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{tx.usdValue}</div>
        </div>

        <div className="tx-section">
          <div className="tx-label">Network Fee</div>
          <div className="tx-value">{tx.gas} ETH <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>({tx.gasUsd})</span></div>
        </div>

        <div className="tx-section">
          <div className="tx-label">Nonce</div>
          <div className="tx-value">{tx.nonce}</div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 16 }}>
        🔐 Authenticate with your passkey to approve
      </div>

      {mode === 'signing' && (
        <div className="card" style={{ textAlign: 'center', background: 'var(--surface-dim)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
          <div style={{ fontWeight: 600 }}>Waiting for passkey...</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Use Face ID, Touch ID, or your security key
          </div>
        </div>
      )}

      <div className="button-row" style={{ marginTop: 24 }}>
        <button 
          className="btn btn-large btn-danger" 
          onClick={handleReject}
          disabled={processing}
        >
          Reject
        </button>
        <button 
          className="btn btn-large btn-primary" 
          onClick={handleApprove}
          disabled={processing}
        >
          {processing ? 'Signing...' : 'Approve & Sign'}
        </button>
      </div>
    </div>
  )
}
