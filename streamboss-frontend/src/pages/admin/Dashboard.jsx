import { useEffect, useState } from "react";
import { getSubscriptions } from "../../api/subscriptions";
import { getMasterAccounts } from "../../api/masterAccounts";
import { getClients } from "../../api/clients";
import { getAccountRequests } from "../../api/accountRequests";
import StatCard from "../../components/ui/StatCard";
import ExpiryBadge from "../../components/ui/ExpiryBadge";
import PlatformBadge from "../../components/ui/PlatformBadge";
import WhatsAppButton from "../../components/ui/WhatsAppButton";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [subs, setSubs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSubscriptions(), getMasterAccounts(), getClients(), getAccountRequests()])
      .then(([s, a, c, r]) => {
        setSubs(s.data);
        setAccounts(a.data);
        setClients(c.data);
        setRequests(r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  const expiring = subs.filter((s) => s.days_remaining !== null && s.days_remaining <= 3 && s.status !== "cancelled");
  const pendingReqs = requests.filter((r) => r.status === "pending");
  const activeAccounts = accounts.filter((a) => a.status === "active");
  const availableProfiles = accounts.reduce((acc, a) => acc + (a.available_count ?? 0), 0);

  const handleCopyLink = () => {
    const link = window.location.origin + "/auto-registro";
    navigator.clipboard.writeText(link);
    toast.success("Enlace de registro copiado al portapapeles");
  };

  const handleCopyReportLink = () => {
    const link = window.location.origin + "/reporte-error";
    navigator.clipboard.writeText(link);
    toast.success("Enlace de reporte de fallos copiado al portapapeles");
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Resumen general de la plataforma</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button 
            className="btn btn-secondary"
            onClick={handleCopyLink}
            style={{ padding: "0.6rem 1.2rem", fontSize: "0.85rem", gap: "0.5rem", borderRadius: "var(--radius-md)" }}
          >
            🔗 Enlace de Registro
          </button>
          <a 
            href="/auto-registro"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: "0.6rem 1.2rem", fontSize: "0.85rem", gap: "0.5rem", borderRadius: "var(--radius-md)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            📋 Ir a Registro Público
          </a>

          <button 
            className="btn btn-secondary"
            onClick={handleCopyReportLink}
            style={{ padding: "0.6rem 1.2rem", fontSize: "0.85rem", gap: "0.5rem", borderRadius: "var(--radius-md)" }}
          >
            🔗 Enlace de Reportes
          </button>
          <a 
            href="/reporte-error"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: "0.6rem 1.2rem", fontSize: "0.85rem", gap: "0.5rem", borderRadius: "var(--radius-md)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            🚨 Ir a Reporte Público
          </a>
        </div>
      </div>

      {expiring.length > 0 && (
        <div className="alert-bar" style={{ marginBottom: "1.5rem" }}>
          <span>🚨</span>
          <span>
            <strong>{expiring.length} suscripción{expiring.length > 1 ? "es" : ""}</strong> vence{expiring.length > 1 ? "n" : ""} en 3 días o menos. Revisa la sección de suscripciones.
          </span>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        <StatCard icon="🎬" label="Suscripciones activas" value={subs.filter((s) => s.status === "active" || s.status === "expiring").length} color="#7c3aed" />
        <StatCard icon="🔑" label="Cuentas maestras" value={activeAccounts.length} color="#3b82f6" />
        <StatCard icon="👤" label="Clientes totales" value={clients.length} color="#10b981" />
        <StatCard icon="⚠️" label="Por vencer (≤3d)" value={expiring.length} color="#ef4444" />
      </div>

      <div className="grid-2">
        {/* Expiring soon */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🚨 Vencimientos próximos</span>
          </div>
          {expiring.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <span className="empty-state-icon">✅</span>
              <p>Sin vencimientos urgentes</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {expiring.slice(0, 5).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.client_name}</div>
                    <PlatformBadge name={s.platform_name} color={s.platform_color} />
                  </div>
                  <ExpiryBadge days={s.days_remaining} />
                  <WhatsAppButton subscriptionId={s.id} small />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending requests */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📩 Solicitudes pendientes</span>
            {pendingReqs.length > 0 && <span className="nav-badge">{pendingReqs.length}</span>}
          </div>
          {pendingReqs.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <span className="empty-state-icon">✅</span>
              <p>Sin solicitudes pendientes</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pendingReqs.slice(0, 5).map((r) => (
                <div key={r.id} style={{ padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.875rem" }}>
                    <strong>{r.distributor_name}</strong> solicita
                  </div>
                  <PlatformBadge name={r.platform?.name} color={r.platform?.color_hex} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory overview */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <span className="card-title">📦 Inventario de Cuentas Maestras</span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{availableProfiles} perfiles disponibles</span>
        </div>
        <div className="grid-3">
          {accounts.map((a) => (
            <div key={a.id} style={{ padding: "1rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <PlatformBadge name={a.platform?.name} color={a.platform?.color_hex} />
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem", fontSize: "0.8rem" }}>
                <span style={{ color: "var(--success)" }}>✅ {a.available_count} libres</span>
                <span style={{ color: "var(--danger)" }}>🔴 {a.occupied_count} ocupados</span>
              </div>
              <ExpiryBadge days={a.days_until_expiry} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
