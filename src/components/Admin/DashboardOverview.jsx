import { useState, useEffect } from 'react'
import MetricCard from './MetricCard'
import RevenueChart from './RevenueChart'
import TopTheaters from './TopTheaters'
import RecentActivities from './RecentActivities'
import { getAdminStats, getTopTheaters, getRecentActivities, getRevenueData } from '../../services/adminService'

function DashboardOverview() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalTheaters: 0,
    activeEvents: 0,
    totalRevenue: 0,
    userGrowth: '+0%',
    eventGrowth: '+0%',
    revenueGrowth: '+0%'
  })
  const [topTheaters, setTopTheaters] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all data in parallel with error handling for each
      const results = await Promise.allSettled([
        getAdminStats(),
        getTopTheaters(4),
        getRecentActivities(10),
        getRevenueData(6)
      ])

      // Extract successful results or use defaults
      const [statsResult, theatersResult, activitiesResult, revenueResult] = results

      setMetrics(statsResult.status === 'fulfilled' ? statsResult.value : {
        totalUsers: 0,
        totalTheaters: 0,
        activeEvents: 0,
        totalRevenue: 0,
        userGrowth: '+0%',
        eventGrowth: '+0%',
        revenueGrowth: '+0%'
      })

      setTopTheaters(theatersResult.status === 'fulfilled' ? theatersResult.value : [])
      setRecentActivities(activitiesResult.status === 'fulfilled' ? activitiesResult.value : [])
      setRevenueData(revenueResult.status === 'fulfilled' ? revenueResult.value : [])

      // Only show error if all requests failed
      const allFailed = results.every(r => r.status === 'rejected')
      if (allFailed) {
        setError('Failed to load dashboard data. Please check your database connection.')
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-overview">
        <div className="overview-header">
          <h2>Overview Dashboard</h2>
          <p>Loading dashboard data...</p>
        </div>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-overview">
        <div className="overview-header">
          <h2>Overview Dashboard</h2>
          <p className="error-message">Error loading data: {error}</p>
        </div>
        <button onClick={loadDashboardData} className="retry-btn">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard-overview">
      <div className="overview-header">
        <h2>Overview Dashboard</h2>
        <p>Welcome back. Here's what's happening with Tuồng Art platform today.</p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          icon="group"
          title="Total Users"
          value={metrics.totalUsers.toLocaleString()}
          change={metrics.userGrowth}
          changeType="positive"
        />
        <MetricCard
          icon="account_balance"
          title="Total Theaters"
          value={metrics.totalTheaters}
          change="Static"
          changeType="neutral"
        />
        <MetricCard
          icon="event_available"
          title="Active Events"
          value={metrics.activeEvents}
          change={metrics.eventGrowth}
          changeType="positive"
        />
        <MetricCard
          icon="payments"
          title="Total Revenue"
          value={`${(metrics.totalRevenue / 1000).toFixed(0)}K VND`}
          change={metrics.revenueGrowth}
          changeType="positive"
        />
      </div>

      <div className="charts-section">
        <RevenueChart data={revenueData} />
        <TopTheaters theaters={topTheaters} />
      </div>

      <RecentActivities activities={recentActivities} />
    </div>
  )
}

export default DashboardOverview
