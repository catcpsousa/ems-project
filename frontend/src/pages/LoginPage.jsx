import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login } from "../services/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();

  const justRegistered = location.state?.registered;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(username, password);
      updateUser({
        username: data.username,
        role: data.role,
        fullName: data.fullName,
      });

      // Redirect based on role
      switch (data.role) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "ORGANIZER":
          navigate("/organizer");
          break;
        case "PARTICIPANT":
          navigate("/participant");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setError(err.message || "Erro ao fazer login");
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
          <h1>Bem-vindo de volta</h1>
          <p>Entra na tua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {justRegistered && (
            <div className="auth-success">
              Conta criada com sucesso! Faz login para continuar.
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="O teu username"
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : "Entrar"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Não tens conta?{" "}
            <Link to="/register" className="auth-link">
              Criar conta
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