import { useEffect, useState } from 'react'

const COLORS = ['#f59e0b', '#9ca3af', '#cd7f32']
const LABELS = ['🥇', '🥈', '🥉']

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    color: ['#1E3A8A', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ffffff'][
      Math.floor(Math.random() * 6)
    ],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? '50%' : '0%',
  }))

  return (
    <div className="confetti-wrapper">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function FinalResults({ players, player }) {
  const [showConfetti, setShowConfetti] = useState(true)
  const sorted = [...players].sort((a, b) => b.score - a.score)
  const top3 = sorted.slice(0, 3)
  const myRank = sorted.findIndex((p) => p.id === player?.id) + 1

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 6000)
    return () => clearTimeout(t)
  }, [])

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div className="final-page">
      {showConfetti && <Confetti />}

      <div className="final-header">
        <div className="trophy">🏆</div>
        <h1>Game Over!</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginTop: 8 }}>
          {sorted.length} players competed · Thanks for playing!
        </p>
        {myRank > 0 && (
          <div
            style={{
              marginTop: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(41,184,102,0.15)',
              border: '1px solid rgba(41,184,102,0.3)',
              borderRadius: '100px',
              padding: '8px 20px',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            You finished{' '}
            <span style={{ color: 'var(--primary)', fontSize: 18 }}>#{myRank}</span>
            {myRank === 1 && ' 🎉'}
          </div>
        )}
      </div>

      {/* Podium */}
      {top3.length >= 1 && (
        <div className="podium">
          {podiumOrder.map((p, i) => {
            const rank = top3.indexOf(p)
            const sizeMap = [1, 0, 2]
            const actualRank = sizeMap[i]
            return (
              <div className="podium-item" key={p.id}>
                <div
                  className="podium-avatar"
                  style={{
                    background: COLORS[actualRank],
                    width: actualRank === 0 ? 68 : 52,
                    height: actualRank === 0 ? 68 : 52,
                    fontSize: actualRank === 0 ? 24 : 18,
                  }}
                >
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="podium-name">{p.name}</div>
                <div className="podium-score" style={{ color: COLORS[actualRank] }}>
                  {p.score} pts
                </div>
                <div
                  className="podium-block"
                  style={{
                    background: COLORS[actualRank],
                    height: actualRank === 0 ? 100 : actualRank === 1 ? 70 : 50,
                  }}
                >
                  {LABELS[actualRank]}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full leaderboard */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius)',
          padding: '24px',
        }}
      >
        <div className="leaderboard-title">Full Leaderboard</div>
        <div className="lb-list" style={{ maxHeight: 400 }}>
          {sorted.map((p, rank) => (
            <div key={p.id} className={`lb-item ${p.id === player?.id ? 'me' : ''}`}>
              <span
                className={`lb-rank ${rank === 0 ? 'gold' : rank === 1 ? 'silver' : rank === 2 ? 'bronze' : ''}`}
              >
                {rank < 3 ? LABELS[rank] : rank + 1}
              </span>
              <div
                className="lb-avatar"
                style={{ background: COLORS[rank] ?? 'var(--primary)' }}
              >
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="lb-name">
                {p.name} {p.id === player?.id && '(You)'}
              </span>
              <span className="lb-score">{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ marginTop: 24, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        Lendsqr Townhall · {new Date().getFullYear()}
      </p>
    </div>
  )
}
