import { useEffect, useState } from "react";
import { getMasterAccounts, createMasterAccount, deleteMasterAccount, updateMasterAccount } from "../../api/masterAccounts";
import { getPlatforms } from "../../api/platforms";
import { useNavigate } from "react-router-dom";
import PlatformBadge from "../../components/ui/PlatformBadge";
import ExpiryBadge from "../../components/ui/ExpiryBadge";
import toast from "react-hot-toast";

const EMPTY = { platform_id: "", email: "", password_encrypted: "", purchase_date: "", expiry_date: "", total_profiles: 5, notes: "" };
const EMPTY_EDIT = { email: "", password_encrypted: "", expiry_date: "" };

export default function MasterAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  // Edit credentials modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // cuenta seleccionada
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);

  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    Promise.all([getMasterAccounts(), getPlatforms()])
      .then(([a, p]) => { setAccounts(a.data); setPlatforms(p.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createMasterAccount({ 
        ...form, 
        platform_id: Number(form.platform_id), 
        total_profiles: Number(form.total_profiles) 
      });
      toast.success("Cuenta creada con perfiles generados automáticamente");
      setShowModal(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Error al crear cuenta");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMasterAccount(id);
      toast.success("Cuenta eliminada");
      load();
    } catch { toast.error("Error al eliminar"); }
  };

  const handleOpenEdit = (account) => {
    setEditTarget(account);
    setEditForm({
      email: account.email,
      password_encrypted: account.password_encrypted || "",
      expiry_date: account.expiry_date || "",
    });
    setShowEditModal(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.email.trim()) { toast.error("El correo es obligatorio"); return; }
    if (!editForm.password_encrypted.trim()) { toast.error("La contraseña es obligatoria"); return; }
    setEditSaving(true);
    try {
      const payload = {
        email: editForm.email.trim(),
        password_encrypted: editForm.password_encrypted.trim(),
      };
      if (editForm.expiry_date) payload.expiry_date = editForm.expiry_date;
      await updateMasterAccount(editTarget.id, payload);
      toast.success("Credenciales actualizadas correctamente");
      setShowEditModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Error al actualizar");
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Cuentas Maestras</h2>
          <p className="page-subtitle">Inventario de cuentas compradas por la administración</p>
        </div>
        <button id="new-master-account-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          ＋ Nueva Cuenta
        </button>
      </div>

      <div className="grid-3">
        {accounts.map((a) => (
          <div key={a.id} className="card" style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <PlatformBadge name={a.platform?.name} color={a.platform?.color_hex} />
              <ExpiryBadge days={a.days_until_expiry} />
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              📧 {a.email}
            </div>
            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--success)" }}>✅ {a.available_count} libres</span>
              <span style={{ color: "var(--danger)" }}>🔴 {a.occupied_count} ocupados</span>
              <span style={{ color: "var(--text-muted)" }}>/ {a.total_profiles} total</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/master-accounts/${a.id}/profiles`)}>
                🎭 Ver Perfiles
              </button>
              <button className="btn btn-secondary btn-sm" title="Editar credenciales" onClick={() => handleOpenEdit(a)}>✏️</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>🗑</button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <span className="empty-state-icon">🔑</span>
            <h3>Sin cuentas maestras</h3>
            <p>Agrega tu primera cuenta de streaming</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nueva Cuenta Maestra</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Plataforma</label>
                  <select className="form-control" value={form.platform_id} onChange={(e) => setForm({ ...form, platform_id: e.target.value })} required>
                    <option value="">Seleccionar...</option>
                    {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Perfiles totales</label>
                  <input type="number" className="form-control" min="1" max="10" value={form.total_profiles} onChange={(e) => setForm({ ...form, total_profiles: e.target.value })} required />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Email de la cuenta</label>
                  <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Contraseña</label>
                  <input type="text" className="form-control" value={form.password_encrypted} onChange={(e) => setForm({ ...form, password_encrypted: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de compra</label>
                  <input type="date" className="form-control" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de vencimiento</label>
                  <input type="date" className="form-control" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} required />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Notas (opcional)</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Guardando..." : "Crear Cuenta"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Credenciales */}
      {showEditModal && editTarget && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✏️ Editar Credenciales</span>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: "0.75rem", padding: "0.5rem 0" }}>
              <PlatformBadge name={editTarget.platform?.name} color={editTarget.platform?.color_hex} />
            </div>
            <form onSubmit={handleEditSave}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Correo / Usuario de la cuenta *</label>
                  <input
                    className="form-control"
                    type="text"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="nuevo@correo.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nueva contraseña *</label>
                  <input
                    className="form-control"
                    type="text"
                    value={editForm.password_encrypted}
                    onChange={(e) => setEditForm({ ...editForm, password_encrypted: e.target.value })}
                    placeholder="Nueva contraseña"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nueva fecha de vencimiento (opcional)</label>
                  <input
                    className="form-control"
                    type="date"
                    value={editForm.expiry_date}
                    onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                  />
                  <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.35rem" }}>
                    Renueva la fecha sin perder los suscriptores asignados.
                  </p>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                  {editSaving ? "Guardando..." : "💾 Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
