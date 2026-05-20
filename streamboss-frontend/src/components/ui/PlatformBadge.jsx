export default function PlatformBadge({ name, color = "#6366f1" }) {
  return (
    <span
      className="platform-badge"
      style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
    >
      <span className="platform-dot" style={{ background: color }} />
      {name}
    </span>
  );
}
