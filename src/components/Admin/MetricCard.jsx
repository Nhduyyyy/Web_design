function MetricCard({ icon, title, value, change, changeType }) {
  const getChangeClass = () => {
    if (changeType === 'positive') return 'change-positive'
    if (changeType === 'negative') return 'change-negative'
    return 'change-neutral'
  }

  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`metric-change ${getChangeClass()}`}>
          {change}
        </span>
      </div>
      <p className="metric-title">{title}</p>
      <h3 className="metric-value">{value}</h3>
    </div>
  )
}

export default MetricCard
