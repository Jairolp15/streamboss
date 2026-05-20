import { useEffect, useState } from "react";
import { getPublicPlatforms, publicSubmitRequest } from "../api/public";
import toast from "react-hot-toast";

export default function PublicRegister() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1 = Register Form, 2 = Credentials Screen

  // Form inputs
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [deviceType, setDeviceType] = useState("phone");
  const [selectedPlatform, setSelectedPlatform] = useState("");

  // Result credentials
  const [regResult, setRegResult] = useState(null);

  useEffect(() => {
    getPublicPlatforms()
      .then(({ data }) => {
        setPlatforms(data);
      })
      .catch(() => {
        toast.error("Error al cargar las plataformas. Por favor, recarga la página.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
      const { data } = await publicSubmitRequest({
        full_name: clientName,
        phone_whatsapp: clientPhone || null,
        device_type: deviceType,
        platform_id: parseInt(selectedPlatform),
      });

      setRegResult(data);
      setStep(2);
      toast.success("¡Solicitud enviada con éxito!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al enviar la solicitud.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const handleWhatsAppShare = () => {
    const text = `Hola, he enviado una solicitud para obtener una pantalla a nombre de *${clientName}*. Quedo a la espera de mis credenciales.`;
    const encodedText = encodeURIComponent(text);
    // Replace this with your actual support number
    const supportPhone = "1234567890"; 
    window.open(`https://wa.me/${supportPhone}?text=${encodedText}`, "_blank", "noopener,noreferrer");
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
                  boxShadow: "0 0 15px rgba(0, 200, 83, 0.4)"
                }} 
              />
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>StreamMaster_ve Quick Access</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Regístrate y obtén tu perfil de streaming asignado de inmediato.
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
                    onChange={(e) => setSelectedPlatform(e.target.value)}
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
                  {saving ? "Asignando tu perfil..." : "🚀 Obtener Acceso Inmediato"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="animate-fade">
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>⏳</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>¡Solicitud Recibida!</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Un administrador revisará tu solicitud y te contactará pronto por WhatsApp con tus credenciales de acceso.
              </p>
            </div>

            <div
              style={{
                background: "rgba(10, 5, 25, 0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                marginBottom: "1.5rem",
                textAlign: "center"
              }}
            >
              <h3 style={{ color: "var(--accent-light)", marginBottom: "0.5rem" }}>¿Qué sigue?</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Asegúrate de que el número de WhatsApp que proporcionaste sea correcto. Recibirás un mensaje con tu usuario, contraseña y perfil asignado.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-whatsapp"
                onClick={handleWhatsAppShare}
                style={{ justifyContent: "center", padding: "0.8rem", fontWeight: 700 }}
              >
                💬 Notificar a Soporte por WhatsApp
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setClientName("");
                  setClientPhone("");
                  setSelectedPlatform("");
                  setStep(1);
                  setRegResult(null);
                }}
                style={{ justifyContent: "center", padding: "0.8rem" }}
              >
                Solicitar Otra Cuenta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
