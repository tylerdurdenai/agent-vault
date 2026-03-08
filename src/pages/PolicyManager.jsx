import { useState } from 'react'

export default function PolicyManager() {
  const [policy, setPolicy] = useState({
    dailyLimit: 100,
    weeklyLimit: 500,
    perTxLimit: 50,
    allowedChains: ['evm'],
    autoApprove: false
  })

  const handleSave = () => {
    localStorage.setItem('policy', JSON.stringify(policy))
    alert('Policy saved!')
  }

  return (
    <div className="container">
      <h1>Policy Manager</h1>
      
      <div className="card">
        <h3>Spending Limits</h3>
        <div className="form-group">
          <label>Daily Limit (USD)</label>
          <input 
            type="number" 
            value={policy.dailyLimit}
            onChange={e => setPolicy({...policy, dailyLimit: Number(e.target.value)})}
          />
        </div>
        <div className="form-group">
          <label>Weekly Limit (USD)</label>
          <input 
            type="number" 
            value={policy.weeklyLimit}
            onChange={e => setPolicy({...policy, weeklyLimit: Number(e.target.value)})}
          />
        </div>
        <div className="form-group">
          <label>Per-Transaction Limit (USD)</label>
          <input 
            type="number" 
            value={policy.perTxLimit}
            onChange={e => setPolicy({...policy, perTxLimit: Number(e.target.value)})}
          />
        </div>
      </div>

      <div className="card">
        <h3>Mode</h3>
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={policy.autoApprove}
            onChange={e => setPolicy({...policy, autoApprove: e.target.checked})}
          />
          Auto-approve (Mode B) - Sign transactions without confirmation
        </label>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        Save Policy
      </button>
    </div>
  )
}
