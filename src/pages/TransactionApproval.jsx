import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../App'

const mockPendingTx = {
  id: 'tx_123',
  agent: 'trader',
  chain: 'evm',
  from: '0xABC...DEF',
  to: '0x123...456',
  amount: '0.5',
  token: 'ETH',
  usdValue: '$1,200',
  gas: '0.002',
  data: '0xa9059cbb...',
  nonce: 5,
  mode: 'A'
}

export default function TransactionApproval() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tx, setTx] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    setTx(mockPendingTx)
  }, [searchParams])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode(`approve_${tx.id}`),
          timeout: 60000,
          rpId: window.location.hostname
        }
      })

      if (credential) {
        alert('Transaction approved and submitted!')
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Approval failed:', err)
      alert('Approval failed: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = () => {
    alert('Transaction rejected')
    navigate('/dashboard')
  }

  const handleEdit = () => {
    alert('Edit functionality - adjust gas, amount, etc.')
  }

  if (!tx) {
    return (
      <div className="container" style={{ paddingTop: '100px' }}>
        <div className="card">
          <p>Loading transaction...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="header">
        <h1>
          <span className="header-logo">A</span>
          Agent<span style={{ color: 'var(--tyler-red)' }}>Vault</span>
        </h1>
        <nav className="nav">
          <Link to="/dashboard" className="nav-link">Wallets</Link>
          <Link to="/bind" className="nav-link">Bind</Link>
          <Link to="/approve" className="nav-link active">Approve</Link>
        </nav>
      </header>

      <div className="container">
        <div className="card">
          <div className="section-icon">📝</div>
          <h2>Approve Transaction</h2>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="status pending">Mode A — Requires Approval</span>
          </div>

          <div className="tx-details">
            <div className="tx-row">
              <span className="tx-label">Agent</span>
              <span className="tx-value">{tx.agent}</span>
            </div>
            <div className="tx-row">
              <span className="tx-label">Chain</span>
              <span className="tx-value">{tx.chain.toUpperCase()}</span>
            </div>
            <div className="tx-row">
              <span className="tx-label">From</span>
              <span className="tx-value">{tx.from}</span>
            </div>
            <div className="tx-row">
              <span className="tx-label">To</span>
              <span className="tx-value">{tx.to}</span>
            </div>
            <div className="tx-row">
              <span className="tx-label">Amount</span>
              <span className="tx-value" style={{ color: 'var(--status-success)', fontWeight: 700 }}>
                {tx.amount} {tx.token} ({tx.usdValue})
              </span>
            </div>
            <div className="tx-row">
              <span className="tx-label">Gas Fee</span>
              <span className="tx-value">{tx.gas} ETH</span>
            </div>
            <div className="tx-row">
              <span className="tx-label">Nonce</span>
              <span className="tx-value">{tx.nonce}</span>
            </div>
          </div>

          <p style={{ fontSize: '12px', fontFamily: "'Fira Code', monospace", color: 'var(--text-secondary)' }}>
            Data: {tx.data}
          </p>

          {processing && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span className="status pending">Processing...</span>
            </div>
          )}

          <div className="actions">
            <button 
              className="btn btn-secondary" 
              onClick={handleEdit}
              disabled={processing}
            >
              Edit
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleReject}
              disabled={processing}
            >
              Reject
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? 'Signing...' : 'Approve & Sign'}
            </button>
          </div>

          <p style={{ fontSize: '12px', marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            🔐 You'll be asked to authenticate with passkey
          </p>
        </div>
      </div>
    </div>
  )
}
