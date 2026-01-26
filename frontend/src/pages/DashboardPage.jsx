import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";

const API_BASE = "/api/bookings";

function seatColor(status) {
  switch (status) {
    case "AVAILABLE":
      return "var(--seat-available)";
    case "RESERVED":
    case "OCCUPIED":
      return "var(--seat-occupied)";
    default:
      return "var(--seat-unknown)";
  }
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [seats, setSeats] = useState([]);
  const [newSeatNumber, setNewSeatNumber] = useState("");
  const [status, setStatus] = useState("A carregar...");
  const [error, setError] = useState(null);

  const availableCount = useMemo(
    () => seats.filter((s) => s.status === "AVAILABLE").length,
    [seats]
  );

  const fetchSeats = async () => {
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/seats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSeats(Array.isArray(data) ? data : []);
      setStatus("Conectado ✅");
    } catch (e) {
      setStatus("Erro de conexão ❌");
      setError(String(e?.message ?? e));
    }
  };

  useEffect(() => {
    fetchSeats();
  }, []);

  const handleCreateSeat = async (e) => {
    e.preventDefault();
    if (!newSeatNumber.trim()) return;

    try {
      const response = await apiFetch(
        `${API_BASE}/seats?number=${encodeURIComponent(newSeatNumber.trim())}`,
        { method: "POST" }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setNewSeatNumber("");
      await fetchSeats();
    } catch {
      alert("Erro ao criar assento");
    }
  };

  const handleReserveSeat = async (seatId) => {
    try {
      const response = await apiFetch(`${API_BASE}/seats/${seatId}/reserve`, {
        method: "POST",
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
      }

      await fetchSeats();
    } catch (err) {
      alert(err.message || "Erro ao reservar assento");
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">EMS</span>
          </div>
          <span className="header-divider" />
          <h1>Painel de Gestão</h1>
        </div>
        <div className="header-right">
          <span className="user-badge">
            <span className="user-icon">👤</span>
            {user?.username}
          </span>
          <button onClick={logout} className="logout-btn">
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="status-bar">
          <span className={`status-indicator ${error ? "error" : "success"}`}>
            {status}
          </span>
          {error && <span className="status-detail">{error}</span>}
        </div>

        <section className="card create-section">
          <h2>Criar Novo Assento</h2>
          <form onSubmit={handleCreateSeat} className="create-form">
            <input
              type="text"
              placeholder="Ex: A-12, B-5"
              value={newSeatNumber}
              onChange={(e) => setNewSeatNumber(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Criar
            </button>
            <button
              type="button"
              onClick={fetchSeats}
              className="btn-secondary"
            >
              Atualizar
            </button>
          </form>
        </section>

        <section className="card seats-section">
          <div className="seats-header">
            <h2>Mapa de Assentos</h2>
            <div className="seats-stats">
              <span className="stat">
                Total: <strong>{seats.length}</strong>
              </span>
              <span className="stat">
                Livres: <strong>{availableCount}</strong>
              </span>
            </div>
          </div>

          <div className="legend">
            <span className="legend-item">
              <span
                className="legend-color"
                style={{ background: "var(--seat-available)" }}
              />
              Livre
            </span>
            <span className="legend-item">
              <span
                className="legend-color"
                style={{ background: "var(--seat-occupied)" }}
              />
              Ocupado/Reservado
            </span>
          </div>

          <div className="seats-grid">
            {seats.map((seat) => (
              <button
                key={seat.id ?? seat.seatNumber}
                className={`seat ${seat.status === "AVAILABLE" ? "available" : "occupied"}`}
                style={{ "--seat-bg": seatColor(seat.status) }}
                title={`${seat.seatNumber} — ${seat.status}`}
                onClick={() =>
                  seat.status === "AVAILABLE" && handleReserveSeat(seat.id)
                }
                disabled={seat.status !== "AVAILABLE"}
              >
                {seat.seatNumber}
              </button>
            ))}
          </div>

          {seats.length === 0 && (
            <p className="empty-message">Nenhum assento encontrado.</p>
          )}
        </section>
      </main>
    </div>
  );
}