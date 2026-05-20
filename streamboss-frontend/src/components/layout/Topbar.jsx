import { useLocation } from "react-router-dom";

const TITLES = {
  "/": "Dashboard",
  "/subscriptions": "Suscripciones",
  "/master-accounts": "Cuentas Maestras",
  "/requests": "Solicitudes",
  "/users": "Distribuidores",
  "/my-clients": "Mis Clientes",
  "/request-account": "Solicitar Cuenta",
};

export default function Topbar({ onToggleSidebar }) {
  const { pathname } = useLocation();
  const title = Object.entries(TITLES).find(([path]) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path)
  )?.[1] ?? "StreamMaster_ve";

  return (
    <header className="topbar">
      <button className="hamburger-btn" onClick={onToggleSidebar}>
        ☰
      </button>
      <span className="topbar-title">{title}</span>
      <div className="topbar-actions">
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
          <span className="version-tag">StreamMaster_ve v1.0</span>
        </span>
      </div>
    </header>
  );
}
