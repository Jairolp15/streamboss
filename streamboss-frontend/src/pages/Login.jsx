import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(email, password);
      setAuth(data.user, data.access_token);
      toast.success(`Bienvenido, ${data.user.name}!`);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img 
            src="/logo.jpg?v=2" 
            alt="StreamMaster_ve Logo" 
            style={{ 
              width: "100px", 
              height: "100px", 
              borderRadius: "50%", 
              objectFit: "cover", 
              border: "3px solid #00C853", 
              marginBottom: "1rem",
              boxShadow: "0 0 20px rgba(0, 200, 83, 0.4)"
            }} 
          />
          <h1 style={{ margin: 0 }}>StreamMaster_ve</h1>
        </div>
        <p className="login-subtitle">Plataforma de distribución de streaming</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="admin@admin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "0.5rem", justifyContent: "center", padding: "0.75rem" }}
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar al sistema"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          🔒 Acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  );
}
