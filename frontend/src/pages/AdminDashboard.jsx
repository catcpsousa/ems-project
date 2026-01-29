import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">EMS</span>
          </div>
          <span className="header-divider" />
          <h1>Painel de Administração</h1>
        </div>
        <div className="header-right">
          <span className="user-badge admin-badge">
            <span className="user-icon">👑</span>
            {user?.fullName || user?.username}
          </span>
          <button onClick={logout} className="logout-btn">
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="admin-grid">
          <div className="card stat-card">
            <h3>Total Utilizadores</h3>
            <p className="stat-number">--</p>
          </div>
          <div className="card stat-card">
            <h3>Eventos Ativos</h3>
            <p className="stat-number">--</p>
          </div>
          <div className="card stat-card">
            <h3>Reservas Hoje</h3>
            <p className="stat-number">--</p>
          </div>
          <div className="card stat-card">
            <h3>Organizadores</h3>
            <p className="stat-number">--</p>
          </div>
        </div>

        <section className="card">
          <h2>Gestão da Plataforma</h2>
          <p>Aqui podes gerir utilizadores, eventos, e métricas globais.</p>
          <div className="admin-actions">
            <button className="btn-primary">Gerir Utilizadores</button>
            <button className="btn-secondary">Ver Todos os Eventos</button>
            <button className="btn-secondary">Relatórios</button>
          </div>
        </section>
      </main>
    </div>
  );
}