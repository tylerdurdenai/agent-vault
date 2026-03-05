import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { generateWallet, storeWallet, getWallets } from '../lib/crypto'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [wallets, setWallets] = useState([])
  const [agents, setAgents] = useState([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (user) {
      setWallets(getWallets(user.id))
      const stored = localStorage.getItem(`agents_${user.id}`)
      setAgents(stored ? JSON.parse(stored) : [])
    }
  }, [user])

  const handleGenerateWallet = async (chain) => {
    setGenerating(true)
    try {
      const wallet = generateWallet(chain)
      const updated = storeWallet(wallet, user.id)
      setWallets(updated)
    } finally {
      setGenerating(false)
    }
  }

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address)
  }

  return (
    <div>
      <header className="header">
        <h1>
          <span className="header-logo">A</span>
          Agent<span style={{ color: 'var(--tyler-red)' }}>Vault</span>
        </h1>
        <nav className="nav">
          <Link to="/dashboard" className="nav-link active">Wallets</Link>
          <Link to="/bind" className="nav-link">Bind</Link>
          <Link to="/approve" className="nav-link">Approve</Link>
          <button onClick={logout} className="nav-link">Logout</button>
        </nav>
      </header>

      <div className="container">
        {/* Wallets Section */}
        <section className="card">
          <div className="section-icon">💳</div>
          <h2>Your Wallets</h2>
          <p>Generate wallets locally. Keys never leave your device.</p>

          {wallets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', background: 'var(--surface-dim)', borderRadius: 'var(--corner-list-item)' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No wallets yet — generate one below</p>
            </div>
          ) : (
            wallets.map((wallet, i) => (
              <div key={i} className="wallet-card">
                <div className="wallet-info">
                  <h3>{wallet.chain.toUpperCase()}</h3>
                  <div 
                    className="wallet-address" 
                    onClick={() => copyAddress(wallet.address)}
                    style={{ cursor: 'pointer' }}
                    title="Click to copy"
                  >
                    {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                  </div>
                </div>
                <div>
                  <span className="status success">Local</span>
                </div>
              </div>
            ))
          )}

          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Generate new wallet:</p>
            <div className="chain-select">
              <button 
                className="chain-btn" 
                onClick={() => handleGenerateWallet('evm')}
                disabled={generating}
              >
                EVM
              </button>
              <button 
                className="chain-btn" 
                onClick={() => handleGenerateWallet('solana')}
                disabled={generating}
              >
                Solana
              </button>
              <button 
                className="chain-btn" 
                onClick={() => handleGenerateWallet('hyperliquid')}
                disabled={generating}
              >
                Hyperliquid
              </button>
            </div>
          </div>
        </section>

        {/* Agents Section */}
        <section className="card">
          <div className="section-icon">🤖</div>
          <h2>Bound Agents</h2>
          <p>Agents connected to your wallets</p>

          {agents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', background: 'var(--surface-dim)', borderRadius: 'var(--corner-list-item)' }}>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)' }}>No agents bound yet</p>
              <Link to="/bind" className="btn btn-primary">
                Bind Agent
              </Link>
            </div>
          ) : (
            agents.map((agent, i) => (
              <div key={i} className={`agent-card ${agent.bound ? 'bound' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif" }}>{agent.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px' }}>Chain: {agent.chain}</p>
                  </div>
                  <span className={`status ${agent.bound ? 'success' : 'pending'}`}>
                    {agent.bound ? 'Bound' : 'Pending'}
                  </span>
                </div>
                {agent.wallet && (
                  <div style={{ marginTop: '8px', fontFamily: "'Fira Code', monospace", fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Wallet: {agent.wallet.address.slice(0, 12)}...
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Mode Settings */}
        <section className="card">
          <div className="section-icon">⚙️</div>
          <h2>Approval Modes</h2>
          
          <div className="step">
            <div className="step-number">A</div>
            <div>
              <h3>Per-Transaction</h3>
              <p>Approve each transaction with passkey</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">B</div>
            <div>
              <h3>Auto-Sign</h3>
              <p>Pre-authorized grants within limits</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
