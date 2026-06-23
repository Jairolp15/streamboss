import { useEffect, useState, useCallback } from "react";
import { getPublicPlatforms, publicSubmitRequest } from "../api/public";
import toast from "react-hot-toast";

const SUPPORT_PHONE = "584261338316";
const MAX_RETRIES = 6;       // intentos máximos
const RETRY_DELAY_MS = 8000; // 8 segundos entre intentos

export default function PublicRegister() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1 = Formulario, 2 = Confirmación

  // Form inputs
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [deviceType, setDeviceType] = useState("phone");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [desiredPin, setDesiredPin] = useState("");

  const loadPlatforms = useCallback((attempt = 0) => {
    setLoading(true);
    setLoadError(false);
    setRetryCount(attempt);

    getPublicPlatforms()
      .then(({ data }) => {
        setPlatforms(data);
        setLoading(false);
      })
      .catch(() => {
        if (attempt < MAX_RETRIES) {
          // Reintenta automáticamente mientras el servidor de Render despierta
          setTimeout(() => loadPlatforms(attempt + 1), RETRY_DELAY_MS);
        } else {
          setLoading(false);
          setLoadError(true);
        }
      });
  }, []);

  useEffect(() => {
    loadPlatforms(0);
  }, [loadPlatforms]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!selectedPlatform) {
      toast.error("Por favor, selecciona una plataforma");
      return;
    }

    setSaving(true);
    try {
      await publicSubmitRequest({
        full_name: clientName,
        phone_whatsapp: clientPhone || null,
        device_type: deviceType,
        platform_id: parseInt(selectedPlatform),
        desired_pin: desiredPin.trim() || null,
      });

      setStep(2);
      toast.success("¡Solicitud enviada con éxito!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al enviar la solicitud. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Hola, acabo de registrarme para obtener una pantalla de streaming a nombre de *${clientName}*. Quedo a la espera de mis credenciales de acceso. 🙏`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${SUPPORT_PHONE}?text=${encodedText}`, "_blank", "noopener,noreferrer");
  };

  // ── Pantalla de carga / despertando servidor ──
  if (loading) {
    const isWakingUp = retryCount > 0;
    return (
      <div
        style={{
          background: "radial-gradient(circle at top, #1c133a 0%, var(--bg-main) 100%)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
            maxWidth: "360px",
          }}
        >
          <div className="spinner" style={{ width: "52px", height: "52px" }} />

          {isWakingUp ? (
            <>
              <h3 style={{ color: "#fff", margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                ☕ Iniciando el servidor...
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0, lineHeight: 1.6 }}>
                El servidor estaba en reposo y está despertando.
                <br />
                <strong style={{ color: "var(--accent-light)" }}>Esto tarda ~30 segundos la primera vez.</strong>
                <br />
                Por favor espera, no cierres la página. ✅
              </p>
              <div
                style={{
                  background: "rgba(124, 77, 255, 0.12)",
                  border: "1px solid rgba(124, 77, 255, 0.3)",
                  borderRadius: "0.75rem",
                  padding: "0.6rem 1rem",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                Intento {retryCount} de {MAX_RETRIES}...
              </div>
            </>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              Cargando formulario de registro...
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Error fatal (no pudo cargar después de todos los intentos) ──
  if (loadError) {
    return (
      <div
        style={{
          background: "radial-gradient(circle at top, #1c133a 0%, var(--bg-main) 100%)",
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
            maxWidth: "400px",
            width: "100%",
            padding: "2.5rem 2rem",
            background: "rgba(30, 24, 54, 0.55)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "1.25rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😔</div>
          <h2 style={{ color: "#fff", fontWeight: 800, marginBottom: "0.5rem" }}>
            Servicio no disponible
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            No pudimos conectar con el servidor. Por favor intenta de nuevo en unos minutos.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => loadPlatforms(0)}
            style={{ width: "100%", justifyContent: "center", padding: "0.85rem", fontWeight: 700 }}
          >
            🔄 Reintentar
          </button>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "1rem" }}>
            ¿Sigues con problemas?{" "}
            <a
              href={`https://wa.me/${SUPPORT_PHONE}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-light)", textDecoration: "none" }}
            >
              Escríbenos por WhatsApp
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Página principal ──
  return (
    <div
      style={{
        background: "radial-gradient(circle at top, #1c133a 0%, var(--bg-main) 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        color: "var(--text-main)",
      }}
    >
      <div
        className="card animate-fade"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "2.5rem 2rem",
          background: "rgba(30, 24, 54, 0.45)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(124, 77, 255, 0.15)",
          borderRadius: "1.25rem",
        }}
      >
        {step === 1 ? (
          /* ── Paso 1: Formulario ── */
          <div>
            <div style={{ textAlign: "center", marginBottom: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img
                src="/logo.jpg?v=2"
                alt="StreamMaster_ve Logo"
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2.5px solid #00C853",
                  marginBottom: "1rem",
                  boxShadow: "0 0 15px rgba(0, 200, 83, 0.4)",
                }}
              />
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>
                StreamMaster_ve
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Regístrate y obtén tu perfil de streaming asignado.
              </p>
            </div>

            <form onSubmit={handleRegister}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: "#fff" }}>Nombre Completo *</label>
                  <input
                    className="form-control"
                    placeholder="Ej. Maria Lopez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    style={{ background: "rgba(10, 5, 25, 0.4)", color: "#fff" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: "#fff" }}>WhatsApp (Con código de país)</label>
                  <input
                    className="form-control"
                    placeholder="Ej. +584149998877"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    style={{ background: "rgba(10, 5, 25, 0.4)", color: "#fff" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: "#fff" }}>Dispositivo a utilizar</label>
                  <select
                    className="form-control"
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    style={{ background: "rgba(10, 5, 25, 0.4)", color: "#fff" }}
                  >
                    <option value="phone">📱 Teléfono / Tablet</option>
                    <option value="laptop">💻 Computadora / Laptop</option>
                    <option value="tv">📺 Smart TV / TV Box</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: "#fff" }}>Elige tu Plataforma *</label>
                  <select
                    className="form-control"
                    value={selectedPlatform}
                    onChange={(e) => { setSelectedPlatform(e.target.value); setDesiredPin(""); }}
                    required
                    style={{ background: "rgba(10, 5, 25, 0.4)", color: "#fff", borderColor: "var(--accent-main)" }}
                  >
                    <option value="">-- Selecciona una plataforma --</option>
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PIN field — only visible after picking a platform */}
                {selectedPlatform && (
                  <div className="form-group" style={{ animation: "fadeIn 0.25s ease" }}>
                    <label className="form-label" style={{ color: "#fff" }}>PIN deseado para tu perfil
                      <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>(Opcional)</span>
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Ej. 1234"
                      value={desiredPin}
                      onChange={(e) => setDesiredPin(e.target.value.replace(/\D/g, ""))}
                      style={{ background: "rgba(10, 5, 25, 0.4)", color: "#fff", letterSpacing: "0.2rem", fontWeight: 700 }}
                    />
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem", margin: "0.3rem 0 0" }}>
                      🔒 Este PIN protegerá tu perfil. Déjalo vacío si no deseas uno.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{
                    marginTop: "1rem",
                    justifyContent: "center",
                    padding: "0.85rem",
                    fontWeight: 700,
                    boxShadow: "0 0 20px rgba(124, 77, 255, 0.4)",
                  }}
                >
                  {saving ? "Enviando solicitud..." : "🚀 Obtener Acceso"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ── Paso 2: Confirmación ── */
          <div className="animate-fade">
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>✅</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
                ¡Solicitud Recibida!
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Tu solicitud ha sido enviada. Un administrador la revisará y te enviará tus credenciales por WhatsApp.
              </p>
            </div>

            <div
              style={{
                background: "rgba(0, 200, 83, 0.08)",
                border: "1px solid rgba(0, 200, 83, 0.25)",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#00C853", marginBottom: "0.5rem", fontSize: "1rem" }}>¿Qué sigue?</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0, lineHeight: 1.6 }}>
                Asegúrate de que el número de WhatsApp que proporcionaste sea correcto.
                Recibirás un mensaje con tu usuario, contraseña y perfil asignado en breve.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-whatsapp"
                onClick={handleWhatsAppShare}
                style={{ justifyContent: "center", padding: "0.8rem", fontWeight: 700 }}
              >
                💬 Contactar a Soporte por WhatsApp
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setClientName("");
                  setClientPhone("");
                  setSelectedPlatform("");
                  setDeviceType("phone");
                  setDesiredPin("");
                  setStep(1);
                }}
                style={{ justifyContent: "center", padding: "0.8rem" }}
              >
                Registrar Otra Cuenta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
