import { useState, useEffect } from 'react'
import { useAuth, useToast } from '../App'
import { generateWallet, storeWallet, getWallets } from '../lib/crypto'

const CHAINS = [
  { id: 'evm', label: 'Ethereum', icon: '⟠', desc: 'EVM compatible' },
  { id: 'solana', label: 'Solana', icon: '◎', desc: 'SPL tokens' },
  { id: 'hyperliquid', label: 'Hyperliquid', icon: '⚡', desc: 'Perps trading' },
]

export default function WalletsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [wallets, setWallets] = useState([])
  const [agents, setAgents] = useState([])
  const [selectedChain, setSelectedChain] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)

  useEffect(() => {
    if (user) {
      setWallets(getWallets(user.id))
      const stored = localStorage.getItem(`agents_${user.id}`)
      setAgents(stored ? JSON.parse(stored) : [])
      const saved = localStorage.getItem(`selected_wallet_${user.id}`)
      if (saved) setSelectedWallet(saved)
    }
  }, [user])

  const handleGenerate = async () => {
    if (!selectedChain) return
    setGenerating(true)
    try {
      const wallet = generateWallet(selectedChain)
      const updated = storeWallet(wallet, user.id)
      setWallets(updated)
      handleSelectWallet(wallet.address)
      toast('Wallet generated ✓')
    } catch (err) {
      toast('Generation failed: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = (e, address) => {
    e.stopPropagation()
    navigator.clipboard.writeText(address)
    toast('Address copied')
  }

  const handleSelectWallet = (address) => {
    const next = selectedWallet === address ? null : address
    setSelectedWallet(next)
    if (next) {
      localStorage.setItem(`selected_wallet_${user.id}`, next)
    } else {
      localStorage.removeItem(`selected_wallet_${user.id}`)
    }
  }

  const chainIcon = (chain) => CHAINS.find(c => c.id === chain)?.icon || '🔑'

  return (
    <div className="page animate-in">
      <h1 className="page-title">Wallets</h1>
      <p className="page-subtitle">Generate & manage wallets. Keys stay on-device.</p>

      <div className="section">
        <div className="section-label">New Wallet</div>
        <div className="card card-compact">
          <div className="select-wrap">
            <select className="select" value={selectedChain} onChange={e => setSelectedChain(e.target.value)}>
              <option value="">Select chain...</option>
              {CHAINS.map(c => (
                <option key={c.id} value={c.id}>{c.icon}  {c.label} — {c.desc}</option>
              ))}
            </select>
            <span className="select-arrow">▼</span>
          </div>
          <button className="btn btn-large btn-primary" onClick={handleGenerate} disabled={!selectedChain || generating}>
            {generating ? 'Generating...' : 'Generate Wallet'}
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-label">Your Wallets ({wallets.length})</div>

        {wallets.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-title">No wallets yet</div>
              <div className="empty-state-desc">Select a chain above and generate your first wallet</div>
            </div>
          </div>
        ) : (
          wallets.map((wallet, i) => {
            const isSelected = selectedWallet === wallet.address
            const boundAgents = agents.filter(a => a.wallet?.address === wallet.address)

            return (
              <div
                key={wallet.address || i}
                className={`list-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectWallet(wallet.address)}
              >
                <div className="list-item-icon">{chainIcon(wallet.chain)}</div>
                <div className="list-item-content">
                  <div className="list-item-title">
                    {wallet.chain.toUpperCase()}
                    {isSelected && <span style={{ marginLeft: 6, color: 'var(--status-success)', fontSize: 12 }}>● Active</span>}
                  </div>
                  <div className="list-item-desc mono" onClick={e => handleCopy(e, wallet.address)}>
                    {wallet.address.slice(0, 12)}...{wallet.address.slice(-6)}
                  </div>
                  {boundAgents.length > 0 && (
                    <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {boundAgents.map((a, j) => (
                        <span key={j} className="badge badge-success">{a.name}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="badge badge-info">Local</span>
              </div>
            )
          })
        )}
      </div>

      {agents.length > 0 && (
        <div className="section">
          <div className="section-label">Bound Agents ({agents.length})</div>
          {agents.map((agent, i) => (
            <div key={i} className="list-item" style={{ cursor: 'default' }}>
              <div className="list-item-icon" style={{
                background: agent.bound ? 'rgba(23,178,106,0.1)' : undefined
              }}>🤖</div>
              <div className="list-item-content">
                <div className="list-item-title">{agent.name}</div>
                <div className="list-item-desc">
                  {agent.chain} · {agent.wallet?.address?.slice(0, 10)}...
                </div>
              </div>
              <span className={`badge ${agent.bound ? 'badge-success' : 'badge-pending'}`}>
                {agent.bound ? 'Bound' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
