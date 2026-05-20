import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const ADMIN_NAV = [
  { to: "/", icon: "📊", label: "Dashboard" },
  { to: "/subscriptions", icon: "🎬", label: "Suscripciones" },
  { to: "/master-accounts", icon: "🔑", label: "Cuentas Maestras" },
  { to: "/requests", icon: "📩", label: "Solicitudes" },
  { to: "/reports", icon: "⚠️", label: "Reportes" },
  { to: "/users", icon: "👥", label: "Distribuidores" },
];

const DISTRIBUTOR_NAV = [
  { to: "/my-clients", icon: "👤", label: "Mis Clientes" },
  { to: "/request-account", icon: "➕", label: "Solicitar Cuenta" },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const nav = user?.role === "admin" ? ADMIN_NAV : DISTRIBUTOR_NAV;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLinkClick = () => {
    if (setIsOpen) setIsOpen(false);
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-logo" style={{ display: "flex", alignItems: "center" }}>
        <img 
          src="/logo.jpg?v=2" 
          alt="StreamMaster_ve Logo" 
          style={{ 
            width: "36px", 
            height: "36px", 
            borderRadius: "50%", 
            objectFit: "cover", 
            marginRight: "0.75rem", 
            border: "1.5px solid #00C853",
            boxShadow: "0 0 10px rgba(0, 200, 83, 0.3)"
          }} 
        />
        <h1 style={{ fontSize: "1rem", margin: 0, letterSpacing: "-0.02em" }}>StreamMaster_ve</h1>
        <button className="sidebar-close-btn" onClick={() => setIsOpen && setIsOpen(false)}>
          ✕
        </button>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">
          {user?.role === "admin" ? "Administración" : "Mi Panel"}
        </span>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={handleLinkClick}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" title="Cerrar sesión" onClick={handleLogout}>
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
}
