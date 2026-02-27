/**
 * TopHeader — Hospital Dashboard top header bar
 */
export default function TopHeader({ title, adminName, onProfileClick }) {
  const initial = (adminName || "A")[0].toUpperCase();

  return (
    <header className="top-header">
      <div className="header-left">
        <h1>{title || "Dashboard"}</h1>
      </div>
      <div className="header-right">
        <div className="header-admin-info">
          <div className="header-admin-name">{adminName || "Admin"}</div>
          <div className="header-admin-role">Hospital Administrator</div>
        </div>
        <div
          className="header-avatar"
          onClick={onProfileClick}
          title="View Profile"
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
