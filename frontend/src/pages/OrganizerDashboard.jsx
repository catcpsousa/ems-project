import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("events");

  return (
    <div className="dashboard">
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
          <span className="user-badge organizer-badge">
            <span className="user-icon">📅</span>
            {user?.fullName || user?.username}
          </span>
          <button onClick={logout} className="logout-btn">
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Stats */}
        <div className="organizer-stats">
          <div className="card stat-card">
            <h3>Meus Eventos</h3>
            <p className="stat-number">--</p>
          </div>
          <div className="card stat-card">
            <h3>Total Inscrições</h3>
            <p className="stat-number">--</p>
          </div>
          <div className="card stat-card">
            <h3>Taxa de Ocupação</h3>
            <p className="stat-number">--%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            Meus Eventos
          </button>
          <button
            className={`tab ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            Criar Evento
          </button>
          <button
            className={`tab ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            Estatísticas
          </button>
        </div>

        {/* Content */}
        <section className="card">
          {activeTab === "events" && (
            <>
              <h2>Os Meus Eventos</h2>
              <p className="empty-message">Ainda não criaste nenhum evento.</p>
              <button className="btn-primary" onClick={() => setActiveTab("create")}>
                Criar Primeiro Evento
              </button>
            </>
          )}

          {activeTab === "create" && (
            <>
              <h2>Criar Novo Evento</h2>
              <p>Formulário de criação de evento (a implementar)</p>
            </>
          )}

          {activeTab === "analytics" && (
            <>
              <h2>Estatísticas</h2>
              <p>Dashboard de métricas dos teus eventos (a implementar)</p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}