import { useEffect, useState } from "react";
import { getSubscriptions, updateSubscription } from "../../api/subscriptions";
import { createSubscription, cancelSubscription, deleteSubscription } from "../../api/subscriptions";
import { createClient } from "../../api/clients";
import { getPlatforms } from "../../api/platforms";
import { getMasterAccounts } from "../../api/masterAccounts";
import ExpiryBadge from "../../components/ui/ExpiryBadge";
import PlatformBadge from "../../components/ui/PlatformBadge";
import WhatsAppButton from "../../components/ui/WhatsAppButton";
import toast from "react-hot-toast";

const DEVICE_ICONS = { phone: "📱", laptop: "💻", tv: "📺" };

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1 = Form, 2 = Success Screen
  const [saving, setSaving] = useState(false);
  const [successSubId, setSuccessSubId] = useState(null);

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [deviceType, setDeviceType] = useState("phone");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [endDate, setEndDate] = useState("");

  // Data fetched for modal selection
  const [platforms, setPlatforms] = useState([]);
  const [masterAccounts, setMasterAccounts] = useState([]);

  // ── Edit modal states ──────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [editEndDate, setEditEndDate] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  // ──────────────────────────────────────────────────────────────

  const load = () => {
    setLoading(true);
    getSubscriptions()
      .then(({ data }) => setSubs(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancel = async (id) => {
    try {
      await cancelSubscription(id);
      toast.success("Suscripción cancelada y perfil liberado");
      load();
    } catch {
      toast.error("Error al cancelar");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSubscription(id);
      toast.success("Suscripción eliminada definitivamente");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  // ── Edit handlers ──────────────────────────────────────────────
  const handleOpenEditModal = (sub) => {
    setEditSub(sub);
    setEditEndDate(sub.end_date || "");
    setEditPin(sub.profile_pin || "");
    setEditEmail(sub.master_email || "");
    setEditPassword(sub.master_password || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editSub) return;
    setEditSaving(true);
    try {
      await updateSubscription(editSub.id, {
        end_date: editEndDate || undefined,
        profile_pin: editPin !== editSub.profile_pin ? editPin : undefined,
        master_email: editEmail !== editSub.master_email ? editEmail : undefined,
        master_password: editPassword !== editSub.master_password ? editPassword : undefined,
      });
      toast.success("✅ Suscripción actualizada");
      setShowEditModal(false);
      setEditSub(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al guardar cambios");
    } finally {
      setEditSaving(false);
    }
  };
  // ──────────────────────────────────────────────────────────────

  const getThirtyDaysFromNow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  const handleOpenModal = async () => {
    setSelectedPlatform("");
    setSelectedProfileId("");
    setClientName("");
    setClientPhone("");
    setDeviceType("phone");
    setEndDate(getThirtyDaysFromNow());
    setStep(1);
    setSuccessSubId(null);
    setShowModal(true);

    try {
      const [platRes, accRes] = await Promise.all([getPlatforms(), getMasterAccounts()]);
      setPlatforms(platRes.data);
      setMasterAccounts(accRes.data);
    } catch {
      toast.error("Error al cargar plataformas o cuentas");
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    if (!selectedPlatform) {
      toast.error("Selecciona una plataforma");
      return;
    }
    if (!selectedProfileId) {
      toast.error("Selecciona un perfil disponible");
      return;
    }
    if (!endDate) {
      toast.error("Selecciona una fecha de vencimiento");
      return;
    }

    setSaving(true);
    try {
      // 1. Create client first
      const clientRes = await createClient({
        full_name: clientName,
        phone_whatsapp: clientPhone || null,
        device_type: deviceType,
      });
      const clientId = clientRes.data.id;

      // 2. Create subscription immediately
      const todayStr = new Date().toISOString().split("T")[0];
      const subRes = await createSubscription({
        client_id: clientId,
        profile_id: parseInt(selectedProfileId),
        start_date: todayStr,
        end_date: endDate,
      });

      toast.success("Suscripción creada con éxito");
      setSuccessSubId(subRes.data.id);
      setStep(2); // Move to WhatsApp Sending Screen
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al crear la suscripción");
    } finally {
      setSaving(false);
    }
  };

  // Filter master accounts for the selected platform
  const filteredAccounts = masterAccounts.filter(
    (acc) => acc.platform_id === parseInt(selectedPlatform)
  );

  // Collect all available profiles from these filtered master accounts
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
            master_id: acc.id,
          });
        }
      });
    }
  });

  const filtered = subs.filter((s) => {
    if (filter === "expiring") return s.days_remaining !== null && s.days_remaining <= 3;
    if (filter === "active") return s.status === "active";
    if (filter === "expired") return s.status === "expired" || s.days_remaining < 0;
    return true;
  });

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Suscripciones</h2>
          <p className="page-subtitle">Gestión de clientes activos y perfiles asignados</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {["all", "expiring", "active", "expired"].map((f) => (
            <button key={f} className={`btn ${filter === f ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setFilter(f)}>
              {f === "all" ? "Todas" : f === "expiring" ? "🚨 Por vencer" : f === "active" ? "Activas" : "Vencidas"}
            </button>
          ))}
          <button className="btn btn-primary btn-sm" style={{ marginLeft: "0.5rem", fontWeight: "bold" }} onClick={handleOpenModal}>
            ＋ Nueva Suscripción
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><span className="empty-state-icon">📭</span><h3>Sin suscripciones</h3></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Dispositivo</th>
                <th>Plataforma</th>
                <th>Perfil / PIN</th>
                <th>Credenciales</th>
                <th>Vence</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.client_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.client_phone}</div>
                  </td>
                  <td>
                    <span title={s.device_type} className="device-icon">
                      {DEVICE_ICONS[s.device_type] ?? "📱"}
                    </span>{" "}
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.device_type}</span>
                  </td>
                  <td><PlatformBadge name={s.platform_name} color={s.platform_color} /></td>
                  <td>
                    <span style={{ fontWeight: 700 }}>#{s.profile_number}</span>
                    {s.profile_pin && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>PIN: {s.profile_pin}</span>}
                  </td>
                  <td>
                    <div style={{ fontSize: "0.8rem" }}>{s.master_email}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{s.master_password}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.8rem" }}>{s.end_date}</div>
                    <ExpiryBadge days={s.days_remaining} />
                  </td>
                  <td>
                    <span className={`badge badge-${s.status}`}>{s.status}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <WhatsAppButton subscriptionId={s.id} small />
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Editar credenciales, PIN y fecha"
                        onClick={() => handleOpenEditModal(s)}
                      >✏️</button>
                      {s.status !== "cancelled" ? (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(s.id)}>✕</button>
                      ) : (
                        <button className="btn btn-danger btn-sm" title="Eliminar definitivamente" onClick={() => handleDelete(s.id)}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: "550px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {step === 1 ? "🚀 Nueva Suscripción Directa" : "🎉 ¡Éxito!"}
              </span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {step === 1 ? (
              <form onSubmit={handleCreateSubscription}>
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
                          placeholder="Ej. Juan Pérez"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">WhatsApp (Opcional)</label>
                        <input
                          className="form-control"
                          placeholder="Ej. +584121112233"
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
                    {saving ? "Asignando..." : "🚀 Crear Suscripción Inmediata"}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: "4.5rem", marginBottom: "1rem" }}>🎉</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  ¡Asignación Completada con Éxito!
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem", padding: "0 1rem" }}>
                  El cliente y la suscripción se han guardado de inmediato. El perfil seleccionado se ha marcado como ocupado.
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

      {/* ── Edit Modal ─────────────────────────────────────────── */}
      {showEditModal && editSub && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✏️ Editar Suscripción</span>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem 0" }}>

                {/* Client info (read-only) */}
                <div style={{ background: "var(--surface-2, rgba(255,255,255,0.05))", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{editSub.client_name}</strong>
                  {" · "}{editSub.platform_name}{" · "}Perfil #{editSub.profile_number}
                </div>

                {/* Credentials section */}
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-light)", marginBottom: "0.75rem" }}>
                    🔐 Credenciales de la Cuenta
                  </h4>
                  <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                    <label className="form-label">Email / Usuario</label>
                    <input
                      className="form-control"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña</label>
                    <input
                      className="form-control"
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Contraseña actual"
                    />
                  </div>
                </div>

                {/* PIN + Expiry */}
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-light)", marginBottom: "0.75rem" }}>
                    📅 Perfil y Vencimiento
                  </h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">PIN del Perfil</label>
                      <input
                        className="form-control"
                        type="text"
                        value={editPin}
                        onChange={(e) => setEditPin(e.target.value)}
                        placeholder="Sin PIN"
                        maxLength={10}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha de Vencimiento</label>
                      <input
                        className="form-control"
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                  {editSaving ? "Guardando..." : "💾 Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────── */}
    </div>
  );
}

