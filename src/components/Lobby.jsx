export default function Lobby({ player, players, gameState }) {
  const initials = (name) => name.slice(0, 2).toUpperCase()

  return (
    <div className="page">
      <div className="card card-wide">
        <div className="logo">
          <div className="logo-mark">L</div>
          <span className="logo-text">Lendsqr <span>Quiz</span></span>
        </div>

        <div className="lobby-header">
          <h1>Game Lobby</h1>
          <p className="text-muted" style={{ marginTop: 8, fontSize: 15 }}>
            Waiting for the host to start the game...
          </p>

          <div className="player-count">
            <span className="count">{players.length}</span>
            <span style={{ fontSize: 16, color: 'var(--gray)' }}>
              {players.length === 1 ? 'player' : 'players'} joined
            </span>
          </div>
        </div>

        <div className="players-grid">
          {players.map((p) => (
            <div className="player-chip" key={p.id}>
              <div
                className="player-avatar"
                style={{
                  background: p.id === player.id ? 'var(--primary-dark)' : 'var(--primary)',
                }}
              >
                {initials(p.name)}
              </div>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
                {p.id === player.id && (
                  <span style={{ fontSize: 11, color: 'var(--primary-dark)', display: 'block' }}>
                    You
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="waiting-indicator">
          <span className="pulse" />
          Hang tight! The game will start any moment now.
        </div>

        <div
          style={{
            marginTop: 20,
            padding: '14px 16px',
            background: 'var(--primary-light)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            color: 'var(--primary-dark)',
            textAlign: 'center',
          }}
        >
          <strong>Tip:</strong> Keep this tab open and stay on this page. The quiz will start
          automatically when the host begins!
        </div>
      </div>
    </div>
  )
}
