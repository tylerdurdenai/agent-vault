import { useState, useEffect } from 'react'
import { useAuth, useToast } from '../App'

const mockPendingTx = {
  id: 'tx_123', agent: 'trader', chain: 'evm', from: '0xABC...DEF', to: '0x123...456',
  amount: '0.5', token: 'ETH', usdValue: '$1,200', gas: '0.002', data: '0xa9059cbb...', nonce: 5, mode: 'A'
}

export default function ApprovePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [tx, setTx] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => { setTx(mockPendingTx) }, [])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      const credential = await navigator.credentials.get({
        publicKey: { challenge: new TextEncoder().encode(`approve_${tx.id}`), timeout: 60000, rpId: window.location.hostname, userVerification: 'required' }
      })
      if (credential) { setResult('approved'); toast('Transaction approved ✓') }
    } catch (err) {
      if (err.name !== 'NotAllowedError') toast('Approval failed: ' + err.message)
    } finally { setProcessing(false) }
  }

  const handleReject = () => { setResult('rejected'); toast('Transaction rejected') }

  if (result) {
    const isApproved = result === 'approved'
    return (
      <div className="page">
        <div className="result-screen animate-slide-up">
          <div className={`result-icon ${isApproved ? 'success' : 'error'}`}>{isApproved ? '✅' : '❌'}</div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>{isApproved ? 'Approved' : 'Rejected'}</h1>
          <p className="page-subtitle" style={{ marginBottom: 24 }}>{isApproved ? `${tx.amount} ${tx.token} transfer has been signed and submitted` : 'Transaction was rejected. No funds were moved.'}</p>
          <button className="btn btn-large btn-primary" style={{ width: '100%' }} onClick={() => { setResult(null); setTx(mockPendingTx) }}>Done</button>
        </div>
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No pending transactions</div>
          <div className="empty-state-desc">When an agent requests a transaction, it will appear here for approval.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page animate-in">
      <h1 className="page-title">Approve</h1>
      <p className="page-subtitle">Review and sign this transaction</p>
      <div className="text-center mb-lg"><span className="badge badge-pending badge-dot">Mode A — Passkey Required</span></div>
      <div className="card mb-lg">
        <div className="detail-table">
          <div className="detail-row"><span className="detail-label">Agent</span><span className="detail-value">{tx.agent}</span></div>
          <div className="detail-row"><span className="detail-label">Chain</span><span className="detail-value">{tx.chain.toUpperCase()}</span></div>
          <div className="detail-row"><span className="detail-label">From</span><span className="detail-value">{tx.from}</span></div>
          <div className="detail-row"><span className="detail-label">To</span><span className="detail-value">{tx.to}</span></div>
          <div className="detail-row"><span className="detail-label">Amount</span><span className="detail-value text-bold" style={{ color: 'var(--status-success)' }}>{tx.amount} {tx.token} ({tx.usdValue})</span></div>
          <div className="detail-row"><span className="detail-label">Gas</span><span className="detail-value">{tx.gas} ETH</span></div>
          <div className="detail-row"><span className="detail-label">Nonce</span><span className="detail-value">{tx.nonce}</span></div>
        </div>
      </div>
      <div className="code-block">{tx.data}</div>
      {processing && <div className="text-center mt-md mb-md"><span className="badge badge-pending">Waiting for passkey...</span></div>}
      <div className="btn-row">
        <button className="btn btn-large btn-danger" onClick={handleReject} disabled={processing}>Reject</button>
        <button className="btn btn-large btn-cta" onClick={handleApprove} disabled={processing}>{processing ? 'Signing...' : 'Approve'}</button>
      </div>
      <p className="text-center text-xs text-muted mt-md">🔐 Passkey verification required to sign</p>
    </div>
  )
}
