import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import DashboardOverview from './DashboardOverview'
import OrganizationManagement from './OrganizationManagement'
import './AdminDashboard.css'

function AdminDashboard() {
  const { user, profile } = useAuth()
  const [activeView, setActiveView] = useState('dashboard')

  return (
    <div className="admin-dashboard">
      <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="admin-main">
        <AdminHeader user={user} profile={profile} />
        
        <div className="admin-content">
          {activeView === 'dashboard' && <DashboardOverview />}
          {activeView === 'users' && <div className="coming-soon">User Management - Coming Soon</div>}
          {activeView === 'theaters' && <div className="coming-soon">Theater Management - Coming Soon</div>}
          {activeView === 'organizations' && <OrganizationManagement />}
          {activeView === 'schedule' && <div className="coming-soon">Show Schedule - Coming Soon</div>}
          {activeView === 'livestream' && <div className="coming-soon">Livestream - Coming Soon</div>}
          {activeView === 'tickets' && <div className="coming-soon">Tickets - Coming Soon</div>}
          {activeView === 'events' && <div className="coming-soon">Events - Coming Soon</div>}
          {activeView === 'reports' && <div className="coming-soon">Reports - Coming Soon</div>}
          {activeView === 'settings' && <div className="coming-soon">Settings - Coming Soon</div>}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
