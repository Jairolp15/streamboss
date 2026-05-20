import { useEffect, useState } from "react";
import { getAccountRequests, resolveAccountRequest } from "../../api/accountRequests";
import { createClient } from "../../api/clients";
import { createSubscription } from "../../api/subscriptions";
import { getPlatforms } from "../../api/platforms";
import { getMasterAccounts } from "../../api/masterAccounts";
import PlatformBadge from "../../components/ui/PlatformBadge";
import WhatsAppButton from "../../components/ui/WhatsAppButton";
import toast from "react-hot-toast";

const DEVICE_ICONS = { phone: "📱", laptop: "💻", tv: "📺" };

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [successSubId, setSuccessSubId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [deviceType, setDeviceType] = useState("phone");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [endDate, setEndDate] = useState("");

  const [platforms, setPlatforms] = useState([]);
  const [masterAccounts, setMasterAccounts] = useState([]);

  const load = () => {
    setLoading(true);
    getAccountRequests().then(({ data }) => setRequests(data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const getThirtyDaysFromNow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  const parseNotes = (notes) => {
    try {
      return JSON.parse(notes);
    } catch {
      return {};
    }
  };

  const handleOpenApproveModal = async (r) => {
    const notesData = parseNotes(r.notes);
    
    setClientName(notesData.full_name || r.distributor_name || "");
    setClientPhone(notesData.phone_whatsapp || "");
    setDeviceType(notesData.device_type || "phone");
    setSelectedPlatform(r.platform_id ? r.platform_id.toString() : "");
    setSelectedProfileId("");
    setEndDate(getThirtyDaysFromNow());
    setStep(1);
    setSuccessSubId(null);
    setSelectedRequest(r);
    setShowModal(true);

    try {
      const [platRes, accRes] = await Promise.all([getPlatforms(), getMasterAccounts()]);
      setPlatforms(platRes.data);
      setMasterAccounts(accRes.data);
    } catch {
      toast.error("Error al cargar plataformas o cuentas");
    }
  };

  const handleReject = async (id) => {
    try {
      await resolveAccountRequest(id, { status: "rejected" });
      toast.success("Solicitud rechazada");
      load();
    } catch { toast.error("Error al rechazar"); }
  };

  const handleApproveAndAssign = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !selectedPlatform || !selectedProfileId || !endDate) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setSaving(true);
    try {
      // 1. Create client
      const clientRes = await createClient({
        full_name: clientName,
        phone_whatsapp: clientPhone || null,
        device_type: deviceType,
      });
      const clientId = clientRes.data.id;

      // 2. Create subscription
      const todayStr = new Date().toISOString().split("T")[0];
      const subRes = await createSubscription({
        client_id: clientId,
        profile_id: parseInt(selectedProfileId),
        start_date: todayStr,
        end_date: endDate,
      });

      // 3. Resolve request
      await resolveAccountRequest(selectedRequest.id, { status: "approved" });

      toast.success("Perfil asignado y solicitud aprobada con éxito");
      setSuccessSubId(subRes.data.id);
      setStep(2);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al procesar la asignación");
    } finally {
      setSaving(false);
    }
  };

  const filteredAccounts = masterAccounts.filter(
    (acc) => acc.platform_id === parseInt(selectedPlatform)
  );

  const availableProfiles = [];
  filteredAccounts.forEach((acc) => {
    if (acc.profiles) {
      acc.profiles.forEach((p) => {
        if (p.status === "available") {
          availableProfiles.push({
            profile_id: p.id,
            profile_number: p.profile_number,
            pin: p.pin,
            master_email: acc.email,
          });
        }
      });
    }
  });

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;
  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  const getLocalDateString = (dateString) => {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const filteredResolved = resolved.filter((r) => {
    if (!dateFilter) return false;
    return getLocalDateString(r.created_at) === dateFilter;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Solicitudes de Cuenta</h2>
          <p className="page-subtitle">Solicitudes públicas y de distribuidores — {pending.length} pendientes</p>
        </div>
      </div>

      {pending.length > 0 && (
        <>
          <h3 style={{ marginBottom: "1rem", color: "var(--warning)" }}>⏳ Pendientes</h3>
          <div className="grid-2" style={{ marginBottom: "2rem" }}>
            {pending.map((r) => {
              const notesData = parseNotes(r.notes);
              const isPublic = notesData.is_public_request;
              return (
              <div key={r.id} className="card" style={{ borderColor: "rgba(245,158,11,0.3)" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: isPublic ? "var(--accent-light)" : "#fff" }}>
                    {isPublic ? "🌐 Solicitud Pública" : `👤 ${r.distributor_name}`}
                  </div>
                  {isPublic && (
                    <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                      <strong>Cliente:</strong> {notesData.full_name} <br/>
                      <strong>WhatsApp:</strong> {notesData.phone_whatsapp || "N/A"} <br/>
                      <strong>Dispositivo:</strong> {DEVICE_ICONS[notesData.device_type] || "📱"} {notesData.device_type}
                    </div>
                  )}
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>solicita un perfil de</div>
                  <PlatformBadge name={r.platform?.name} color={r.platform?.color_hex} />
                </div>
                {!isPublic && r.notes && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>{r.notes}</p>}
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  {new Date(r.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-success btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleOpenApproveModal(r)}>✅ Aprobar</button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleReject(r.id)}>✕ Rechazar</button>
                </div>
              </div>
            )})}
          </div>
        </>
      )}

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
          <thead><tr><th>Origen</th><th>Plataforma</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {filteredResolved.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                {!dateFilter ? "📅 Selecciona una fecha para ver el historial" : "📭 No hay solicitudes en la fecha seleccionada"}
              </td></tr>
            ) : filteredResolved.map((r) => {
              const notesData = parseNotes(r.notes);
              const isPublic = notesData.is_public_request;
              return (
              <tr key={r.id}>
                <td>{isPublic ? "🌐 Solicitud Pública" : r.distributor_name}</td>
                <td><PlatformBadge name={r.platform?.name} color={r.platform?.color_hex} /></td>
                <td><span className={`badge badge-${r.status === "approved" ? "active" : "expired"}`}>{r.status}</span></td>
                <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: "550px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {step === 1 ? "✅ Aprobar Solicitud y Asignar Perfil" : "🎉 ¡Asignación Completa!"}
              </span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {step === 1 ? (
              <form onSubmit={handleApproveAndAssign}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem 0" }}>
                  <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-light)", marginBottom: "0.5rem" }}>
                      👤 Datos del Cliente
                    </h4>
                    <div className="form-grid">
                      <div className="form-group" style={{ gridColumn: "1/-1" }}>
                        <label className="form-label">Nombre Completo *</label>
                        <input
                          className="form-control"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">WhatsApp (Opcional)</label>
                        <input
                          className="form-control"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Dispositivo</label>
                        <select
                          className="form-control"
                          value={deviceType}
                          onChange={(e) => setDeviceType(e.target.value)}
                        >
                          <option value="phone">📱 Teléfono</option>
                          <option value="laptop">💻 Laptop</option>
                          <option value="tv">📺 TV</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-light)", marginBottom: "0.5rem" }}>
                      🎬 Asignación de Cuenta y Perfil
                    </h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Plataforma *</label>
                        <select
                          className="form-control"
                          value={selectedPlatform}
                          onChange={(e) => {
                            setSelectedPlatform(e.target.value);
                            setSelectedProfileId(""); // reset
                          }}
                          required
                        >
                          <option value="">-- Selecciona --</option>
                          {platforms.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fecha de Vencimiento *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ gridColumn: "1/-1" }}>
                        <label className="form-label">Perfil Libre Disponible *</label>
                        <select
                          className="form-control"
                          value={selectedProfileId}
                          onChange={(e) => setSelectedProfileId(e.target.value)}
                          disabled={!selectedPlatform}
                          required
                        >
                          <option value="">
                            {!selectedPlatform
                              ? "-- Elige primero una plataforma --"
                              : availableProfiles.length === 0
                              ? "-- Sin perfiles libres en esta plataforma --"
                              : "-- Selecciona un perfil disponible --"}
                          </option>
                          {availableProfiles.map((p) => (
                            <option key={p.profile_id} value={p.profile_id}>
                              Perfil #{p.profile_number} {p.pin ? `(PIN: ${p.pin})` : "(Sin PIN)"} — {p.master_email}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: "1rem" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Asignando..." : "✅ Aprobar y Asignar Perfil"}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: "4.5rem", marginBottom: "1rem" }}>🎉</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  ¡Perfil Asignado con Éxito!
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem", padding: "0 1rem" }}>
                  La solicitud ha sido aprobada y el perfil ha sido asignado al cliente.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "320px", margin: "0 auto" }}>
                  <WhatsAppButton subscriptionId={successSubId} />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    style={{ justifyContent: "center" }}
                  >
                    Listo / Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

