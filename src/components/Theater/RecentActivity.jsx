import { useState, useEffect } from 'react'

const RecentActivity = ({ theaterId }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - you can implement real activity tracking later
    const mockActivities = [
      {
        id: 1,
        type: 'edit',
        icon: 'edit',
        color: 'accent-red',
        title: 'Main Grand Hall seat map updated',
        timestamp: 'Today at 10:24 AM',
        user: 'Admin'
      },
      {
        id: 2,
        type: 'add',
        icon: 'add',
        color: 'primary',
        title: 'New Venue "Lotus Studio" added',
        timestamp: 'Yesterday at 04:15 PM',
        user: 'Admin'
      },
      {
        id: 3,
        type: 'schedule',
        icon: 'event',
        color: 'primary',
        title: 'New schedule created for "Quan Công"',
        timestamp: '2 days ago',
        user: 'Manager'
      },
      {
        id: 4,
        type: 'livestream',
        icon: 'videocam',
        color: 'accent-red',
        title: 'Livestream started for evening show',
        timestamp: '3 days ago',
        user: 'System'
      }
    ]

    setTimeout(() => {
      setActivities(mockActivities)
      setLoading(false)
    }, 500)
  }, [theaterId])

  const getIconColor = (color) => {
    return color === 'accent-red' ? 'text-accent-red bg-accent-red/10' : 'text-primary bg-primary/10'
  }

  return (
    <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-100 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Hoạt động gần đây
        </h3>
        <button className="text-sm text-slate-400 hover:text-primary transition-colors">
          Xem tất cả
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">inbox</span>
          <p className="text-slate-400">Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-center gap-4 py-3 border-b border-border-gold last:border-0 hover:bg-background-dark/50 transition-colors rounded-lg px-2"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getIconColor(activity.color)}`}>
                <span className="material-symbols-outlined">{activity.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">{activity.title}</p>
                <p className="text-xs text-slate-500">
                  {activity.timestamp} by {activity.user}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentActivity
