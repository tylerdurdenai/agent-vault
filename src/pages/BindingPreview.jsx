import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function BindingPreview() {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    setConfirming(true)
    // Passkey confirmation would go here
    setTimeout(() => {
      setConfirming(false)
      navigate('/bindings')
    }, 1000)
  }

  return (
    <div className="container">
      <h1>Bind New Agent</h1>
      <div className="card">
        <h3>Agent Details</h3>
        <div className="detail-table">
          <div className="detail-row">
            <span>Agent Public Key</span>
            <code>0xAGENT_PUBKEY...</code>
          </div>
          <div className="detail-row">
            <span>Your Wallet</span>
            <code>0xYOUR_WALLET...</code>
          </div>
          <div className="detail-row">
            <span>Chain</span>
            <span>Ethereum</span>
          </div>
          <div className="detail-row">
            <span>Valid From</span>
            <span>Now</span>
          </div>
          <div className="detail-row">
            <span>Valid Until</span>
            <span>1 hour</span>
          </div>
        </div>
      </div>
      <button 
        className="btn btn-primary" 
        onClick={handleConfirm}
        disabled={confirming}
      >
        {confirming ? 'Confirming...' : 'Confirm with Passkey'}
      </button>
    </div>
  )
}
