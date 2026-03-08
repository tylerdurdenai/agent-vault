import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function BindingList() {
  const [bindings, setBindings] = useState([])

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('bindings')
    if (stored) setBindings(JSON.parse(stored))
  }, [])

  const handleRevoke = (id) => {
    const updated = bindings.filter(b => b.id !== id)
    setBindings(updated)
    localStorage.setItem('bindings', JSON.stringify(updated))
  }

  return (
    <div className="container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>My Bindings</h1>
        <Link to="/binding-flow" className="btn btn-primary">+ New</Link>
      </div>
      
      {bindings.length === 0 ? (
        <div className="card">
          <p style={{textAlign:'center',color:'var(--text-secondary)'}}>
            No active bindings. Create one to allow an agent to act on your behalf.
          </p>
        </div>
      ) : (
        bindings.map(binding => (
          <div key={binding.id} className="card">
            <div className="detail-table">
              <div className="detail-row">
                <span>Agent</span>
                <code>{binding.agent?.slice(0,10)}...</code>
              </div>
              <div className="detail-row">
                <span>Nonce</span>
                <span>{binding.nonce || 0}</span>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
            <button 
              className="btn btn-danger" 
              onClick={() => handleRevoke(binding.id)}
              style={{marginTop:'16px'}}
            >
              Revoke
            </button>
          </div>
        ))
      )}
      
      <Link to="/policy" className="btn btn-outline" style={{marginTop:'16px',display:'block'}}>
        Manage Policies
      </Link>
    </div>
  )
}
