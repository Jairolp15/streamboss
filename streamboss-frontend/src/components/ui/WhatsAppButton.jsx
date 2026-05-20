import { useState } from "react";
import { getWhatsAppLink } from "../../api/subscriptions";
import toast from "react-hot-toast";

export default function WhatsAppButton({ subscriptionId, small = false }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data } = await getWhatsAppLink(subscriptionId);
      window.open(data.wa_link, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("No se pudo generar el link. ¿El cliente tiene WhatsApp?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id={`wa-btn-${subscriptionId}`}
      className={`btn btn-whatsapp${small ? " btn-sm" : ""}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "⏳" : "💬"} {small ? "WhatsApp" : "Enviar por WhatsApp"}
    </button>
  );
}
