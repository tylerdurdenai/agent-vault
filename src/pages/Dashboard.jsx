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
      // Load bound agents (from localStorage for now)
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
        <h1>🔐 AgentVault</h1>
        <nav className="nav">
          <Link to="/dashboard" className="nav-link active">Wallets</Link>
          <Link to="/bind" className="nav-link">Bind Agent</Link>
          <Link to="/approve" className="nav-link">Approve</Link>
          <button onClick={logout} className="nav-link">Logout</button>
        </nav>
      </header>

      <div className="container">
        {/* Wallets Section */}
        <section className="card">
          <h2>💳 Your Wallets</h2>
          <p>Generate wallets locally. Keys never leave your device.</p>

          {wallets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>No wallets yet</p>
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

          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '0.9rem' }}>Generate new wallet:</p>
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
          <h2>🤖 Bound Agents</h2>
          <p>Agents connected to your wallets</p>

          {agents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>No agents bound yet</p>
              <Link to="/bind" className="btn btn-primary">
                Bind Agent
              </Link>
            </div>
          ) : (
            agents.map((agent, i) => (
              <div key={i} className={`agent-card ${agent.bound ? 'bound' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{agent.name}</h3>
                    <p style={{ margin: 0 }}>Chain: {agent.chain}</p>
                  </div>
                  <span className={`status ${agent.bound ? 'success' : 'pending'}`}>
                    {agent.bound ? 'Bound' : 'Pending'}
                  </span>
                </div>
                {agent.wallet && (
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Wallet: {agent.wallet.address.slice(0, 12)}...
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Mode Settings */}
        <section className="card">
          <h2>⚙️ Approval Modes</h2>
          
          <div className="step">
            <div className="step-number">A</div>
            <div>
              <h3>Mode A - Per-Transaction</h3>
              <p>Approve each transaction with passkey</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">B</div>
            <div>
              <h3>Mode B - Auto-Sign</h3>
              <p>Pre-authorized grants within limits</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
