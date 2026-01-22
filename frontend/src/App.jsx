import { useEffect, useMemo, useState } from 'react'

const API_BASE = 'http://localhost:8080/api/bookings'

function seatColor(status) {
  switch (status) {
    case 'AVAILABLE':
      return '#22c55e' // verde
    case 'RESERVED':
    case 'OCCUPIED':
      return '#ef4444' // vermelho
    default:
      return '#9ca3af' // cinzento
  }
}

function App() {
  const [seats, setSeats] = useState([])
  const [newSeatNumber, setNewSeatNumber] = useState('')
  const [status, setStatus] = useState('A carregar...')
  const [error, setError] = useState(null)

  const availableCount = useMemo(
    () => seats.filter(s => s.status === 'AVAILABLE').length,
    [seats],
  )

  const fetchSeats = async () => {
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/seats`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSeats(Array.isArray(data) ? data : [])
      setStatus('Conectado! ✅')
    } catch (e) {
      setStatus('Erro de conexão ❌')
      setError(String(e?.message ?? e))
    }
  }

  useEffect(() => {
    fetchSeats()
  }, [])

  const handleCreateSeat = async (e) => {
    e.preventDefault()
    if (!newSeatNumber.trim()) return

    try {
      const response = await fetch(`${API_BASE}/seats?number=${encodeURIComponent(newSeatNumber.trim())}`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      setNewSeatNumber('')
      await fetchSeats()
      alert(`Assento ${newSeatNumber} criado com sucesso!`)
    } catch {
      alert('Erro ao criar assento (confirma o endpoint do backend)')
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', width: 'min(1000px, 95vw)' }}>
      <h1>EMS - Painel de Gestão</h1>
      <p>Status: <strong>{status}</strong></p>
      {error && <p style={{ color: '#ef4444' }}>Detalhe: {error}</p>}

      <hr />

      <section style={{ marginBottom: 24 }}>
        <h3>Criar Novo Assento</h3>
        <form onSubmit={handleCreateSeat}>
          <input
            type="text"
            placeholder="Ex: B12"
            value={newSeatNumber}
            onChange={(e) => setNewSeatNumber(e.target.value)}
            style={{ padding: 8, marginRight: 10 }}
          />
          <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Criar Assento
          </button>

          <button type="button" onClick={fetchSeats} style={{ padding: '8px 16px', cursor: 'pointer', marginLeft: 10 }}>
            Atualizar Mapa
          </button>
        </form>
      </section>

      <section>
        <h3>Mapa de Assentos</h3>
        <p style={{ marginTop: 0 }}>
          Total: <strong>{seats.length}</strong> — Livres: <strong>{availableCount}</strong>
        </p>

        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#22c55e', marginRight: 6 }} /> Livre</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#ef4444', marginRight: 6 }} /> Ocupado/Reservado</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
            gap: 10,
          }}
        >
          {seats.map((seat) => (
            <div
              key={seat.id ?? seat.seatNumber}
              title={`${seat.seatNumber} — ${seat.status}`}
              style={{
                background: seatColor(seat.status),
                color: '#111827',
                borderRadius: 8,
                padding: '14px 8px',
                textAlign: 'center',
                fontWeight: 700,
                border: '2px solid rgba(0,0,0,0.15)',
                userSelect: 'none',
              }}
            >
              {seat.seatNumber}
            </div>
          ))}
        </div>

        {seats.length === 0 && <p>Nenhum assento encontrado.</p>}
      </section>
    </div>
  )
}

export default App