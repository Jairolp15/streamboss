export default function ExpiryBadge({ days }) {
  if (days === null || days === undefined) return null;
  let cls = "ok";
  let icon = "✅";
  if (days <= 0) { cls = "critical"; icon = "🔴"; }
  else if (days <= 3) { cls = "critical"; icon = "🚨"; }
  else if (days <= 7) { cls = "warning"; icon = "⚠️"; }

  return (
    <span className={`expiry-badge ${cls}`}>
      {icon} {days <= 0 ? "Vencido" : `${days}d`}
    </span>
  );
}
