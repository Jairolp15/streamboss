import { useEffect, useState } from "react";
import { getPlatforms } from "../../api/platforms";
import { createAccountRequest, getAccountRequests } from "../../api/accountRequests";
import PlatformBadge from "../../components/ui/PlatformBadge";
import toast from "react-hot-toast";

export default function RequestAccount() {
  const [platforms, setPlatforms] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getPlatforms(), getAccountRequests()])
      .then(([p, r]) => { setPlatforms(p.data); setMyRequests(r.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async () => {
    if (!selected) { toast.error("Selecciona una plataforma"); return; }
    setSending(true);
    try {
      await createAccountRequest({ platform_id: selected, notes });
      toast.success("Solicitud enviada al administrador");
      setSelected(null);
      setNotes("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Solicitar Cuenta</h2>
          <p className="page-subtitle">El administrador recibirá tu solicitud y te asignará un perfil</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "600px", marginBottom: "2rem" }}>
        <div className="card-header"><span className="card-title">Selecciona la plataforma</span></div>
        <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              style={{
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${selected === p.id ? p.color_hex : "var(--border)"}`,
                background: selected === p.id ? `${p.color_hex}22` : "var(--bg-elevated)",
                cursor: "pointer",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: p.color_hex, display: "block" }} />
              {p.name}
            </button>
          ))}
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label">Notas adicionales (opcional)</label>
          <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguna preferencia o comentario..." />
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={sending || !selected}>
          {sending ? "Enviando..." : "📩 Enviar Solicitud"}
        </button>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Mis solicitudes</span></div>
        {myRequests.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Sin solicitudes previas</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {myRequests.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                <PlatformBadge name={r.platform?.name} color={r.platform?.color_hex} />
                <span className={`badge badge-${r.status === "approved" ? "active" : r.status === "rejected" ? "expired" : "pending"}`}>{r.status}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
