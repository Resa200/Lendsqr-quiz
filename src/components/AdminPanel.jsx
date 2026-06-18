import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { questions } from '../data/questions'

export default function AdminPanel({ gameState, players }) {
  const [loading, setLoading] = useState(false)
  const [answeredCount, setAnsweredCount] = useState(0)
  const status = gameState?.status ?? 'waiting'
  const qIndex = gameState?.current_question ?? 0
  const question = questions[qIndex]
  const sorted = [...players].sort((a, b) => b.score - a.score)

  useEffect(() => {
    if (status !== 'playing') return
    fetchAnsweredCount()
    const channel = supabase
      .channel('admin_answers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_answers' }, () => {
        fetchAnsweredCount()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [status, qIndex])

  const fetchAnsweredCount = async () => {
    const { count } = await supabase
      .from('player_answers')
      .select('*', { count: 'exact', head: true })
      .eq('question_index', qIndex)
    setAnsweredCount(count ?? 0)
  }

  const startGame = async () => {
    setLoading(true)
    await supabase.from('game_state').upsert({
      id: 1,
      status: 'playing',
      current_question: 0,
      question_started_at: new Date().toISOString(),
      show_answer: false,
    })
    setLoading(false)
  }

  const nextQuestion = async () => {
    setLoading(true)
    const next = qIndex + 1
    if (next >= questions.length) {
      await supabase.from('game_state').update({
        status: 'finished',
        show_answer: false,
      }).eq('id', 1)
    } else {
      await supabase.from('game_state').update({
        current_question: next,
        question_started_at: new Date().toISOString(),
        show_answer: false,
      }).eq('id', 1)
    }
    setLoading(false)
  }

  const revealAnswer = async () => {
    setLoading(true)
    await supabase.from('game_state').update({ show_answer: true }).eq('id', 1)
    setLoading(false)
  }

  const endGame = async () => {
    if (!window.confirm('End the game now? This will show the final leaderboard to everyone.')) return
    setLoading(true)
    await supabase.from('game_state').update({ status: 'finished' }).eq('id', 1)
    setLoading(false)
  }

  const resetGame = async () => {
    if (!window.confirm('Reset everything? This will delete all players and scores.')) return
    setLoading(true)
    await supabase.from('player_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('game_state').upsert({ id: 1, status: 'waiting', current_question: 0, show_answer: false, question_started_at: null })
    setLoading(false)
  }

  const answerPct = players.length > 0 ? (answeredCount / players.length) * 100 : 0

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="logo-mark">L</div>
          <span className="logo-text" style={{ color: 'white' }}>
            Lendsqr <span>Quiz</span>
          </span>
        </div>
        <span className="admin-badge">Admin Panel</span>
      </div>

      <div className="admin-grid">
        {/* Left column: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Game status */}
          <div className="admin-card">
            <h3>Game Status</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
              <div>
                <div className="stat-number">{players.length}</div>
                <div className="stat-label">Players joined</div>
              </div>
              <div style={{ marginLeft: 24 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: status === 'playing' ? 'var(--primary)' : status === 'finished' ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {status === 'waiting' ? 'Waiting' : status === 'playing' ? '▶ In Progress' : '✓ Finished'}
                </div>
                <div className="stat-label">Status</div>
              </div>
            </div>

            {status === 'waiting' && (
              <button
                className="admin-btn admin-btn-primary"
                onClick={startGame}
                disabled={loading}
              >
                🚀 Start Game ({players.length} players)
              </button>
            )}

            {status === 'playing' && (
              <button className="admin-btn admin-btn-danger" onClick={endGame} disabled={loading}>
                ⏹ End Game Early
              </button>
            )}

            <button
              onClick={resetGame}
              disabled={loading}
              style={{
                marginTop: 10,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.4)',
                borderRadius: 8,
                padding: '10px',
                fontSize: 13,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              ↺ Reset Everything
            </button>
          </div>

          {/* Current question controls */}
          {status === 'playing' && question && (
            <div className="admin-card">
              <h3>Current Question</h3>
              <div style={{ marginBottom: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Q{qIndex + 1} of {questions.length}
              </div>
              <div className="question-preview">{question.question}</div>

              <div className="answered-count">
                <span>{answeredCount} / {players.length} answered</span>
                <div className="answered-bar">
                  <div className="answered-fill" style={{ width: `${answerPct}%` }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={revealAnswer}
                  disabled={loading || gameState?.show_answer}
                  style={{ flex: 1, marginTop: 0, fontSize: 14, padding: '12px' }}
                >
                  👁 Reveal Answer
                </button>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={nextQuestion}
                  disabled={loading}
                  style={{ flex: 1, marginTop: 0, fontSize: 14, padding: '12px', background: 'var(--primary-dark)' }}
                >
                  {qIndex + 1 >= questions.length ? '🏁 Finish' : '⏭ Next Q'}
                </button>
              </div>
            </div>
          )}

          {status === 'finished' && (
            <div className="admin-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
              <h3 style={{ color: 'white', fontSize: 18 }}>Game Finished!</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 14 }}>
                Final leaderboard is showing for all players.
              </p>
            </div>
          )}
        </div>

        {/* Right column: leaderboard */}
        <div className="admin-card">
          <h3>Live Leaderboard</h3>
          {sorted.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
              No players yet
            </p>
          ) : (
            <div className="lb-list" style={{ maxHeight: 480 }}>
              {sorted.map((p, rank) => (
                <div key={p.id} className="lb-item">
                  <span
                    className={`lb-rank ${rank === 0 ? 'gold' : rank === 1 ? 'silver' : rank === 2 ? 'bronze' : ''}`}
                  >
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
                  </span>
                  <div className="lb-avatar">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="lb-name">{p.name}</span>
                  <span className="lb-score">{p.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick link reminder */}
      <div
        style={{
          marginTop: 24,
          maxWidth: 1100,
          margin: '24px auto 0',
          background: 'rgba(41,184,102,0.08)',
          border: '1px solid rgba(41,184,102,0.2)',
          borderRadius: 8,
          padding: '14px 20px',
          fontSize: 13,
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <strong style={{ color: 'var(--primary)' }}>Share with players:</strong>{' '}
        {window.location.origin} &nbsp;|&nbsp;
        <strong style={{ color: 'var(--primary)' }}>Admin URL:</strong>{' '}
        {window.location.origin}?admin
      </div>
    </div>
  )
}
