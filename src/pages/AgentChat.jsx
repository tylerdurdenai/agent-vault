import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const MOCK_AGENTS = [
  { id: 'alpha', name: 'Alpha Agent', status: 'online' },
  { id: 'beta', name: 'Beta Agent', status: 'idle' },
  { id: 'gamma', name: 'Gamma Agent', status: 'offline' }
]

export default function AgentChat() {
  const { agentId } = useParams()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, role: 'agent', text: 'Ready. Ask me to check balances, bindings, or policy limits.' }
  ])

  const activeAgent = useMemo(() => {
    if (!agentId) return null
    return MOCK_AGENTS.find(a => a.id === agentId) || { id: agentId, name: `Agent ${agentId}`, status: 'unknown' }
  }, [agentId])

  const send = () => {
    const text = message.trim()
    if (!text) return
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', text },
      { id: Date.now() + 1, role: 'agent', text: 'Received. (Demo chat UI only in this build.)' }
    ])
    setMessage('')
  }

  return (
    <div className="container">
      <h1>{activeAgent ? `Chat: ${activeAgent.name}` : 'Agent Chat'}</h1>

      {!activeAgent && (
        <div className="card">
          <p style={{ color: 'var(--text-secondary)' }}>Select an agent to start chatting.</p>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {MOCK_AGENTS.map(agent => (
              <Link key={agent.id} to={`/chat/${agent.id}`} className="btn btn-outline">
                {agent.name} · {agent.status}
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeAgent && (
        <>
          <div className="card" style={{ minHeight: 240, maxHeight: 360, overflow: 'auto' }}>
            {messages.map(m => (
              <div key={m.id} style={{ marginBottom: 10, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <span className={`badge ${m.role === 'user' ? 'badge-success' : ''}`}>{m.role}</span>
                <div style={{ marginTop: 6 }}>{m.text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)' }}
            />
            <button className="btn btn-primary" onClick={send}>Send</button>
          </div>

          <Link to="/chat" className="btn btn-outline" style={{ marginTop: 12, display: 'inline-block' }}>
            Back to agent list
          </Link>
        </>
      )}
    </div>
  )
}
