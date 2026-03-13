function AdminSidebar({ activeView, setActiveView }) {
  const menuItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'users', icon: 'group', label: 'User Management' },
    // { id: 'theaters', icon: 'account_balance', label: 'Theater Management' },
    { id: 'organizations', icon: 'business', label: 'Organization Registration' },
    { id: 'schedule', icon: 'calendar_month', label: 'Show Schedule' },
    { id: 'livestream', icon: 'live_tv', label: 'Livestream' },
    // { id: 'tickets', icon: 'confirmation_number', label: 'Tickets' },
    { id: 'events', icon: 'event', label: 'Events' },
    { id: 'game', icon: 'sports_esports', label: 'Game Management' },
  ]

  const analyticsItems = [
    { id: 'reports', icon: 'analytics', label: 'Reports' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ]

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="material-symbols-outlined">theaters</span>
        </div>
        <div className="sidebar-title">
          <h1>Tuồng Art</h1>
          <p>Admin Portal</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div className="nav-divider">
          <p>Analytics</p>
        </div>

        {analyticsItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar
