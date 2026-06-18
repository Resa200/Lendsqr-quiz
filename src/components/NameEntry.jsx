import { useState } from 'react'

export default function NameEntry({ onJoin, gameState }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const isFinished = gameState?.status === 'finished'
  const isPlaying = gameState?.status === 'playing'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) return
    setLoading(true)
    await onJoin(trimmed)
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="card">
        <div className="logo">
          <div className="logo-mark">L</div>
          <span className="logo-text">Lendsqr <span>Quiz</span></span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ marginBottom: 8 }}>Townhall Quiz</h1>
          <p className="text-muted" style={{ fontSize: 15 }}>
            How well do you know your Lendsqr?
          </p>
        </div>

        {isFinished && (
          <div
            style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: 24,
              textAlign: 'center',
              fontSize: 14,
              color: 'var(--primary-dark)',
              fontWeight: 600,
            }}
          >
            This game has ended. Results are available after joining.
          </div>
        )}

        {isPlaying && (
          <div
            style={{
              background: '#fff8e6',
              border: '1px solid #f59e0b',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: 24,
              textAlign: 'center',
              fontSize: 14,
              color: '#92400e',
              fontWeight: 600,
            }}
          >
            Game is in progress — join to see the live leaderboard!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="e.g. Adebayo Okonkwo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoFocus
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim() || name.trim().length < 2 || loading}
          >
            {loading ? 'Joining...' : isPlaying ? 'Join as Spectator' : 'Join Game'}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          <p>20 questions · 30 seconds each · Live leaderboard</p>
        </div>
      </div>
    </div>
  )
}
