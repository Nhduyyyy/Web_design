function TopTheaters({ theaters = [] }) {
  if (theaters.length === 0) {
    return (
      <div className="top-theaters">
        <h3>Top Theaters</h3>
        <p className="no-data">No theater data available</p>
      </div>
    )
  }

  return (
    <div className="top-theaters">
      <h3>Top Theaters</h3>
      
      <div className="theaters-list">
        {theaters.map(theater => (
          <div key={theater.id} className="theater-item">
            <div className="theater-icon">
              {theater.logo_url ? (
                <img src={theater.logo_url} alt={theater.name} />
              ) : (
                <span className="material-symbols-outlined">account_balance</span>
              )}
            </div>
            <div className="theater-info">
              <p className="theater-name">{theater.name}</p>
              <p className="theater-tickets">{theater.tickets} Tickets</p>
            </div>
            <div className="theater-stats">
              <p className="theater-revenue">{(theater.revenue / 1000).toFixed(1)}K</p>
              <p className={`theater-change ${theater.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {theater.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="view-report-btn">
        View Full Report
      </button>
    </div>
  )
}

export default TopTheaters
