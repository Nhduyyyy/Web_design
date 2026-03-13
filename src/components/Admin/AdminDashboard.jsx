import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import DashboardOverview from './DashboardOverview'
import OrganizationManagement from './OrganizationManagement'
import UserManagement from './UserManagement'
import TheaterManagement from './TheaterManagement'
import ScheduleManagement from './ScheduleManagement'
import LivestreamManagement from './LivestreamManagement'
import EventManagement from './EventManagement'
import GameManagement from './GameManagement'
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
          {activeView === 'users' && <UserManagement />}
          {/* {activeView === 'theaters' && <TheaterManagement />} */}
          {activeView === 'organizations' && <OrganizationManagement />}
          {activeView === 'schedule' && <ScheduleManagement />}
          {activeView === 'livestream' && <LivestreamManagement />}
          {activeView === 'tickets' && <div className="coming-soon">Tickets - Coming Soon</div>}
          {activeView === 'events' && <EventManagement />}
          {activeView === 'game' && <GameManagement />}
          {activeView === 'reports' && <div className="coming-soon">Reports - Coming Soon</div>}
          {activeView === 'settings' && <div className="coming-soon">Settings - Coming Soon</div>}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
