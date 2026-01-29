import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/auth";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    fullName: "",
    phone: "",
    role: "PARTICIPANT",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("As passwords não coincidem");
      return;
    }

    if (formData.password.length < 4) {
      setError("A password deve ter pelo menos 4 caracteres");
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">EMS</span>
          </div>
          <h1>Criar Conta</h1>
          <p>Junta-te à plataforma de gestão de eventos</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          {/* Role Selection */}
          <div className="role-selector">
            <label className="role-label">Quero registar-me como:</label>
            <div className="role-options">
              <label className={`role-option ${formData.role === "PARTICIPANT" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="PARTICIPANT"
                  checked={formData.role === "PARTICIPANT"}
                  onChange={handleChange}
                />
                <span className="role-icon">🎫</span>
                <span className="role-title">Participante</span>
                <span className="role-desc">Reservar lugares em eventos</span>
              </label>
              <label className={`role-option ${formData.role === "ORGANIZER" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="ORGANIZER"
                  checked={formData.role === "ORGANIZER"}
                  onChange={handleChange}
                />
                <span className="role-icon">📅</span>
                <span className="role-title">Organizador</span>
                <span className="role-desc">Criar e gerir eventos</span>
              </label>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="fullName">Nome Completo</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="O teu nome"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Escolhe um username"
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="phone">Telefone (opcional)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+351 912 345 678"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : "Criar Conta"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Já tens conta?{" "}
            <Link to="/login" className="auth-link">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-decoration">
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="glow glow-3" />
      </div>
    </div>
  );
}