import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import { useSeatWebSocket } from "../hooks/useSeatWebSocket";
import "./OrganizerDashboard.css";
import EventMap from '../components/EventMap';

// Componente Stepper para criar evento
function EventWizard({ onClose, onEventCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    coverImage: "",
    startTime: "",
    endTime: "",
    location: "",
    onlineLink: "",
    hasSeating: true,
    capacity: 100,
    seatRows: 10,
    seatColumns: 10,
    ticketPrice: 0,
  });

  const categories = [
    "Conferência",
    "Workshop",
    "Concerto",
    "Teatro",
    "Desporto",
    "Networking",
    "Outro",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.title.trim()) return "O título é obrigatório";
      if (!formData.category) return "A categoria é obrigatória";
    }
    if (step === 2) {
      if (!formData.startTime) return "A data de início é obrigatória";
      if (!formData.location && !formData.onlineLink) {
        return "Indica uma localização ou link online";
      }
    }
    return null;
  };

  const nextStep = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(step + 1);
    setError("");
  };

  const handleSubmit = async (publish = false) => {
    setLoading(true);
    setError("");
    try {
      // Garantir que seatRows e seatColumns são números válidos
      const seatRows = parseInt(formData.seatRows);
      const seatColumns = parseInt(formData.seatColumns);
      
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        coverImage: formData.coverImage,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        location: formData.location,
        onlineLink: formData.onlineLink,
        hasSeating: formData.hasSeating === true,
        capacity: parseInt(formData.capacity) || 100,
        seatRows: formData.hasSeating ? (isNaN(seatRows) ? 10 : seatRows) : null,
        seatColumns: formData.hasSeating ? (isNaN(seatColumns) ? 10 : seatColumns) : null,
        ticketPrice: parseFloat(formData.ticketPrice) || 0,
      };

      console.log("📤 Creating event with payload:", JSON.stringify(payload, null, 2));

      const res = await apiFetch("/api/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Erro ao criar evento");
      }

      const event = await res.json();
      console.log("✅ Event created:", event);

      if (publish) {
        const publishRes = await apiFetch(`/api/events/${event.id}/publish`, { method: "POST" });
        if (!publishRes.ok) throw new Error("Evento criado, mas erro ao publicar");
        console.log("✅ Event published");
      }

      onEventCreated();
      onClose();
    } catch (error) {
      console.error("❌ Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wizard-modal">
        <div className="wizard-header">
          <h2>🎉 Criar Novo Evento</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="stepper">
          {[
            { num: 1, label: "Geral" },
            { num: 2, label: "Logística" },
            { num: 3, label: "Lotação" },
          ].map((s, i) => (
            <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {i > 0 && <div className="step-line" />}
              <div className={`step ${step >= s.num ? "active" : ""}`}>
                <span className="step-number">{s.num}</span>
                <span className="step-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="wizard-content">
          {error && (
            <div style={{
              padding: "0.75rem 1rem",
              background: "#fee2e2",
              color: "#dc2626",
              borderRadius: "8px",
              marginBottom: "1rem",
              fontSize: "0.9rem"
            }}>
              ⚠️ {error}
            </div>
          )}

          {step === 1 && (
            <div className="wizard-step">
              <div className="form-group">
                <label>Título do Evento *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Conferência de Tecnologia 2026"
                />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descreva o seu evento em detalhe..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Categoria *</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>URL da Imagem de Capa</label>
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <div className="form-row">
                <div className="form-group">
                  <label>📅 Data/Hora de Início *</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>🏁 Data/Hora de Fim</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>📍 Localização (evento presencial)</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Morada ou nome do local"
                />
              </div>
              <div className="form-group">
                <label>🔗 Link (evento online)</label>
                <input
                  type="url"
                  name="onlineLink"
                  value={formData.onlineLink}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="hasSeating"
                    checked={formData.hasSeating}
                    onChange={handleChange}
                  />
                  🪑 Evento com lugares marcados
                </label>
              </div>

              {formData.hasSeating ? (
                <div className="seating-config">
                  <h4>🎭 Configuração do Mapa de Assentos</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Número de Filas (A-Z)</label>
                      <input
                        type="number"
                        name="seatRows"
                        value={formData.seatRows}
                        onChange={handleChange}
                        min={1}
                        max={26}
                      />
                    </div>
                    <div className="form-group">
                      <label>Lugares por Fila</label>
                      <input
                        type="number"
                        name="seatColumns"
                        value={formData.seatColumns}
                        onChange={handleChange}
                        min={1}
                        max={50}
                      />
                    </div>
                  </div>
                  <p className="seat-preview">
                    🎟️ Total: <strong>{formData.seatRows * formData.seatColumns}</strong> lugares
                    (Fila A até {String.fromCharCode(64 + Math.min(Number(formData.seatRows) || 1, 26))}, 
                    Lugares 1-{formData.seatColumns})
                  </p>
                </div>
              ) : (
                <div className="form-group">
                  <label>👥 Capacidade Total</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min={1}
                  />
                </div>
              )}

              <div className="form-group">
                <label>💰 Preço do Bilhete (€)</label>
                <input
                  type="number"
                  name="ticketPrice"
                  value={formData.ticketPrice}
                  onChange={handleChange}
                  min={0}
                  step={0.01}
                  placeholder="0 = Gratuito"
                />
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {step > 1 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)} disabled={loading}>
              ← Anterior
            </button>
          )}
          {step < 3 ? (
            <button className="btn-primary" onClick={nextStep}>
              Próximo →
            </button>
          ) : (
            <>
              <button
                className="btn-secondary"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                {loading ? "A guardar..." : "💾 Guardar Rascunho"}
              </button>
              <button
                className="btn-primary"
                onClick={() => handleSubmit(true)}
                disabled={loading}
              >
                {loading ? "A publicar..." : "🚀 Publicar Evento"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de Mapa de Assentos
function SeatMap({ seats }) {
  if (!seats || seats.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
        <p>🪑 Sem mapa de assentos disponível.</p>
      </div>
    );
  }

  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.seatNumber.charAt(0);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case "AVAILABLE": return "#4ade80";
      case "LOCKED": return "#fbbf24";
      case "BOOKED": return "#ef4444";
      default: return "#9ca3af";
    }
  };

  return (
    <div className="seat-map">
      <div className="seat-legend">
        <span><span className="legend-dot" style={{ background: "#4ade80" }} /> Disponível</span>
        <span><span className="legend-dot" style={{ background: "#fbbf24" }} /> Em reserva</span>
        <span><span className="legend-dot" style={{ background: "#ef4444" }} /> Reservado</span>
      </div>
      <div className="seat-grid">
        {Object.entries(seatsByRow).sort().map(([row, rowSeats]) => (
          <div key={row} className="seat-row">
            <span className="row-label">{row}</span>
            {rowSeats
              .sort((a, b) => parseInt(a.seatNumber.slice(1)) - parseInt(b.seatNumber.slice(1)))
              .map((seat) => (
                <div
                  key={seat.id}
                  className="seat"
                  style={{ backgroundColor: getStatusColor(seat.status) }}
                  title={`${seat.seatNumber} - ${seat.status}${seat.lockedBy ? ` (${seat.lockedBy})` : ""}`}
                >
                  {seat.seatNumber.slice(1)}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente Principal
export default function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("events");
  const [showWizard, setShowWizard] = useState(false);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [eventSeats, setEventSeats] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ startTime: "", endTime: "" });
  const [messageText, setMessageText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleSeatUpdate = useCallback((update) => {
    setNotifications((prev) => [
      { id: Date.now(), ...update, timestamp: new Date() },
      ...prev.slice(0, 9),
    ]);
    if (selectedEvent) {
      fetchEventSeats(selectedEvent.id);
    }
  }, [selectedEvent]);

  useSeatWebSocket(handleSeatUpdate, () => {
    if (selectedEvent) fetchEventSeats(selectedEvent.id);
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, statsRes] = await Promise.all([
        apiFetch("/api/events/my-events"),
        apiFetch("/api/events/dashboard-stats"),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      } else {
        console.warn("Não foi possível carregar eventos");
        setEvents([]);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setStats({ totalEvents: 0, totalBookings: 0, averageOccupancy: 0, totalRevenue: 0 });
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados. Verifica a tua conexão.");
      setEvents([]);
      setStats({ totalEvents: 0, totalBookings: 0, averageOccupancy: 0, totalRevenue: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStats = async (eventId) => {
    try {
      const res = await apiFetch(`/api/events/${eventId}/stats`);
      if (res.ok) setEventStats(await res.json());
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    }
  };

  const fetchEventSeats = async (eventId) => {
    try {
      const res = await apiFetch(`/api/events/${eventId}/seats`);
      if (res.ok) setEventSeats(await res.json());
    } catch (err) {
      console.error("Erro ao carregar assentos:", err);
    }
  };

  const fetchParticipants = async (eventId) => {
    try {
      const res = await apiFetch(`/api/events/${eventId}/participants`);
      if (res.ok) setParticipants(await res.json());
    } catch (err) {
      console.error("Erro ao carregar participantes:", err);
    }
  };

  const selectEvent = (event) => {
    setSelectedEvent(event);
    fetchEventStats(event.id);
    fetchEventSeats(event.id);
    fetchParticipants(event.id);
    setActiveTab("details");
  };

  const publishEvent = async (eventId) => {
    try {
      const res = await apiFetch(`/api/events/${eventId}/publish`, { method: "POST" });
      if (res.ok) {
        fetchDashboardData();
        if (selectedEvent?.id === eventId) {
          setSelectedEvent({ ...selectedEvent, status: "PUBLISHED" });
        }
      }
    } catch (err) {
      console.error("Erro ao publicar:", err);
    }
  };

  const cancelEvent = async (eventId) => {
    if (!confirm("Tens a certeza que queres cancelar este evento?")) return;
    try {
      const res = await apiFetch(`/api/events/${eventId}/cancel`, { method: "POST" });
      if (res.ok) {
        fetchDashboardData();
        if (selectedEvent?.id === eventId) {
          setSelectedEvent({ ...selectedEvent, status: "CANCELLED" });
        }
      }
    } catch (err) {
      console.error("Erro ao cancelar:", err);
    }
  };

  const exportParticipants = () => {
    if (participants.length === 0) {
      alert("Não há participantes para exportar.");
      return;
    }
    const csv = [
      ["Nome", "Email", "Username", "Lugar"].join(","),
      ...participants.map((p) =>
        [p.fullName || "", p.email || "", p.username || "", p.seatNumber || ""].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participantes-${selectedEvent?.title?.replace(/\s+/g, "-") || "evento"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      DRAFT: { label: "Rascunho", class: "status-draft" },
      PUBLISHED: { label: "Publicado", class: "status-published" },
      CANCELLED: { label: "Cancelado", class: "status-cancelled" },
      COMPLETED: { label: "Terminado", class: "status-completed" },
    };
    const s = statusMap[status] || { label: status, class: "" };
    return <span className={`status-badge ${s.class}`}>{s.label}</span>;
  };

  const handleReschedule = async () => {
    if (!rescheduleData.startTime) {
      alert("Por favor, indica a nova data/hora de início.");
      return;
    }
    
    setActionLoading(true);
    try {
      const payload = {
        startTime: new Date(rescheduleData.startTime).toISOString(),
        endTime: rescheduleData.endTime ? new Date(rescheduleData.endTime).toISOString() : null,
      };
      
      const res = await apiFetch(`/api/events/${selectedEvent.id}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setSelectedEvent(updated);
        fetchDashboardData();
        setShowRescheduleModal(false);
        setRescheduleData({ startTime: "", endTime: "" });
        alert("Horário atualizado com sucesso! Os participantes serão notificados.");
      } else {
        const error = await res.text();
        alert("Erro ao atualizar horário: " + error);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar horário.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert("Por favor, escreve uma mensagem.");
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/events/${selectedEvent.id}/message`, {
        method: "POST",
        body: JSON.stringify({ message: messageText }),
      });
      
      if (res.ok) {
        setShowMessageModal(false);
        setMessageText("");
        alert("Mensagem enviada a todos os participantes!");
      } else {
        const error = await res.text();
        alert("Erro ao enviar mensagem: " + error);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao enviar mensagem.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="organizer-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">EMS</span>
          </div>
          <span className="header-divider" />
          <h1>Painel do Organizador</h1>
        </div>
        <div className="header-right">
          {notifications.length > 0 && (
            <span 
              className="notification-badge" 
              title="Ver notificações"
              onClick={() => setActiveTab("notifications")}
            >
              🔔 {notifications.length}
            </span>
          )}
          <span className="user-badge organizer-badge">
            <span className="user-icon">📅</span>
            {user?.fullName || user?.username}
          </span>
          <button onClick={logout} className="logout-btn">Sair</button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* KPIs */}
        <div className="organizer-stats">
          <div className="stat-card">
            <h3>📊 Meus Eventos</h3>
            <p className="stat-number">{stats?.totalEvents ?? 0}</p>
          </div>
          <div className="stat-card">
            <h3>🎟️ Total Reservas</h3>
            <p className="stat-number">{stats?.totalBookings ?? 0}</p>
          </div>
          <div className="stat-card">
            <h3>📈 Taxa de Ocupação</h3>
            <p className="stat-number">{(stats?.averageOccupancy ?? 0).toFixed(1)}%</p>
          </div>
          <div className="stat-card highlight">
            <h3>💰 Receita Total</h3>
            <p className="stat-number">{(stats?.totalRevenue ?? 0).toFixed(2)}€</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "events" ? "active" : ""}`}
            onClick={() => { setActiveTab("events"); setSelectedEvent(null); }}
          >
            📋 Meus Eventos
          </button>
          {selectedEvent && (
            <button 
              className={`tab ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              📊 {selectedEvent.title}
            </button>
          )}
          <button
            className={`tab ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            🔔 Alertas {notifications.length > 0 && `(${notifications.length})`}
          </button>
          <button className="tab btn-create" onClick={() => setShowWizard(true)}>
            ➕ Criar Evento
          </button>
        </div>

        {/* Main Content */}
        <section className="main-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>A carregar...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <p className="empty-icon">⚠️</p>
              <p className="empty-message">{error}</p>
              <button className="btn-primary" onClick={fetchDashboardData}>
                Tentar Novamente
              </button>
            </div>
          ) : activeTab === "events" ? (
            <>
              <h2>Os Meus Eventos</h2>
              {events.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">🎪</p>
                  <p className="empty-message">Ainda não criaste nenhum evento.</p>
                  <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>
                    Cria o teu primeiro evento e começa a vender bilhetes!
                  </p>
                  <button className="btn-primary" onClick={() => setShowWizard(true)}>
                    ➕ Criar Primeiro Evento
                  </button>
                </div>
              ) : (
                <div className="events-grid">
                  {events.map((event) => (
                    <div key={event.id} className="event-card" onClick={() => selectEvent(event)}>
                      {event.coverImage ? (
                        <img src={event.coverImage} alt={event.title} className="event-cover" />
                      ) : (
                        <div className="event-cover" style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          fontSize: "3rem"
                        }}>
                          🎭
                        </div>
                      )}
                      <div className="event-card-content">
                        <h3>{event.title}</h3>
                        <p className="event-category">{event.category}</p>
                        <p className="event-date">
                          📅 {event.startTime 
                            ? new Date(event.startTime).toLocaleDateString("pt-PT", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "Data a definir"}
                        </p>
                        {getStatusBadge(event.status)}
                        <div className="event-actions">
                          {event.status === "DRAFT" && (
                            <button
                              className="btn-sm btn-primary"
                              onClick={(e) => { e.stopPropagation(); publishEvent(event.id); }}
                            >
                              🚀 Publicar
                            </button>
                          )}
                          {event.status !== "CANCELLED" && (
                            <button
                              className="btn-sm btn-danger"
                              onClick={(e) => { e.stopPropagation(); cancelEvent(event.id); }}
                            >
                              ❌ Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === "details" && selectedEvent ? (
            <div className="event-details">
              <div className="details-header">
                <h2>{selectedEvent.title}</h2>
                {getStatusBadge(selectedEvent.status)}
              </div>

              {eventStats && (
                <div className="event-stats-grid">
                  <div className="mini-stat">
                    <span className="mini-stat-value">{eventStats.totalSeats}</span>
                    <span className="mini-stat-label">Total Lugares</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value">{eventStats.bookedSeats}</span>
                    <span className="mini-stat-label">Reservados</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value">{eventStats.lockedSeats}</span>
                    <span className="mini-stat-label">Em Reserva</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value">{eventStats.availableSeats}</span>
                    <span className="mini-stat-label">Disponíveis</span>
                  </div>
                  <div className="mini-stat highlight">
                    <span className="mini-stat-value">{(eventStats.occupancyRate ?? 0).toFixed(1)}%</span>
                    <span className="mini-stat-label">Ocupação</span>
                  </div>
                  <div className="mini-stat highlight">
                    <span className="mini-stat-value">{(eventStats.totalRevenue ?? 0).toFixed(2)}€</span>
                    <span className="mini-stat-label">Receita</span>
                  </div>
                </div>
              )}
              {/* ADICIONAR AQUI - Informações do Evento + Mapa */}
              <div className="event-info-section" style={{ 
                display: "grid", 
                gridTemplateColumns: selectedEvent.location ? "1fr 1fr" : "1fr",
                gap: "1.5rem",
                marginBottom: "1.5rem"
              }}>
                <div className="event-info-details">
                  <h3>📋 Informações do Evento</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                    <p><strong>📅 Data:</strong> {selectedEvent.startTime 
                      ? new Date(selectedEvent.startTime).toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "A definir"}</p>
                    <p><strong>📍 Local:</strong> {selectedEvent.location || "Online"}</p>
                    <p><strong>💰 Preço:</strong> {selectedEvent.ticketPrice > 0 
                      ? `€${Number(selectedEvent.ticketPrice).toFixed(2)}` 
                      : "Grátis"}</p>
                    <p><strong>🏷️ Categoria:</strong> {selectedEvent.category}</p>
                  </div>
                </div>
                
                {/* Mapa - só aparece se tiver localização física */}
                {selectedEvent.location && (
                  <div className="event-map-section">
                    <h3>🗺️ Localização</h3>
                    <div style={{ marginTop: "1rem" }}>
                      <EventMap 
                        location={selectedEvent.location} 
                        eventTitle={selectedEvent.title}
                        height="200px"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="quick-actions">
                <h3>⚡ Ações Rápidas</h3>
                <div className="action-buttons">
                  <button 
                    className="btn-action" 
                    onClick={() => {
                      setRescheduleData({
                        startTime: selectedEvent.startTime ? selectedEvent.startTime.slice(0, 16) : "",
                        endTime: selectedEvent.endTime ? selectedEvent.endTime.slice(0, 16) : "",
                      });
                      setShowRescheduleModal(true);
                    }}
                  >
                    📅 Alterar Horário
                  </button>
                  <button 
                    className="btn-action" 
                    onClick={() => setShowMessageModal(true)}
                    disabled={participants.length === 0}
                    title={participants.length === 0 ? "Sem participantes para notificar" : ""}
                  >
                    📧 Enviar Mensagem
                  </button>
                  <button className="btn-action" onClick={exportParticipants}>
                    📥 Exportar Participantes
                  </button>
                </div>
              </div>

              <div className="seat-map-section">
                <h3>🪑 Mapa de Assentos</h3>
                <SeatMap seats={eventSeats} />
              </div>

              <div className="participants-section">
                <h3>👥 Participantes ({participants.length})</h3>
                {participants.length === 0 ? (
                  <p className="empty-message">Ainda não há participantes inscritos.</p>
                ) : (
                  <table className="participants-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Lugar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((p, i) => (
                        <tr key={i}>
                          <td>{p.fullName || "N/A"}</td>
                          <td>{p.email || "N/A"}</td>
                          <td>{p.seatNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : activeTab === "notifications" ? (
            <>
              <h2>🔔 Alertas em Tempo Real</h2>
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">🔕</p>
                  <p className="empty-message">Sem notificações recentes.</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="notification-item">
                      <span className="notif-message">{notif.message}</span>
                      <span className="notif-time">
                        {notif.timestamp?.toLocaleTimeString("pt-PT")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      </main>

      {showWizard && (
        <EventWizard
          onClose={() => setShowWizard(false)}
          onEventCreated={fetchDashboardData}
        />
      )}
      {/* Modal Alterar Horário */}
      {showRescheduleModal && (
        <div className="wizard-overlay" onClick={(e) => e.target === e.currentTarget && setShowRescheduleModal(false)}>
          <div className="wizard-modal" style={{ maxWidth: "450px" }}>
            <div className="wizard-header">
              <h2>📅 Alterar Horário</h2>
              <button className="close-btn" onClick={() => setShowRescheduleModal(false)}>×</button>
            </div>
            <div className="wizard-content">
              <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                Alterar o horário de <strong>{selectedEvent.title}</strong>
              </p>
              <div className="form-group">
                <label>Nova Data/Hora de Início *</label>
                <input
                  type="datetime-local"
                  value={rescheduleData.startTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, startTime: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label>Nova Data/Hora de Fim</label>
                <input
                  type="datetime-local"
                  value={rescheduleData.endTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, endTime: e.target.value })}
                />
              </div>
              <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "1rem" }}>
                ⚠️ Os participantes serão notificados sobre a alteração.
              </p>
            </div>
            <div className="wizard-footer">
              <button className="btn-secondary" onClick={() => setShowRescheduleModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleReschedule} disabled={actionLoading}>
                {actionLoading ? "A guardar..." : "Confirmar Alteração"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enviar Mensagem */}
      {showMessageModal && (
        <div className="wizard-overlay" onClick={(e) => e.target === e.currentTarget && setShowMessageModal(false)}>
          <div className="wizard-modal" style={{ maxWidth: "500px" }}>
            <div className="wizard-header">
              <h2>📧 Enviar Mensagem</h2>
              <button className="close-btn" onClick={() => setShowMessageModal(false)}>×</button>
            </div>
            <div className="wizard-content">
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                Enviar mensagem para todos os participantes de <strong>{selectedEvent.title}</strong>
              </p>
              <p style={{ 
                background: "#f3f4f6", 
                padding: "0.75rem", 
                borderRadius: "8px", 
                fontSize: "0.9rem",
                marginBottom: "1.5rem"
              }}>
                👥 {participants.length} participante{participants.length !== 1 ? "s" : ""} será{participants.length !== 1 ? "ão" : ""} notificado{participants.length !== 1 ? "s" : ""}
              </p>
              <div className="form-group">
                <label>Mensagem *</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escreve aqui a tua mensagem para os participantes..."
                  rows={5}
                  style={{ resize: "vertical" }}
                />
              </div>
              <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "1rem" }}>
                💡 A mensagem será enviada como notificação push e email (se configurado).
              </p>
            </div>
            <div className="wizard-footer">
              <button className="btn-secondary" onClick={() => setShowMessageModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSendMessage} disabled={actionLoading || !messageText.trim()}>
                {actionLoading ? "A enviar..." : "Enviar Mensagem"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}