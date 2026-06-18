import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { questions, QUESTION_TIME, MAX_POINTS, SPEED_BONUS } from '../data/questions'

const LETTERS = ['A', 'B', 'C', 'D']

export default function GameQuestion({ player, gameState, players }) {
  const qIndex = gameState.current_question ?? 0
  const question = questions[qIndex]
  const showAnswer = gameState.show_answer ?? false

  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [answered, setAnswered] = useState(false)
  const [result, setResult] = useState(null) // { correct, points }
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Reset state when question changes
  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    setResult(null)
    setSubmitted(false)
    setTimeLeft(QUESTION_TIME)

    const startedAt = gameState.question_started_at
      ? new Date(gameState.question_started_at).getTime()
      : Date.now()

    startTimeRef.current = startedAt

    // Sync timer with server start time
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    const remaining = Math.max(0, QUESTION_TIME - elapsed)
    setTimeLeft(remaining)
  }, [qIndex, gameState.question_started_at])

  // Countdown timer
  useEffect(() => {
    if (answered || showAnswer) return

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          if (!submitted) handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [answered, showAnswer, qIndex, submitted])

  const handleTimeout = useCallback(async () => {
    if (submitted) return
    setSubmitted(true)
    setAnswered(true)
    setResult({ correct: false, points: 0, timeout: true })

    await supabase.from('player_answers').upsert({
      player_id: player.id,
      question_index: qIndex,
      selected_option: null,
      is_correct: false,
      points: 0,
      time_taken: QUESTION_TIME,
    })
  }, [player.id, qIndex, submitted])

  const handleSelect = useCallback(
    async (optionIndex) => {
      if (answered || submitted) return
      clearInterval(timerRef.current)

      const timeTaken = (Date.now() - startTimeRef.current) / 1000
      const isCorrect = optionIndex === question.correct
      const speedRatio = Math.max(0, 1 - timeTaken / QUESTION_TIME)
      const points = isCorrect
        ? Math.round(MAX_POINTS + SPEED_BONUS * speedRatio)
        : 0

      setSelected(optionIndex)
      setAnswered(true)
      setSubmitted(true)
      setResult({ correct: isCorrect, points, timeout: false })

      await supabase.from('player_answers').upsert({
        player_id: player.id,
        question_index: qIndex,
        selected_option: optionIndex,
        is_correct: isCorrect,
        points,
        time_taken: timeTaken,
      })

      if (points > 0) {
        await supabase.rpc('increment_score', { p_id: player.id, amount: points })
      }
    },
    [answered, submitted, question, player.id, qIndex]
  )

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 5)
  const urgentTime = timeLeft <= 10
  const pct = (timeLeft / QUESTION_TIME) * 100

  if (!question) return null

  return (
    <div className="question-page">
      {/* Top bar */}
      <div className="question-top">
        <span className="q-number">
          Question {qIndex + 1} / {questions.length}
        </span>
        <span className="q-category">{question.category}</span>
      </div>

      {/* Timer */}
      <div className="timer-bar-wrap">
        <div className="timer-row">
          <span className="timer-label">Time remaining</span>
          <span className={`timer-count ${urgentTime ? 'urgent' : ''}`}>{timeLeft}s</span>
        </div>
        <div className="timer-bar">
          <div
            className={`timer-fill ${urgentTime ? 'urgent' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Question + Options */}
      <div className="question-body">
        <p className="question-text">{question.question}</p>

        <div className="options-grid">
          {question.options.map((opt, i) => {
            let cls = 'option-btn'
            if (showAnswer || answered) {
              if (i === question.correct) cls += ' correct'
              else if (i === selected && !result?.correct) cls += ' wrong'
            } else if (i === selected) {
              cls += ' selected'
            }

            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleSelect(i)}
                disabled={answered || showAnswer}
              >
                <span className="option-letter">{LETTERS[i]}</span>
                {opt}
              </button>
            )
          })}
        </div>

        {/* Result feedback */}
        {result && (
          <div className={`answer-result ${result.timeout ? 'timeout' : result.correct ? 'correct' : 'wrong'}`}>
            {result.timeout ? (
              <>
                <div className="result-emoji">⏰</div>
                <div className="result-msg">Time's up!</div>
                <div className="result-points">
                  Correct answer: {question.options[question.correct]}
                </div>
              </>
            ) : result.correct ? (
              <>
                <div className="result-emoji">🎉</div>
                <div className="result-msg">Correct!</div>
                <div className="result-points">+{result.points} points</div>
              </>
            ) : (
              <>
                <div className="result-emoji">❌</div>
                <div className="result-msg">Wrong answer</div>
                <div className="result-points">
                  Correct: {question.options[question.correct]}
                </div>
              </>
            )}
          </div>
        )}

        {/* Mini leaderboard */}
        {(answered || showAnswer) && sortedPlayers.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div className="leaderboard-title">Live Leaderboard</div>
            <div className="lb-list">
              {sortedPlayers.map((p, rank) => (
                <div
                  key={p.id}
                  className={`lb-item ${p.id === player.id ? 'me' : ''}`}
                >
                  <span className={`lb-rank ${rank === 0 ? 'gold' : rank === 1 ? 'silver' : rank === 2 ? 'bronze' : ''}`}>
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
                  </span>
                  <div
                    className="lb-avatar"
                    style={{ background: p.id === player.id ? 'var(--primary-dark)' : 'var(--primary)' }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="lb-name">
                    {p.name} {p.id === player.id && '(You)'}
                  </span>
                  <span className="lb-score">{p.score}</span>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Waiting for the next question...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
