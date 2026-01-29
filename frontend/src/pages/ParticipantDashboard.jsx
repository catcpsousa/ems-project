import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import { useSeatWebSocket } from "../hooks/useSeatWebSocket";

const API_BASE = "/api/bookings";

function seatColor(status) {
  switch (status) {
    case "AVAILABLE":
      return "var(--seat-available)";
    case "LOCKED":
      return "var(--seat-locked)";
    case "BOOKED":
      return "var(--seat-booked)";
    default:
      return "var(--seat-unknown)";
  }
}

function statusLabel(status) {
  switch (status) {
    case "AVAILABLE":
      return "Livre";
    case "LOCKED":
      return "Bloqueado";
    case "BOOKED":
      return "Reservado";
    default:
      return status;
  }
}

export default function ParticipantDashboard() {
  const { user, logout } = useAuth();
  const [seats, setSeats] = useState([]);
  const [status, setStatus] = useState("A carregar...");
  const [error, setError] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const availableCount = useMemo(
    () => seats.filter((s) => s.status === "AVAILABLE").length,
    [seats]
  );

  const fetchSeats = useCallback(async () => {
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
  }, []);

  const handleSeatUpdate = useCallback((update) => {
    setSeats((prev) =>
      prev.map((seat) =>
        seat.id === update.seatId
          ? { ...seat, status: update.status, lockedBy: update.lockedBy }
          : seat
      )
    );
  }, []);

  const handleRefresh = useCallback(() => {
    fetchSeats();
  }, [fetchSeats]);

  useSeatWebSocket(handleSeatUpdate, handleRefresh);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const handleLockSeat = async (seatId) => {
    setActionLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/seats/${seatId}/lock`, {
        method: "POST",
      });
      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
      }
      const seat = await response.json();
      setSelectedSeat(seat);
      await fetchSeats();
    } catch (err) {
      alert(err.message || "Erro ao bloquear assento");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSeat) return;
    setActionLoading(true);
    try {
      const response = await apiFetch(
        `${API_BASE}/seats/${selectedSeat.id}/confirm`,
        { method: "POST" }
      );
      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
      }
      setSelectedSeat(null);
      await fetchSeats();
      alert("Reserva confirmada com sucesso!");
    } catch (err) {
      alert(err.message || "Erro ao confirmar reserva");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseSeat = async () => {
    if (!selectedSeat) return;
    setActionLoading(true);
    try {
      const response = await apiFetch(
        `${API_BASE}/seats/${selectedSeat.id}/release`,
        { method: "POST" }
      );
      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
      }
      setSelectedSeat(null);
      await fetchSeats();
    } catch (err) {
      alert(err.message || "Erro ao libertar assento");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status === "AVAILABLE") {
      handleLockSeat(seat.id);
    } else if (seat.status === "LOCKED" && seat.lockedBy === user?.username) {
      setSelectedSeat(seat);
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
          <h1>Reservar Lugares</h1>
        </div>
        <div className="header-right">
          <span className="user-badge participant-badge">
            <span className="user-icon">🎫</span>
            {user?.fullName || user?.username}
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

        {selectedSeat && (
          <section className="card confirmation-section">
            <h2>Confirmar Reserva</h2>
            <p>
              Assento <strong>{selectedSeat.seatNumber}</strong> bloqueado.
            </p>
            <p className="timer-warning">
              ⏱️ Tens 10 minutos para confirmar a reserva.
            </p>
            <div className="confirmation-actions">
              <button
                onClick={handleConfirmBooking}
                className="btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? "A processar..." : "Confirmar Reserva"}
              </button>
              <button
                onClick={handleReleaseSeat}
                className="btn-secondary"
                disabled={actionLoading}
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

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
              <span className="legend-color" style={{ background: "var(--seat-available)" }} />
              Livre
            </span>
            <span className="legend-item">
              <span className="legend-color" style={{ background: "var(--seat-locked)" }} />
              Bloqueado
            </span>
            <span className="legend-item">
              <span className="legend-color" style={{ background: "var(--seat-booked)" }} />
              Reservado
            </span>
          </div>

          <div className="seats-grid">
            {seats.map((seat) => (
              <button
                key={seat.id ?? seat.seatNumber}
                className={`seat ${seat.status.toLowerCase()} ${
                  seat.lockedBy === user?.username ? "mine" : ""
                }`}
                style={{ "--seat-bg": seatColor(seat.status) }}
                title={`${seat.seatNumber} — ${statusLabel(seat.status)}${
                  seat.lockedBy ? ` (${seat.lockedBy})` : ""
                }`}
                onClick={() => handleSeatClick(seat)}
                disabled={
                  seat.status === "BOOKED" ||
                  (seat.status === "LOCKED" && seat.lockedBy !== user?.username)
                }
              >
                {seat.seatNumber}
              </button>
            ))}
          </div>

          {seats.length === 0 && (
            <p className="empty-message">Nenhum assento disponível.</p>
          )}
        </section>
      </main>
    </div>
  );
}