import { useEffect, useState } from "react";
import { getReports, resolveReport } from "../../api/reports";
import PlatformBadge from "../../components/ui/PlatformBadge";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  pending: "pending",
  resolved: "active",
  rejected: "expired",
};

const STATUS_LABEL = {
  pending: "Pendiente",
  resolved: "Resuelto",
  rejected: "Denegado",
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");

  // Modal de resolución
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveAction, setResolveAction] = useState("resolved"); // resolved | rejected
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getReports()
      .then(({ data }) => setReports(data))
      .catch(() => toast.error("Error al cargar reportes"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openModal = (report, action) => {
    setSelectedReport(report);
    setResolveAction(action);
    setAdminNote("");
    setShowModal(true);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await resolveReport(selectedReport.id, {
        status: resolveAction,
        admin_note: adminNote.trim() || null,
      });
      toast.success(resolveAction === "resolved" ? "Reporte marcado como resuelto" : "Reporte denegado");
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al resolver el reporte");
    } finally {
      setSaving(false);
    }
  };

  const getLocalDateString = (dateString) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  const pending = reports.filter((r) => r.status === "pending");
  const resolved = reports.filter((r) => r.status !== "pending");
  const filteredResolved = resolved.filter((r) => {
    if (!dateFilter) return false;
    return getLocalDateString(r.created_at) === dateFilter;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Reportes de Error</h2>
          <p className="page-subtitle">
            Reportes de usuarios con problemas de acceso — {pending.length} pendientes
          </p>
        </div>
      </div>

      {/* Pendientes */}
      {pending.length > 0 && (
        <>
          <h3 style={{ marginBottom: "1rem", color: "var(--warning)" }}>⏳ Pendientes</h3>
          <div className="grid-2" style={{ marginBottom: "2rem" }}>
            {pending.map((r) => (
              <div key={r.id} className="card" style={{ borderColor: "rgba(245,158,11,0.3)" }}>
                {/* Header de la tarjeta */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
                      👤 {r.client_name}
                    </div>
                    {r.phone_whatsapp && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                        📱 {r.phone_whatsapp}
                      </div>
                    )}
                  </div>
                  <PlatformBadge name={r.platform?.name} color={r.platform?.color_hex} />
                </div>

                {/* Credenciales */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.6rem 0.75rem",
                    marginBottom: "0.75rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <div style={{ color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                    📧 <strong style={{ color: "var(--text-secondary)" }}>Usuario/Correo:</strong>{" "}
                    <span style={{ color: "#fff" }}>{r.email}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>
                    🔑 <strong style={{ color: "var(--text-secondary)" }}>Clave:</strong>{" "}
                    <span style={{ color: "#fff", fontFamily: "monospace" }}>{r.password}</span>
                  </div>
                </div>

                {/* Descripción del error */}
                <div
                  style={{
                    background: "rgba(220,38,38,0.08)",
                    border: "1px solid rgba(220,38,38,0.2)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.6rem 0.75rem",
                    marginBottom: "0.75rem",
                    fontSize: "0.82rem",
                    color: "#fca5a5",
                  }}
                >
                  🚨 <strong>Error reportado:</strong> {r.notes}
                </div>

                {/* Fecha */}
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  🕐{" "}
                  {new Date(r.created_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-success btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => openModal(r, "resolved")}
                  >
                    ✅ Resolver
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => openModal(r, "rejected")}
                  >
                    ✕ Denegar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pending.length === 0 && (
        <div className="empty-state" style={{ marginBottom: "2rem" }}>
          <span className="empty-state-icon">✅</span>
          <h3>Sin reportes pendientes</h3>
          <p>No hay reportes de error por revisar</p>
        </div>
      )}

      {/* Historial */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "var(--text-secondary)" }}>📋 Historial</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Filtrar por fecha:</span>
          <input
            type="date"
            className="form-control"
            style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button className="btn-icon" style={{ fontSize: "0.8rem", padding: "0.2rem" }} onClick={() => setDateFilter("")} title="Limpiar filtro">✕</button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Plataforma</th>
              <th>Error</th>
              <th>Nota Admin</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filteredResolved.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                  {!dateFilter ? "📅 Selecciona una fecha para ver el historial" : "📭 No hay reportes en la fecha seleccionada"}
                </td>
              </tr>
            ) : (
              filteredResolved.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.client_name}</div>
                    {r.phone_whatsapp && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.phone_whatsapp}</div>}
                  </td>
                  <td><PlatformBadge name={r.platform?.name} color={r.platform?.color_hex} /></td>
                  <td style={{ maxWidth: "200px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {r.notes.length > 60 ? r.notes.slice(0, 60) + "..." : r.notes}
                  </td>
                  <td style={{ maxWidth: "160px", fontSize: "0.8rem", color: "var(--accent-light)", fontStyle: r.admin_note ? "normal" : "italic" }}>
                    {r.admin_note || "—"}
                  </td>
                  <td>
                    <span className={`badge badge-${STATUS_BADGE[r.status]}`}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de resolución */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {resolveAction === "resolved" ? "✅ Resolver Reporte" : "✕ Denegar Reporte"}
              </span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleResolve}>
              <div style={{ padding: "0.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Resumen */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.85rem",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                  }}
                >
                  <div><strong>👤 Cliente:</strong> {selectedReport.client_name}</div>
                  {selectedReport.phone_whatsapp && (
                    <div><strong>📱 Teléfono:</strong> {selectedReport.phone_whatsapp}</div>
                  )}
                  <div><strong>🎬 Plataforma:</strong> {selectedReport.platform?.name}</div>
                  <div><strong>📧 Usuario:</strong> {selectedReport.email}</div>
                  <div style={{ color: "var(--danger)", marginTop: "0.25rem" }}>
                    <strong>🚨 Error:</strong> {selectedReport.notes}
                  </div>
                </div>

                {/* Nota del admin */}
                <div className="form-group">
                  <label className="form-label">
                    Nota de respuesta{" "}
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={
                      resolveAction === "resolved"
                        ? "Ej. El problema fue resuelto. Intenta iniciar sesión nuevamente."
                        : "Ej. Las credenciales son correctas. Por favor verifica tu conexión."
                    }
                    style={{ resize: "vertical" }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Esta nota será visible en el historial del reporte.
                  </span>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`btn ${resolveAction === "resolved" ? "btn-success" : "btn-danger"}`}
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : resolveAction === "resolved"
                    ? "✅ Marcar como Resuelto"
                    : "✕ Denegar Reporte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
