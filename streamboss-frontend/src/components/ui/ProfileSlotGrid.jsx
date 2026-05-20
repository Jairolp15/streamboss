export default function ProfileSlotGrid({ profiles = [], onEdit = null }) {
  if (!profiles.length)
    return <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Sin perfiles</p>;

  return (
    <div className="profile-grid">
      {profiles.map((p) => {
        const isInteractive = !!onEdit;
        return (
          <div
            key={p.id}
            className={`profile-slot ${p.status} ${isInteractive ? "interactive" : ""}`}
            onClick={() => isInteractive && onEdit(p)}
            title={isInteractive ? "Haga clic para editar PIN" : undefined}
          >
            <span className="profile-slot-number">{p.profile_number}</span>
            <span>{p.status === "available" ? "Libre" : "Ocupado"}</span>
            {p.pin ? (
              <span className="profile-slot-pin">PIN: {p.pin}</span>
            ) : (
              <span className="profile-slot-pin none">Sin PIN</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
