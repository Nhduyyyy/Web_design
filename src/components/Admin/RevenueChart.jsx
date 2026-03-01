import { useState } from 'react'

function RevenueChart({ data = [] }) {
  const [timeRange, setTimeRange] = useState('6months')

  if (data.length === 0) {
    return (
      <div className="revenue-chart">
        <div className="chart-header">
          <div>
            <h3>Revenue Overview</h3>
            <p>Monthly ticket sales and livestream donations</p>
          </div>
        </div>
        <p className="no-data">No revenue data available</p>
      </div>
    )
  }

  // Calculate max revenue for scaling
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <div className="revenue-chart">
      <div className="chart-header">
        <div>
          <h3>Revenue Overview</h3>
          <p>Monthly ticket sales and livestream donations</p>
        </div>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="chart-select"
        >
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
        </select>
      </div>

      <div className="chart-container">
        <svg className="chart-svg" viewBox="0 0 1000 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af35" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B0000" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Generate path from real data */}
          <path 
            d={`M0,${300 - (data[0]?.revenue / maxRevenue * 250)} ${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 1000
              const y = 300 - (d.revenue / maxRevenue * 250)
              return `L${x},${y}`
            }).join(' ')} L1000,300 L0,300 Z`}
            fill="url(#fillGradient)" 
          />
          
          <path 
            d={`M0,${300 - (data[0]?.revenue / maxRevenue * 250)} ${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 1000
              const y = 300 - (d.revenue / maxRevenue * 250)
              return `L${x},${y}`
            }).join(' ')}`}
            fill="none" 
            stroke="#d4af35" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
        </svg>

        <div className="chart-labels">
          {data.map((d, i) => (
            <span key={i}>{d.month}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RevenueChart
