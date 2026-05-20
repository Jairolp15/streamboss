import { useEffect, useState } from "react";
import { getClients, createClient } from "../../api/clients";
import toast from "react-hot-toast";

const DEVICE_ICONS = { phone: "📱", laptop: "💻", tv: "📺" };
const EMPTY = { full_name: "", phone_whatsapp: "", device_type: "phone" };

export default function MyClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getClients().then(({ data }) => setClients(data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createClient(form);
      toast.success("Cliente agregado");
      setShowModal(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Mis Clientes</h2>
          <p className="page-subtitle">{clients.length} clientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ Nuevo Cliente</button>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state"><span className="empty-state-icon">👤</span><h3>Sin clientes</h3><p>Agrega tu primer cliente</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Nombre</th><th>WhatsApp</th><th>Dispositivo</th><th>Registrado</th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                  <td>{c.phone_whatsapp ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td>{DEVICE_ICONS[c.device_type]} {c.device_type}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nuevo Cliente</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Nombre completo</label>
                  <input className="form-control" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp</label>
                  <input className="form-control" placeholder="+58 412..." value={form.phone_whatsapp} onChange={(e) => setForm({ ...form, phone_whatsapp: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dispositivo</label>
                  <select className="form-control" value={form.device_type} onChange={(e) => setForm({ ...form, device_type: e.target.value })}>
                    <option value="phone">📱 Teléfono</option>
                    <option value="laptop">💻 Laptop</option>
                    <option value="tv">📺 TV</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
