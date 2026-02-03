import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Users state
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("");

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsPage, setReportsPage] = useState(0);
  const [reportsStatusFilter, setReportsStatusFilter] = useState("PENDING");

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(0);
  const [logsLevelFilter, setLogsLevelFilter] = useState("");

  // Categories state
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Config state
  const [configs, setConfigs] = useState([]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: usersPage,
        size: 20,
      });
      if (usersSearch) params.append("search", usersSearch);
      if (usersRoleFilter) params.append("role", usersRoleFilter);

      const res = await apiFetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.content);
        setUsersTotalPages(data.totalPages);
      }
    } catch (err) {
      setError("Erro ao carregar utilizadores");
    } finally {
      setLoading(false);
    }
  }, [usersPage, usersSearch, usersRoleFilter]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: reportsPage,
        size: 20,
      });
      if (reportsStatusFilter) params.append("status", reportsStatusFilter);

      const res = await apiFetch(`/api/admin/reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.content);
      }
    } catch (err) {
      setError("Erro ao carregar denúncias");
    } finally {
      setLoading(false);
    }
  }, [reportsPage, reportsStatusFilter]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: logsPage,
        size: 50,
      });
      if (logsLevelFilter) params.append("level", logsLevelFilter);

      const res = await apiFetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.content);
      }
    } catch (err) {
      setError("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  }, [logsPage, logsLevelFilter]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/categories");
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  // Fetch configs
  const fetchConfigs = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/config");
      if (res.ok) {
        setConfigs(await res.json());
      }
    } catch (err) {
      console.error("Error fetching configs:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    setLoading(false);
  }, [fetchStats]);

  // Tab-specific data loading
  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "moderation") fetchReports();
    if (activeTab === "logs") fetchLogs();
    if (activeTab === "categories") fetchCategories();
    if (activeTab === "config") fetchConfigs();
  }, [activeTab, fetchUsers, fetchReports, fetchLogs, fetchCategories, fetchConfigs]);

  // Update user role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.text();
        setError(err);
      }
    } catch (err) {
      setError("Erro ao atualizar role");
    }
  };

  // Toggle user status
  const handleToggleStatus = async (userId) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/toggle-status`, {
        method: "POST",
      });
      if (res.ok) {
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.text();
        setError(err);
      }
    } catch (err) {
      setError("Erro ao alterar status");
    }
  };

  // Resolve report
  const handleResolveReport = async (reportId, status) => {
    const adminNotes = prompt("Notas do admin (opcional):");
    try {
      const res = await apiFetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "PUT",
        body: JSON.stringify({ status, adminNotes }),
      });
      if (res.ok) {
        fetchReports();
        fetchStats();
      }
    } catch (err) {
      setError("Erro ao resolver denúncia");
    }
  };

  // Save category
  const handleSaveCategory = async (categoryData) => {
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(categoryData),
      });
      if (res.ok) {
        fetchCategories();
        setShowCategoryModal(false);
        setEditingCategory(null);
      } else {
        const err = await res.text();
        setError(err);
      }
    } catch (err) {
      setError("Erro ao guardar categoria");
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Tens a certeza que queres eliminar esta categoria?")) return;
    try {
      const res = await apiFetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      setError("Erro ao eliminar categoria");
    }
  };

  // Save config
  const handleSaveConfig = async (configKey, configValue, description) => {
    try {
      const res = await apiFetch("/api/admin/config", {
        method: "POST",
        body: JSON.stringify({ configKey, configValue, description }),
      });
      if (res.ok) {
        fetchConfigs();
      }
    } catch (err) {
      setError("Erro ao guardar configuração");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: "📊" },
    { id: "users", label: "Utilizadores", icon: "👥" },
    { id: "moderation", label: "Moderação", icon: "🛡️", badge: stats?.pendingReports },
    { id: "logs", label: "Logs", icon: "📋", badge: stats?.errorsToday > 0 ? stats.errorsToday : null },
    { id: "categories", label: "Categorias", icon: "🏷️" },
    { id: "config", label: "Configurações", icon: "⚙️" },
  ];

  return (
    <div className="admin-dashboard">
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

      <nav className="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge > 0 && <span className="badge">{tab.badge}</span>}
          </button>
        ))}
      </nav>

      <main className="dashboard-main">
        {error && (
          <div className="error-message">
            ⚠️ {error}
            <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "inherit", cursor: "pointer" }}>×</button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            <div className="stats-grid">
              <div className="stat-card highlight">
                <div className="stat-icon">👥</div>
                <h3>Total Utilizadores</h3>
                <p className="stat-value">{stats?.totalUsers || 0}</p>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <h3>Utilizadores Ativos</h3>
                <p className="stat-value">{stats?.activeUsers || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎭</div>
                <h3>Total Eventos</h3>
                <p className="stat-value">{stats?.totalEvents || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📢</div>
                <h3>Eventos Publicados</h3>
                <p className="stat-value">{stats?.publishedEvents || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎪</div>
                <h3>Organizadores</h3>
                <p className="stat-value">{stats?.totalOrganizers || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎟️</div>
                <h3>Participantes</h3>
                <p className="stat-value">{stats?.totalParticipants || 0}</p>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">⚠️</div>
                <h3>Denúncias Pendentes</h3>
                <p className="stat-value">{stats?.pendingReports || 0}</p>
              </div>
              <div className="stat-card error">
                <div className="stat-icon">🔴</div>
                <h3>Erros Hoje</h3>
                <p className="stat-value">{stats?.errorsToday || 0}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
              <div className="card">
                <div className="card-header">
                  <h2>📊 Utilizadores por Papel</h2>
                </div>
                {stats?.usersByRole && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {Object.entries(stats.usersByRole).map(([role, count]) => (
                      <div key={role} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span className={`role-badge ${role.toLowerCase()}`}>
                          {role === "ADMIN" && "👑"} 
                          {role === "ORGANIZER" && "🎪"} 
                          {role === "PARTICIPANT" && "🎟️"} 
                          {role}
                        </span>
                        <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                          <div 
                            style={{ 
                              height: "100%", 
                              width: `${(count / stats.totalUsers) * 100}%`,
                              background: role === "ADMIN" ? "#ef4444" : role === "ORGANIZER" ? "#3b82f6" : "#10b981",
                              borderRadius: "4px"
                            }} 
                          />
                        </div>
                        <span style={{ minWidth: "50px", textAlign: "right" }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>📈 Eventos por Estado</h2>
                </div>
                {stats?.eventsByStatus && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {Object.entries(stats.eventsByStatus).map(([status, count]) => (
                      <div key={status} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span className={`status-badge ${status === "PUBLISHED" ? "active" : status === "DRAFT" ? "pending" : ""}`} style={{ minWidth: "100px" }}>
                          {status}
                        </span>
                        <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                          <div 
                            style={{ 
                              height: "100%", 
                              width: `${stats.totalEvents > 0 ? (count / stats.totalEvents) * 100 : 0}%`,
                              background: status === "PUBLISHED" ? "#10b981" : status === "DRAFT" ? "#f59e0b" : "#3b82f6",
                              borderRadius: "4px"
                            }} 
                          />
                        </div>
                        <span style={{ minWidth: "50px", textAlign: "right" }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="card">
            <div className="card-header">
              <h2>👥 Gestão de Utilizadores</h2>
            </div>

            <div className="filters-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Pesquisar por nome ou email..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(0);
                }}
              />
              <select
                className="filter-select"
                value={usersRoleFilter}
                onChange={(e) => {
                  setUsersRoleFilter(e.target.value);
                  setUsersPage(0);
                }}
              >
                <option value="">Todos os papéis</option>
                <option value="ADMIN">Admin</option>
                <option value="ORGANIZER">Organizador</option>
                <option value="PARTICIPANT">Participante</option>
              </select>
            </div>

            {loading ? (
              <div className="loading">A carregar...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="icon">👥</div>
                <p>Nenhum utilizador encontrado</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Utilizador</th>
                        <th>Email</th>
                        <th>Papel</th>
                        <th>Estado</th>
                        <th>Eventos</th>
                        <th>Reservas</th>
                        <th>Registo</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong>{u.fullName || u.username}</strong>
                            <br />
                            <small style={{ color: "rgba(255,255,255,0.5)" }}>@{u.username}</small>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <select
                              className="filter-select"
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              style={{ padding: "0.4rem", fontSize: "0.8rem" }}
                            >
                              <option value="PARTICIPANT">Participante</option>
                              <option value="ORGANIZER">Organizador</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                          <td>
                            <span className={`status-badge ${u.enabled ? "active" : "inactive"}`}>
                              {u.enabled ? "Ativo" : "Banido"}
                            </span>
                          </td>
                          <td>{u.eventsCreated || 0}</td>
                          <td>{u.bookingsMade || 0}</td>
                          <td style={{ fontSize: "0.8rem" }}>{formatDate(u.createdAt)}</td>
                          <td>
                            <button
                              className={`action-btn ${u.enabled ? "danger" : "success"}`}
                              onClick={() => handleToggleStatus(u.id)}
                            >
                              {u.enabled ? "Banir" : "Ativar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pagination">
                  <button
                    disabled={usersPage === 0}
                    onClick={() => setUsersPage((p) => p - 1)}
                  >
                    ← Anterior
                  </button>
                  <span style={{ padding: "0.5rem 1rem" }}>
                    Página {usersPage + 1} de {usersTotalPages || 1}
                  </span>
                  <button
                    disabled={usersPage >= usersTotalPages - 1}
                    onClick={() => setUsersPage((p) => p + 1)}
                  >
                    Seguinte →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* MODERATION TAB */}
        {activeTab === "moderation" && (
          <div className="card">
            <div className="card-header">
              <h2>🛡️ Moderação de Conteúdo</h2>
            </div>

            <div className="filters-bar">
              <select
                className="filter-select"
                value={reportsStatusFilter}
                onChange={(e) => {
                  setReportsStatusFilter(e.target.value);
                  setReportsPage(0);
                }}
              >
                <option value="PENDING">Pendentes</option>
                <option value="REVIEWING">Em Revisão</option>
                <option value="RESOLVED">Resolvidas</option>
                <option value="DISMISSED">Rejeitadas</option>
                <option value="">Todas</option>
              </select>
            </div>

            {loading ? (
              <div className="loading">A carregar...</div>
            ) : reports.length === 0 ? (
              <div className="empty-state">
                <div className="icon">✅</div>
                <p>Nenhuma denúncia {reportsStatusFilter === "PENDING" ? "pendente" : "encontrada"}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Denunciante</th>
                      <th>Motivo</th>
                      <th>Estado</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <span className="status-badge">
                            {report.type === "REVIEW" && "📝 Review"}
                            {report.type === "EVENT" && "🎭 Evento"}
                            {report.type === "USER" && "👤 Utilizador"}
                          </span>
                        </td>
                        <td>{report.reporter?.username || "N/A"}</td>
                        <td style={{ maxWidth: "300px" }}>{report.reason}</td>
                        <td>
                          <span className={`status-badge ${report.status.toLowerCase()}`}>
                            {report.status}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>{formatDate(report.createdAt)}</td>
                        <td>
                          {report.status === "PENDING" && (
                            <>
                              <button
                                className="action-btn success"
                                onClick={() => handleResolveReport(report.id, "RESOLVED")}
                              >
                                Resolver
                              </button>
                              <button
                                className="action-btn warning"
                                onClick={() => handleResolveReport(report.id, "DISMISSED")}
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === "logs" && (
          <div className="card">
            <div className="card-header">
              <h2>📋 Logs do Sistema</h2>
            </div>

            <div className="filters-bar">
              <select
                className="filter-select"
                value={logsLevelFilter}
                onChange={(e) => {
                  setLogsLevelFilter(e.target.value);
                  setLogsPage(0);
                }}
              >
                <option value="">Todos os níveis</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {loading ? (
              <div className="loading">A carregar...</div>
            ) : logs.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📋</div>
                <p>Nenhum log encontrado</p>
              </div>
            ) : (
              <div>
                {logs.map((log) => (
                  <div key={log.id} className="log-entry">
                    <span className={`log-level ${log.level.toLowerCase()}`}>
                      {log.level}
                    </span>
                    <div className="log-content">
                      <div className="log-source">{log.source}</div>
                      <div className="log-message">{log.message}</div>
                      {log.stackTrace && (
                        <details style={{ marginTop: "0.5rem" }}>
                          <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                            Ver stack trace
                          </summary>
                          <pre style={{ fontSize: "0.75rem", marginTop: "0.5rem", whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.6)" }}>
                            {log.stackTrace}
                          </pre>
                        </details>
                      )}
                    </div>
                    <span className="log-time">{formatDate(log.createdAt)}</span>
                  </div>
                ))}

                <div className="pagination">
                  <button
                    disabled={logsPage === 0}
                    onClick={() => setLogsPage((p) => p - 1)}
                  >
                    ← Anterior
                  </button>
                  <button onClick={() => setLogsPage((p) => p + 1)}>
                    Seguinte →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="card">
            <div className="card-header">
              <h2>🏷️ Categorias de Eventos</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
              >
                + Nova Categoria
              </button>
            </div>

            <div className="categories-grid">
              {categories.map((cat) => (
                <div key={cat.id} className="category-card">
                  <div className="category-icon">{cat.icon || "📁"}</div>
                  <div className="category-info">
                    <h4>{cat.name}</h4>
                    <p>{cat.description || "Sem descrição"}</p>
                    <span className={`status-badge ${cat.active ? "active" : "inactive"}`}>
                      {cat.active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  <div className="category-actions">
                    <button
                      className="action-btn primary"
                      onClick={() => {
                        setEditingCategory(cat);
                        setShowCategoryModal(true);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="empty-state">
                <div className="icon">🏷️</div>
                <p>Nenhuma categoria criada</p>
              </div>
            )}
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === "config" && (
          <div className="card">
            <div className="card-header">
              <h2>⚙️ Configurações Globais</h2>
            </div>

            <div className="config-grid">
              <ConfigItem
                configKey="platform_fee_percentage"
                label="Taxa da Plataforma (%)"
                description="Percentagem cobrada em cada transação"
                value={configs.find((c) => c.configKey === "platform_fee_percentage")?.configValue || "5"}
                onSave={handleSaveConfig}
              />
              <ConfigItem
                configKey="max_seats_per_event"
                label="Máx. Lugares por Evento"
                description="Limite máximo de lugares que um evento pode ter"
                value={configs.find((c) => c.configKey === "max_seats_per_event")?.configValue || "1000"}
                onSave={handleSaveConfig}
              />
              <ConfigItem
                configKey="lock_timeout_seconds"
                label="Timeout de Lock (seg)"
                description="Tempo máximo que um lugar pode ficar bloqueado"
                value={configs.find((c) => c.configKey === "lock_timeout_seconds")?.configValue || "300"}
                onSave={handleSaveConfig}
              />
              <ConfigItem
                configKey="max_events_per_organizer"
                label="Máx. Eventos por Organizador"
                description="Limite de eventos ativos por organizador"
                value={configs.find((c) => c.configKey === "max_events_per_organizer")?.configValue || "50"}
                onSave={handleSaveConfig}
              />
              <ConfigItem
                configKey="maintenance_mode"
                label="Modo Manutenção"
                description="Ativar para bloquear acesso à plataforma"
                value={configs.find((c) => c.configKey === "maintenance_mode")?.configValue || "false"}
                onSave={handleSaveConfig}
                type="select"
                options={["false", "true"]}
              />
              <ConfigItem
                configKey="support_email"
                label="Email de Suporte"
                description="Email para contacto de suporte"
                value={configs.find((c) => c.configKey === "support_email")?.configValue || "suporte@ems.pt"}
                onSave={handleSaveConfig}
              />
            </div>
          </div>
        )}
      </main>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
}

// Config Item Component
function ConfigItem({ configKey, label, description, value, onSave, type = "text", options = [] }) {
  const [currentValue, setCurrentValue] = useState(value);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(configKey, currentValue, description);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="config-item">
      <label>{label}</label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {type === "select" ? (
          <select
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            style={{ flex: 1 }}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            style={{ flex: 1 }}
          />
        )}
        <button
          className={`action-btn ${saved ? "success" : "primary"}`}
          onClick={handleSave}
          style={{ whiteSpace: "nowrap" }}
        >
          {saved ? "✓ Guardado" : "Guardar"}
        </button>
      </div>
      <div className="description">{description}</div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({ category, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    icon: category?.icon || "📁",
    active: category?.active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const iconOptions = ["📁", "🎭", "🎵", "🎤", "🏆", "💼", "🎓", "🎨", "🎮", "🎪", "🎬", "📚"];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{category ? "Editar Categoria" : "Nova Categoria"}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Ícone</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    style={{
                      padding: "0.5rem",
                      fontSize: "1.5rem",
                      background: formData.icon === icon ? "rgba(102, 126, 234, 0.3)" : "rgba(255,255,255,0.1)",
                      border: formData.icon === icon ? "2px solid #667eea" : "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                Categoria ativa
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {category ? "Guardar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}