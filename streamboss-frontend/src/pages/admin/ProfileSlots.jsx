import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMasterAccount } from "../../api/masterAccounts";
import { updateProfile } from "../../api/profiles";
import ProfileSlotGrid from "../../components/ui/ProfileSlotGrid";
import PlatformBadge from "../../components/ui/PlatformBadge";
import ExpiryBadge from "../../components/ui/ExpiryBadge";

export default function ProfileSlots() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [pinForm, setPinForm] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMasterAccount(id).then(({ data }) => setAccount(data)).finally(() => setLoading(false));
  }, [id]);

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!editingProfile) return;
    
    if (pinForm !== "" && (pinForm.length < 4 || pinForm.length > 6)) {
      setError("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }

    setSavingPin(true);
    setError("");
    try {
      const response = await updateProfile(editingProfile.id, { pin: pinForm || null });
      setAccount((prev) => {
        if (!prev) return prev;
        const updatedProfiles = prev.profiles.map((p) =>
          p.id === editingProfile.id ? { ...p, pin: response.data.pin } : p
        );
        return { ...prev, profiles: updatedProfiles };
      });
      setEditingProfile(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar el PIN. Asegúrate de ingresar un valor válido.");
    } finally {
      setSavingPin(false);
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;
  if (!account) return <p>Cuenta no encontrada</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Perfiles</h2>
          <p className="page-subtitle">Vista de disponibilidad y configuración de perfiles</p>
        </div>
        <PlatformBadge name={account.platform?.name} color={account.platform?.color_hex} />
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div><span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>EMAIL</span><div style={{ fontWeight: 600 }}>{account.email}</div></div>
          <div><span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>CONTRASEÑA</span><div style={{ fontFamily: "monospace" }}>{account.password_encrypted}</div></div>
          <div><span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>VENCIMIENTO</span><div><ExpiryBadge days={account.days_until_expiry} /></div></div>
          <div><span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>DISPONIBLES</span><div style={{ color: "var(--success)", fontWeight: 700 }}>{account.available_count}</div></div>
          <div><span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>OCUPADOS</span><div style={{ color: "var(--danger)", fontWeight: 700 }}>{account.occupied_count}</div></div>
        </div>
        <ProfileSlotGrid
          profiles={account.profiles ?? []}
          onEdit={(profile) => {
            setEditingProfile(profile);
            setPinForm(profile.pin || "");
            setError("");
          }}
        />
      </div>

      {editingProfile && (
        <div className="modal-overlay" onClick={() => setEditingProfile(null)}>
          <div className="modal animate-fade" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Configurar PIN del Perfil #{editingProfile.profile_number}</h3>
              <button className="btn-icon" onClick={() => setEditingProfile(null)}>✕</button>
            </div>
            <form onSubmit={handleSavePin}>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" htmlFor="pin-input">PIN de 4 a 6 dígitos (Opcional)</label>
                <input
                  id="pin-input"
                  type="text"
                  pattern="\d{4,6}"
                  maxLength={6}
                  placeholder="Ej. 1234 o 12345 o 123456 (vacío para eliminar)"
                  className="form-control"
                  value={pinForm}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (/^\d+$/.test(val) && val.length <= 6)) {
                      setPinForm(val);
                    }
                  }}
                  autoFocus
                />
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.5rem", lineHeight: "1.4" }}>
                  Ingresa un código de 4, 5 o 6 dígitos. Déjalo en blanco para eliminar el PIN actual del perfil.
                </p>
              </div>

              {error && (
                <div style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingProfile(null)}
                  disabled={savingPin}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPin}
                >
                  {savingPin ? "Guardando..." : "Guardar PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
