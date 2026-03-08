import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function BindingFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [scanning, setScanning] = useState(false)

  const handleScan = () => {
    setScanning(true)
    // QR scanner would go here
    setTimeout(() => {
      setScanning(false)
      setStep(2)
    }, 2000)
  }

  const handleComplete = () => {
    // Save binding
    const binding = {
      id: Date.now().toString(),
      agent: '0xAGENT_PUBKEY_' + Date.now(),
      wallet: '0xYOUR_WALLET',
      chain: 'evm',
      nonce: 0,
      createdAt: Date.now()
    }
    const stored = JSON.parse(localStorage.getItem('bindings') || '[]')
    localStorage.setItem('bindings', JSON.stringify([...stored, binding]))
    navigate('/bindings')
  }

  return (
    <div className="container">
      <h1>Bind Agent</h1>
      
      <div className="stepper">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Scan</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Review</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Confirm</div>
      </div>

      {step === 1 && (
        <div className="card" style={{textAlign:'center'}}>
          <p>Scan the QR code from your agent to bind it</p>
          <div style={{
            width:'200px',height:'200px',margin:'20px auto',
            background:'var(--surface-dim)',borderRadius:'8px',
            display:'flex',alignItems:'center',justifyContent:'center'
          }}>
            {scanning ? 'Scanning...' : '📷 QR Code'}
          </div>
          <button className="btn btn-primary" onClick={handleScan}>
            {scanning ? 'Scanning...' : 'Start Scanning'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3>Binding Details</h3>
          <div className="detail-table">
            <div className="detail-row"><span>Agent</span><code>0xABC...</code></div>
            <div className="detail-row"><span>Wallet</span><code>0x742...</code></div>
            <div className="detail-row"><span>Chain</span><span>EVM</span></div>
          </div>
          <button className="btn btn-primary" onClick={() => setStep(3)} style={{marginTop:'16px'}}>
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h3>Confirm with Passkey</h3>
          <p>Authorize this binding using your passkey</p>
          <button className="btn btn-primary" onClick={handleComplete}>
            Confirm & Create Binding
          </button>
        </div>
      )}
    </div>
  )
}
