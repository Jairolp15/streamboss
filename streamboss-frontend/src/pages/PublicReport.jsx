import { useEffect, useState } from "react";
import { getPublicPlatforms } from "../api/public";
import { createReport } from "../api/reports";
import toast from "react-hot-toast";

export default function PublicReport() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1 = Formulario, 2 = Confirmación

  const [form, setForm] = useState({
    client_name: "",
    phone_whatsapp: "",
    platform_id: null,
    email: "",
    password: "",
    notes: "",
  });

  useEffect(() => {
    getPublicPlatforms()
      .then(({ data }) => setPlatforms(data))
      .catch(() => toast.error("Error al cargar plataformas. Recarga la página."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!form.platform_id) {
      toast.error("Selecciona una plataforma");
      return;
    }
    if (!form.email.trim()) {
      toast.error("El correo / usuario es obligatorio");
      return;
    }
    if (!form.password.trim()) {
      toast.error("La clave asignada es obligatoria");
      return;
    }
    if (!form.notes.trim()) {
      toast.error("Por favor describe el error");
      return;
    }

    setSaving(true);
    try {
      await createReport({
        ...form,
        platform_id: parseInt(form.platform_id),
      });
      setStep(2);
      toast.success("¡Reporte enviado correctamente!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al enviar el reporte");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      client_name: "",
      phone_whatsapp: "",
      platform_id: null,
      email: "",
      password: "",
      notes: "",
    });
    setStep(1);
  };

  if (loading) {
    return (
      <div className="spinner-container" style={{ background: "var(--bg-main)", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "radial-gradient(circle at top, #1a0a2e 0%, var(--bg-main) 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div
        className="card animate-fade"
        style={{
          maxWidth: "520px",
          width: "100%",
          padding: "2.5rem 2rem",
          background: "rgba(30, 15, 50, 0.55)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255, 100, 100, 0.15)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(220, 50, 50, 0.1)",
          borderRadius: "1.25rem",
        }}
      >
        {step === 1 ? (
          <div>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🚨</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>
                Reportar un Error
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.35rem" }}>
                Cuéntanos qué ocurrió y un administrador lo revisará a la brevedad.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

                {/* Nombre */}
                <div className="form-group">
                  <label className="form-label" style={{ color: "#ddd" }}>Nombre completo *</label>
                  <input
                    className="form-control"
                    placeholder="Ej. Juan Pérez"
                    value={form.client_name}
                    onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                    required
                    style={{ background: "rgba(10, 5, 25, 0.45)", color: "#fff" }}
                  />
                </div>

                {/* Teléfono */}
                <div className="form-group">
                  <label className="form-label" style={{ color: "#ddd" }}>Teléfono / WhatsApp</label>
                  <input
                    className="form-control"
                    placeholder="Ej. +584149998877"
                    value={form.phone_whatsapp}
                    onChange={(e) => setForm({ ...form, phone_whatsapp: e.target.value })}
                    style={{ background: "rgba(10, 5, 25, 0.45)", color: "#fff" }}
                  />
                </div>

                {/* Plataforma */}
                <div className="form-group">
                  <label className="form-label" style={{ color: "#ddd" }}>Plataforma afectada *</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "0.6rem",
                    }}
                  >
                    {platforms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setForm({ ...form, platform_id: p.id })}
                        style={{
                          padding: "0.8rem 0.5rem",
                          borderRadius: "var(--radius-md)",
                          border: `2px solid ${form.platform_id === p.id ? p.color_hex : "rgba(255,255,255,0.1)"}`,
                          background:
                            form.platform_id === p.id
                              ? `${p.color_hex}33`
                              : "rgba(10, 5, 25, 0.35)",
                          cursor: "pointer",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          transition: "all 0.2s",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: p.color_hex,
                            display: "block",
                            boxShadow: `0 0 6px ${p.color_hex}`,
                          }}
                        />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Correo / Usuario asignado */}
                <div className="form-group">
                  <label className="form-label" style={{ color: "#ddd" }}>Correo / Usuario asignado *</label>
                  <input
                    className="form-control"
                    placeholder="Ej. usuario@ejemplo.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    style={{ background: "rgba(10, 5, 25, 0.45)", color: "#fff" }}
                  />
                </div>

                {/* Contraseña */}
                <div className="form-group">
                  <label className="form-label" style={{ color: "#ddd" }}>Clave asignada *</label>
                  <input
                    className="form-control"
                    placeholder="La contraseña que te fue asignada"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    style={{ background: "rgba(10, 5, 25, 0.45)", color: "#fff" }}
                  />
                </div>

                {/* Descripción del error */}
                <div className="form-group">
                  <label className="form-label" style={{ color: "#ddd" }}>Descripción del error *</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Describe qué está ocurriendo con detalle..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    required
                    style={{ background: "rgba(10, 5, 25, 0.45)", color: "#fff", resize: "vertical" }}
                  />
                </div>

                {/* Nota de fecha automática */}
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
                  🕐 La fecha y hora del reporte se registran automáticamente
                </p>

                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={saving}
                  style={{
                    marginTop: "0.5rem",
                    justifyContent: "center",
                    padding: "0.85rem",
                    fontWeight: 700,
                    fontSize: "1rem",
                    background: "linear-gradient(135deg, #dc2626, #991b1b)",
                    boxShadow: "0 0 20px rgba(220, 38, 38, 0.4)",
                    border: "none",
                    color: "#fff",
                  }}
                >
                  {saving ? "Enviando reporte..." : "🚨 Enviar Reporte de Error"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // --- Paso 2: Confirmación ---
          <div className="animate-fade" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>
              ¡Reporte Enviado!
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
              Un administrador revisará tu reporte a la brevedad. Si dejaste tu número de WhatsApp, te contactaremos para informarte de la resolución.
            </p>

            <div
              style={{
                background: "rgba(10, 5, 25, 0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "0.75rem",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                textAlign: "left",
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: "#fff" }}>Resumen del reporte:</strong>
              <br />👤 {form.client_name}
              <br />📧 {form.email}
              <br />
              {form.phone_whatsapp && <>📱 {form.phone_whatsapp}<br /></>}
              📝 {form.notes}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ justifyContent: "center", padding: "0.8rem", width: "100%" }}
            >
              Enviar Otro Reporte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
