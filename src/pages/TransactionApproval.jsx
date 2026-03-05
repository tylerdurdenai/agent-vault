import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../App'

// Mock pending transactions (in production, fetch from backend)
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
    // In production: fetch pending tx from backend
    // const txId = searchParams.get('id')
    setTx(mockPendingTx)
  }, [searchParams])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      // Passkey verification for Mode A
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode(`approve_${tx.id}`),
          timeout: 60000,
          rpId: window.location.hostname
        }
      })

      if (credential) {
        // In production: Send approval to TEE
        // await submitApproval(tx.id, credential)
        
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
    // In production: Send rejection to backend
    alert('Transaction rejected')
    navigate('/dashboard')
  }

  const handleEdit = () => {
    // In production: Open edit modal
    alert('Edit functionality - adjust gas, amount, etc.')
  }

  if (!tx) {
    return (
      <div className="container" style={{ paddingTop: '60px' }}>
        <div className="card">
          <p>Loading transaction...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="header">
        <h1>📝 Approve Transaction</h1>
      </header>

      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span className="status pending">Mode A - Requires Approval</span>
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
              <span className="tx-value" style={{ color: 'var(--success)', fontWeight: 'bold' }}>
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

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Data: {tx.data}
          </p>

          {processing && (
            <div className="status pending" style={{ marginTop: '16px' }}>
              Processing...
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
              className="btn btn-outline" 
              onClick={handleReject}
              disabled={processing}
              style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
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

          <p style={{ fontSize: '0.8rem', marginTop: '16px', textAlign: 'center' }}>
            🔐 You'll be asked to authenticate with passkey
          </p>
        </div>
      </div>
    </div>
  )
}
