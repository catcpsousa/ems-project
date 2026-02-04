import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import { useSeatWebSocket } from "../hooks/useSeatWebSocket";
import "./ParticipantDashboard.css";
import EventMap from '../components/EventMap';

// Componente do Bilhete Digital
function DigitalTicketModal({ ticket, onClose }) {
  if (!ticket) return null;

  return (
    <div className="ticket-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ticket-modal">
        <div className="ticket-header">
          <h3>🎫 Bilhete Digital</h3>
          <p>{ticket.eventTitle}</p>
        </div>
        <div className="ticket-body">
          <div className="ticket-qr">📱</div>
          <div className="ticket-details">
            <div className="ticket-detail">
              <span className="ticket-detail-label">Participante</span>
              <span className="ticket-detail-value">{ticket.participantName}</span>
            </div>
            <div className="ticket-detail">
              <span className="ticket-detail-label">Data</span>
              <span className="ticket-detail-value">
                {ticket.eventStartTime 
                  ? new Date(ticket.eventStartTime).toLocaleDateString("pt-PT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "A definir"}
              </span>
            </div>
            <div className="ticket-detail">
              <span className="ticket-detail-label">Local</span>
              <span className="ticket-detail-value">{ticket.eventLocation || "Online"}</span>
            </div>
            <div className="ticket-detail">
              <span className="ticket-detail-label">Lugar</span>
              <span className="ticket-detail-value">{ticket.seatNumber}</span>
            </div>
          </div>
          <div className="ticket-code">
            <div className="ticket-code-label">Código do Bilhete</div>
            <div className="ticket-code-value">{ticket.ticketCode}</div>
          </div>
        </div>
        <div className="ticket-footer">
          <button className="btn-primary" style={{ width: "100%" }} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de Feedback
function FeedbackForm({ event, onSubmit, onCancel }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Por favor, seleciona uma avaliação");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ eventId: event.eventId, rating, comment });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-form">
      <h4>Avaliar: {event.eventTitle}</h4>
      <div className="rating-selector">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`rating-star ${star <= rating ? "selected" : "unselected"}`}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>
      <div className="form-group">
        <label>Comentário (opcional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partilha a tua experiência..."
        />
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "A enviar..." : "Enviar Avaliação"}
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Componente do Mapa de Lugares para Reserva
function SeatMapModal({ event, onClose, onBookingComplete }) {
  console.log("🎭 SeatMapModal MOUNTED with event:", event); // DEBUG

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [lockTimer, setLockTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("🔄 useEffect triggered, calling fetchSeats..."); // DEBUG
    fetchSeats();
  }, [event.id]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (lockTimer && timeLeft === 0) {
      setSelectedSeat(null);
      setLockTimer(null);
      fetchSeats();
    }
  }, [timeLeft, lockTimer]);

  const fetchSeats = async () => {
    console.log("📡 fetchSeats() called for event ID:", event.id); // DEBUG
    setLoading(true);
    setError(null);
    try {
      const url = `/api/events/${event.id}/seats`;
      console.log("🌐 Fetching URL:", url); // DEBUG
      
      const res = await apiFetch(url);
      console.log("📥 Response received:", res.status, res.statusText); // DEBUG
      
      if (res.ok) {
        const data = await res.json();
        console.log("✅ Seats data:", data); // DEBUG
        setSeats(data);
        if (data.length === 0) {
          setError("Este evento não tem lugares configurados.");
        }
      } else {
        const errorText = await res.text();
        console.error("❌ API Error:", res.status, errorText); // DEBUG
        setError("Erro ao carregar lugares: " + res.status);
      }
    } catch (err) {
      console.error("💥 Exception in fetchSeats:", err); // DEBUG
      setError("Erro de conexão: " + err.message);
    } finally {
      setLoading(false);
      console.log("🏁 fetchSeats() completed"); // DEBUG
    }
  };

  const handleSeatClick = async (seat) => {
    if (seat.status !== "AVAILABLE") return;
    
    if (selectedSeat) {
      await releaseLock(selectedSeat.id);
    }

    try {
      const res = await apiFetch(`/api/bookings/seats/${seat.id}/lock`, { method: "POST" });
      if (res.ok) {
        const lockedSeat = await res.json();
        setSelectedSeat(lockedSeat);
        setLockTimer(Date.now());
        setTimeLeft(10 * 60);
        fetchSeats();
      } else {
        const error = await res.text();
        alert(error || "Não foi possível reservar este lugar");
      }
    } catch (error) {
      console.error("Erro ao bloquear lugar:", error);
    }
  };

  const releaseLock = async (seatId) => {
    try {
      await apiFetch(`/api/bookings/seats/${seatId}/release`, { method: "POST" });
    } catch (error) {
      console.error("Erro ao libertar lugar:", error);
    }
  };

  const confirmBooking = async () => {
    if (!selectedSeat) return;
    
    setBookingInProgress(true);
    try {
      const res = await apiFetch(`/api/bookings/seats/${selectedSeat.id}/confirm`, { method: "POST" });
      if (res.ok) {
        alert("🎉 Reserva confirmada com sucesso!");
        onBookingComplete();
        onClose();
      } else {
        const error = await res.text();
        alert(error || "Erro ao confirmar reserva");
      }
    } catch (error) {
      console.error("Erro ao confirmar:", error);
      alert("Erro ao confirmar reserva");
    } finally {
      setBookingInProgress(false);
    }
  };

  const handleClose = async () => {
    if (selectedSeat) {
      await releaseLock(selectedSeat.id);
    }
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.seatNumber.charAt(0);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  const getSeatClass = (seat) => {
    if (seat.status === "BOOKED") return "seat booked";
    if (seat.status === "LOCKED") {
      return selectedSeat?.id === seat.id ? "seat selected" : "seat locked";
    }
    return "seat available";
  };

  console.log("🎨 Rendering SeatMapModal, loading:", loading, "error:", error, "seats:", seats.length); // DEBUG

  return (
    <div className="seat-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="seat-modal">
        <div className="seat-modal-header">
          <h3>🎭 {event.title}</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="seat-modal-info">
          <span>📅 {new Date(event.startTime).toLocaleDateString("pt-PT", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit"
          })}</span>
          <span>📍 {event.location || "Online"}</span>
          <span>💰 {event.ticketPrice > 0 ? `€${Number(event.ticketPrice).toFixed(2)}` : "Grátis"}</span>
        </div>

        {/* MAPA no Modal de Reserva */}
        {event.location && (
          <div style={{ margin: "1rem 0" }}>
            <EventMap 
              location={event.location} 
              eventTitle={event.title}
              height="180px"
            />
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>A carregar lugares...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p className="empty-icon">🪑</p>
            <p className="empty-message">{error}</p>
            <button className="btn-secondary" onClick={handleClose}>
              Fechar
            </button>
          </div>
        ) : seats.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">🪑</p>
            <p className="empty-message">Este evento não tem lugares disponíveis.</p>
            <button className="btn-secondary" onClick={handleClose}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="seat-legend">
              <span><span className="seat-dot available"></span> Disponível</span>
              <span><span className="seat-dot locked"></span> Bloqueado</span>
              <span><span className="seat-dot booked"></span> Reservado</span>
              <span><span className="seat-dot selected"></span> Selecionado</span>
            </div>

            <div className="stage-indicator">🎤 PALCO</div>

            <div className="seat-grid">
              {Object.entries(seatsByRow)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([row, rowSeats]) => (
                  <div key={row} className="seat-row">
                    <span className="row-label">{row}</span>
                    {rowSeats
                      .sort((a, b) => {
                        const numA = parseInt(a.seatNumber.slice(1));
                        const numB = parseInt(b.seatNumber.slice(1));
                        return numA - numB;
                      })
                      .map((seat) => (
                        <button
                          key={seat.id}
                          className={getSeatClass(seat)}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status !== "AVAILABLE" && selectedSeat?.id !== seat.id}
                          title={seat.seatNumber}
                        >
                          {seat.seatNumber.slice(1)}
                        </button>
                      ))}
                  </div>
                ))}
            </div>

            {selectedSeat && (
              <div className="booking-confirmation">
                <div className="selected-seat-info">
                  <span>Lugar selecionado: <strong>{selectedSeat.seatNumber}</strong></span>
                  <span className="timer">⏱️ {formatTime(timeLeft)}</span>
                </div>
                <button 
                  className="btn-primary"
                  onClick={confirmBooking}
                  disabled={bookingInProgress}
                >
                  {bookingInProgress ? "A processar..." : `Confirmar Reserva${event.ticketPrice > 0 ? ` - €${Number(event.ticketPrice).toFixed(2)}` : ""}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Componente Principal
export default function ParticipantDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("explore");
  const [bookings, setBookings] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [bookingFilter, setBookingFilter] = useState("all");
  
  // Novos estados para explorar eventos
  const [publicEvents, setPublicEvents] = useState([]);
  const [selectedEventForBooking, setSelectedEventForBooking] = useState(null);
  const [eventSearch, setEventSearch] = useState("");
  const [eventCategory, setEventCategory] = useState("all");

  // WebSocket
  const handleUpdate = useCallback(() => {
    fetchBookings();
  }, []);

  useSeatWebSocket(handleUpdate, handleUpdate);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPublicEvents(),
        fetchBookings(),
        fetchTodayEvents(),
        fetchNotifications(),
        fetchFeedbacks(),
        fetchUnreadCount(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicEvents = async () => {
    try {
      const res = await apiFetch("/api/events");
      if (res.ok) setPublicEvents(await res.json());
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await apiFetch("/api/participant/bookings");
      if (res.ok) setBookings(await res.json());
    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
    }
  };

  const fetchTodayEvents = async () => {
    try {
      const res = await apiFetch("/api/participant/today");
      if (res.ok) setTodayEvents(await res.json());
    } catch (error) {
      console.error("Erro ao carregar eventos de hoje:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch("/api/participant/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await apiFetch("/api/participant/feedback");
      if (res.ok) setFeedbacks(await res.json());
    } catch (error) {
      console.error("Erro ao carregar feedbacks:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await apiFetch("/api/participant/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar contagem:", error);
    }
  };

  const openTicket = async (bookingId) => {
    try {
      const res = await apiFetch(`/api/participant/bookings/${bookingId}/ticket`);
      if (res.ok) {
        setSelectedTicket(await res.json());
      }
    } catch (error) {
      console.error("Erro ao carregar bilhete:", error);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await apiFetch("/api/participant/notifications/mark-read", { method: "POST" });
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error("Erro ao marcar como lidas:", error);
    }
  };

  const submitFeedback = async (feedbackData) => {
    try {
      const res = await apiFetch("/api/participant/feedback", {
        method: "POST",
        body: JSON.stringify(feedbackData),
      });
      if (res.ok) {
        setFeedbackEvent(null);
        fetchFeedbacks();
        fetchBookings();
        alert("Obrigado pelo teu feedback! 🎉");
      } else {
        const error = await res.text();
        alert(error);
      }
    } catch (error) {
      alert("Erro ao enviar feedback");
    }
  };

  const handleBookingComplete = () => {
    fetchBookings();
    fetchPublicEvents();
  };

  // Filtrar eventos públicos
  const filteredPublicEvents = publicEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
                         (event.description || "").toLowerCase().includes(eventSearch.toLowerCase());
    const matchesCategory = eventCategory === "all" || event.category === eventCategory;
    // Não mostrar eventos já reservados
    const notBooked = !bookings.some(b => b.eventId === event.id);
    return matchesSearch && matchesCategory && notBooked;
  });

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "all") return true;
    return b.status === bookingFilter.toUpperCase();
  });

  const categories = [...new Set(publicEvents.map(e => e.category).filter(Boolean))];

  const getStatusBadge = (status) => {
    const statusMap = {
      UPCOMING: { label: "Próximo", class: "status-upcoming" },
      TODAY: { label: "Hoje", class: "status-today" },
      PAST: { label: "Passado", class: "status-past" },
    };
    const s = statusMap[status] || { label: status, class: "" };
    return <span className={`booking-status ${s.class}`}>{s.label}</span>;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "BOOKING_CONFIRMED": return "✅";
      case "EVENT_REMINDER": return "⏰";
      case "EVENT_UPDATE": return "📢";
      case "EVENT_CANCELLED": return "❌";
      case "ORGANIZER_MESSAGE": return "💬"; // Organizer Message
      default: return "📬";
    }
  };

  const hasGivenFeedback = (eventId) => {
    return feedbacks.some((f) => f.eventId === eventId);
  };

  return (
    <div className="participant-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🎫</span>
            <span className="logo-text">EMS</span>
          </div>
          <span className="header-divider" />
          <h1>Área do Participante</h1>
        </div>
        <div className="header-right">
          <button 
            className="notification-btn"
            onClick={() => { setActiveTab("notifications"); markNotificationsAsRead(); }}
          >
            🔔
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>
          <span className="user-badge participant-badge">
            <span>👤</span>
            {user?.fullName || user?.username}
          </span>
          <button onClick={logout} className="logout-btn">Sair</button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "explore" ? "active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            🔍 Explorar Eventos
          </button>
          <button
            className={`tab ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            🎟️ Meus Eventos {bookings.length > 0 && `(${bookings.length})`}
          </button>
          <button
            className={`tab ${activeTab === "today" ? "active" : ""}`}
            onClick={() => setActiveTab("today")}
          >
            📅 Hoje {todayEvents.length > 0 && `(${todayEvents.length})`}
          </button>
          <button
            className={`tab ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => { setActiveTab("notifications"); markNotificationsAsRead(); }}
          >
            🔔 Notificações {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            className={`tab ${activeTab === "feedback" ? "active" : ""}`}
            onClick={() => setActiveTab("feedback")}
          >
            ⭐ Avaliações
          </button>
        </div>

        {/* Main Content */}
        <section className="main-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>A carregar...</p>
            </div>
          ) : activeTab === "explore" ? (
            <>
              <h2>🔍 Explorar Eventos</h2>
              
              <div className="search-filters">
                <input
                  type="text"
                  placeholder="Pesquisar eventos..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="search-input"
                />
                <select 
                  value={eventCategory} 
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {filteredPublicEvents.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">🎭</p>
                  <p className="empty-message">
                    {publicEvents.length === 0 
                      ? "Não há eventos disponíveis de momento." 
                      : "Nenhum evento encontrado com esses filtros."}
                  </p>
                </div>
              ) : (
                <div className="events-grid">
                  {filteredPublicEvents.map((event) => (
                    <div key={event.id} className="event-card">
                      {event.coverImage ? (
                        <img src={event.coverImage} alt="" className="event-image" />
                      ) : (
                        <div className="event-image-placeholder">🎭</div>
                      )}
                      <div className="event-content">
                        <span className="event-category">{event.category}</span>
                        <h3 className="event-title">{event.title}</h3>
                        <p className="event-description">
                          {event.description?.slice(0, 100)}
                          {event.description?.length > 100 ? "..." : ""}
                        </p>
                        <div className="event-meta">
                          <span>📅 {new Date(event.startTime).toLocaleDateString("pt-PT", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}</span>
                          <span>📍 {event.location || "Online"}</span>
                        </div>
                        
                        {/* MAPA - Adicionar aqui */}
                        {event.location && !event.onlineLink && (
                          <div style={{ marginTop: "1rem" }}>
                            <EventMap 
                              location={event.location} 
                              eventTitle={event.title}
                              height="150px"
                            />
                          </div>
                        )}
                        
                        <div className="event-footer">
                          <span className="event-price">
                            {event.ticketPrice > 0 ? `€${Number(event.ticketPrice).toFixed(2)}` : "Grátis"}
                          </span>
                          <button 
                            className="btn-primary"
                            onClick={() => setSelectedEventForBooking(event)}
                          >
                            Reservar Lugar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === "bookings" ? (
            <>
              <h2>🎟️ Os Meus Eventos</h2>
              
              <div className="filter-tabs">
                {["all", "upcoming", "today", "past"].map((filter) => (
                  <button
                    key={filter}
                    className={`filter-tab ${bookingFilter === filter ? "active" : ""}`}
                    onClick={() => setBookingFilter(filter)}
                  >
                    {filter === "all" ? "Todos" : 
                     filter === "upcoming" ? "Próximos" :
                     filter === "today" ? "Hoje" : "Passados"}
                  </button>
                ))}
              </div>

              {filteredBookings.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">🎪</p>
                  <p className="empty-message">
                    {bookingFilter === "all" 
                      ? "Ainda não tens eventos reservados." 
                      : "Não tens eventos nesta categoria."}
                  </p>
                  <button className="btn-primary" onClick={() => setActiveTab("explore")}>
                    Explorar Eventos
                  </button>
                </div>
              ) : (
                <div className="bookings-section">
                  {filteredBookings.map((booking) => (
                    <div 
                      key={booking.bookingId} 
                      className={`booking-card ${booking.status.toLowerCase()}`}
                    >
                      {booking.eventCoverImage ? (
                        <img src={booking.eventCoverImage} alt="" className="booking-image" />
                      ) : (
                        <div className="booking-image">🎭</div>
                      )}
                      <div className="booking-info">
                        <h3>{booking.eventTitle}</h3>
                        <div className="booking-meta">
                          <span>📅 {booking.eventStartTime 
                            ? new Date(booking.eventStartTime).toLocaleDateString("pt-PT", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "A definir"}</span>
                          <span>📍 {booking.eventLocation || "Online"}</span>
                          <span>🪑 Lugar {booking.seatNumber}</span>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="booking-actions">
                        <button 
                          className="btn-primary btn-sm"
                          onClick={() => openTicket(booking.bookingId)}
                        >
                          Ver Bilhete
                        </button>
                        {booking.status === "PAST" && !hasGivenFeedback(booking.eventId) && (
                          <button 
                            className="btn-secondary btn-sm"
                            onClick={() => setFeedbackEvent(booking)}
                          >
                            Avaliar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === "today" ? (
            <>
              <h2>📅 Agenda de Hoje</h2>
              {todayEvents.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">📭</p>
                  <p className="empty-message">Não tens eventos agendados para hoje.</p>
                </div>
              ) : (
                <div className="today-timeline">
                  {todayEvents
                    .sort((a, b) => new Date(a.eventStartTime) - new Date(b.eventStartTime))
                    .map((event) => (
                      <div key={event.bookingId} className="timeline-item">
                        <div className="timeline-time">
                          {new Date(event.eventStartTime).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                        <div className="timeline-title">{event.eventTitle}</div>
                        <div className="timeline-location">
                          📍 {event.eventLocation || event.eventOnlineLink || "Local a definir"}
                          {" • "} 🪑 Lugar {event.seatNumber}
                        </div>
                        <button 
                          className="btn-primary btn-sm" 
                          style={{ marginTop: "0.75rem" }}
                          onClick={() => openTicket(event.bookingId)}
                        >
                          Ver Bilhete
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </>
          ) : activeTab === "notifications" ? (
            <>
              <h2>🔔 Centro de Notificações</h2>
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">🔕</p>
                  <p className="empty-message">Não tens notificações.</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${!notif.read ? "unread" : ""}`}
                    >
                      <span className="notification-icon">
                        {getNotificationIcon(notif.type)}
                      </span>
                      <div className="notification-content">
                        <div className="notification-title">{notif.eventTitle}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">
                          {new Date(notif.createdAt).toLocaleString("pt-PT")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === "feedback" ? (
            <>
              <h2>⭐ Minhas Avaliações</h2>
              
              {feedbackEvent && (
                <FeedbackForm
                  event={feedbackEvent}
                  onSubmit={submitFeedback}
                  onCancel={() => setFeedbackEvent(null)}
                />
              )}

              {/* Eventos sem avaliação */}
              {bookings.filter(b => b.status === "PAST" && !hasGivenFeedback(b.eventId)).length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h3 style={{ marginBottom: "1rem", color: "#6b7280" }}>Eventos por avaliar</h3>
                  {bookings
                    .filter(b => b.status === "PAST" && !hasGivenFeedback(b.eventId))
                    .map((booking) => (
                      <div key={booking.bookingId} className="feedback-card" style={{ marginBottom: "0.75rem" }}>
                        <div className="feedback-event">{booking.eventTitle}</div>
                        <button 
                          className="btn-primary btn-sm"
                          onClick={() => setFeedbackEvent(booking)}
                        >
                          Avaliar Evento
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Avaliações feitas */}
              <h3 style={{ marginBottom: "1rem", color: "#6b7280" }}>Avaliações enviadas</h3>
              {feedbacks.length === 0 ? (
                <p className="empty-message">Ainda não avaliaste nenhum evento.</p>
              ) : (
                <div className="feedback-list">
                  {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="feedback-card">
                      <div className="feedback-event">{feedback.eventTitle}</div>
                      <div className="feedback-rating">
                        {"★".repeat(feedback.rating)}
                        {"☆".repeat(5 - feedback.rating)}
                      </div>
                      {feedback.comment && (
                        <div className="feedback-comment">"{feedback.comment}"</div>
                      )}
                      <div className="feedback-date">
                        {new Date(feedback.createdAt).toLocaleDateString("pt-PT")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      </main>

      {/* Ticket Modal */}
      {selectedTicket && (
        <DigitalTicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Seat Map Modal */}
      {selectedEventForBooking && (
        <SeatMapModal
          event={selectedEventForBooking}
          onClose={() => setSelectedEventForBooking(null)}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  );
}