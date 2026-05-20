import { useEffect, useState } from "react";
import { getClients, createClient } from "../../api/clients";
import { getPlatforms } from "../../api/platforms";
import toast from "react-hot-toast";

const EMPTY_USER = { name: "", email: "", password: "", role: "distributor", phone_whatsapp: "" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_USER);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    import("../../api/client").then(({ default: api }) =>
      api.get("/users/").then(({ data }) => setUsers(data))
    ).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { default: api } = await import("../../api/client");
      await api.post("/users/", form);
      toast.success("Distribuidor creado");
      setShowModal(false);
      setForm(EMPTY_USER);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Error al crear");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      const { default: api } = await import("../../api/client");
      await api.patch(`/users/${user.id}/`, { is_active: !user.is_active });
      load();
    } catch { toast.error("Error"); }
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Distribuidores</h2>
          <p className="page-subtitle">Gestión de usuarios del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ Nuevo Distribuidor</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>WhatsApp</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ fontSize: "0.85rem" }}>{u.email}</td>
                <td><span className={`badge badge-${u.role === "admin" ? "active" : "pending"}`}>{u.role}</span></td>
                <td style={{ fontSize: "0.85rem" }}>{u.phone_whatsapp ?? "—"}</td>
                <td>
                  <span className={`dot dot-${u.is_active ? "success" : "danger"}`} />
                  {" "}{u.is_active ? "Activo" : "Inactivo"}
                </td>
                <td>
                  <button className={`btn btn-sm ${u.is_active ? "btn-secondary" : "btn-success"}`} onClick={() => toggleActive(u)}>
                    {u.is_active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nuevo Distribuidor</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Nombre</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-control" value={form.phone_whatsapp} onChange={(e) => setForm({ ...form, phone_whatsapp: e.target.value })} /></div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}><label className="form-label">Email</label><input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}><label className="form-label">Contraseña</label><input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Rol</label><select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="distributor">Distribuidor</option><option value="admin">Admin</option></select></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creando..." : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
