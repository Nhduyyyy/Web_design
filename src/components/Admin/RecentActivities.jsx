function RecentActivities({ activities = [] }) {
  const getStatusClass = (status) => {
    switch(status) {
      case 'confirmed': return 'status-completed'
      case 'pending': return 'status-pending'
      case 'cancelled': return 'status-cancelled'
      case 'refunded': return 'status-cancelled'
      default: return ''
    }
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case 'confirmed': return 'Completed'
      case 'pending': return 'Pending'
      case 'cancelled': return 'Cancelled'
      case 'refunded': return 'Refunded'
      default: return status
    }
  }

  if (activities.length === 0) {
    return (
      <div className="recent-activities">
        <div className="activities-header">
          <h3>Recent Ticket Activities</h3>
        </div>
        <p className="no-data">No recent activities</p>
      </div>
    )
  }

  return (
    <div className="recent-activities">
      <div className="activities-header">
        <h3>Recent Ticket Activities</h3>
        <button className="export-btn">Export CSV</button>
      </div>

      <div className="activities-table-wrapper">
        <table className="activities-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Event</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(activity => (
              <tr key={activity.id}>
                <td>
                  <div className="customer-cell">
                    <div className="customer-avatar"></div>
                    <span>{activity.customer}</span>
                  </div>
                </td>
                <td>{activity.event}</td>
                <td className="date-cell">{activity.date}</td>
                <td className="amount-cell">{(activity.amount / 1000).toFixed(0)}K VND</td>
                <td>
                  <span className={`status-badge ${getStatusClass(activity.status)}`}>
                    {getStatusLabel(activity.status)}
                  </span>
                </td>
                <td>
                  <button className="action-btn">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentActivities
