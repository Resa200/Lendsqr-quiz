import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import NameEntry from './components/NameEntry'
import Lobby from './components/Lobby'
import GameQuestion from './components/GameQuestion'
import FinalResults from './components/FinalResults'
import AdminPanel from './components/AdminPanel'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'lendsqr2025'

function isAdminRoute() {
  return new URLSearchParams(window.location.search).has('admin')
}

export default function App() {
  const [player, setPlayer] = useState(() => {
    const saved = sessionStorage.getItem('lsq_player')
    return saved ? JSON.parse(saved) : null
  })
  const [gameState, setGameState] = useState(null)
  const [players, setPlayers] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminAuthed, setAdminAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  // Admin auth check
  useEffect(() => {
    if (!isAdminRoute()) return
    setIsAdmin(true)
    const pwd = sessionStorage.getItem('lsq_admin')
    if (pwd === ADMIN_PASSWORD) setAdminAuthed(true)
  }, [])

  // Fetch initial game state
  const fetchGameState = useCallback(async () => {
    const { data } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()
    if (data) setGameState(data)
    setLoading(false)
  }, [])

  const fetchPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('score', { ascending: false })
    if (data) {
      setPlayers(data)
      // If current player no longer exists in DB (e.g. after a reset), clear session
      setPlayer((current) => {
        if (current && !data.find((p) => p.id === current.id)) {
          sessionStorage.removeItem('lsq_player')
          return null
        }
        return current
      })
    }
  }, [])

  useEffect(() => {
    fetchGameState()
    fetchPlayers()

    // Real-time: game state changes
    const gameChannel = supabase
      .channel('game_state_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_state', filter: 'id=eq.1' },
        (payload) => {
          setGameState(payload.new)
        }
      )
      .subscribe()

    // Real-time: player list / scores
    const playersChannel = supabase
      .channel('players_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        () => fetchPlayers()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(gameChannel)
      supabase.removeChannel(playersChannel)
    }
  }, [fetchGameState, fetchPlayers])

  const handleJoin = async (name) => {
    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('players')
      .insert({ id, name, score: 0 })
      .select()
      .single()

    if (error) {
      alert(`Could not join game.\n\nError: ${error.message}\nCode: ${error.code}\n\nMake sure the Supabase SQL setup has been run.`)
      return
    }

    const p = { id: data.id, name: data.name }
    sessionStorage.setItem('lsq_player', JSON.stringify(p))
    setPlayer(p)
  }

  const handleAdminLogin = (password) => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('lsq_admin', password)
      setAdminAuthed(true)
    } else {
      alert('Wrong password')
    }
  }

  if (loading) return <LoadingScreen />

  // Admin route
  if (isAdmin) {
    if (!adminAuthed) return <AdminLogin onLogin={handleAdminLogin} />
    return <AdminPanel gameState={gameState} players={players} />
  }

  // Player flow
  if (!player) return <NameEntry onJoin={handleJoin} gameState={gameState} />

  if (!gameState || gameState.status === 'waiting') {
    return <Lobby player={player} players={players} gameState={gameState} />
  }

  if (gameState.status === 'finished') {
    return <FinalResults players={players} player={player} />
  }

  // status === 'playing'
  return (
    <GameQuestion
      player={player}
      gameState={gameState}
      players={players}
    />
  )
}

function LoadingScreen() {
  return (
    <div className="page">
      <div className="logo" style={{ marginBottom: 0 }}>
        <div className="logo-mark">L</div>
        <span className="logo-text">Lendsqr <span>Quiz</span></span>
      </div>
      <p style={{ marginTop: 16, color: 'var(--gray)' }}>Loading...</p>
    </div>
  )
}

function AdminLogin({ onLogin }) {
  const [pwd, setPwd] = useState('')
  return (
    <div className="page">
      <div className="card">
        <div className="logo">
          <div className="logo-mark">L</div>
          <span className="logo-text">Lendsqr <span>Quiz</span></span>
        </div>
        <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Admin Access</h2>
        <div className="form-group">
          <label>Admin Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onLogin(pwd)}
            autoFocus
          />
        </div>
        <button className="btn btn-primary" onClick={() => onLogin(pwd)}>
          Enter Admin Panel
        </button>
      </div>
    </div>
  )
}
