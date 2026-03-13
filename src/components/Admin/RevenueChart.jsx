import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { getRevenueDataFromBookings } from '../../services/adminService'

const TIME_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: '6months', label: 'Last 6 months' },
  { value: '12months', label: 'Last 12 months' }
]

function RevenueChart() {
  const [timeRange, setTimeRange] = useState('6months')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getRevenueDataFromBookings(timeRange)
      .then((res) => {
        if (!cancelled) {
          setData(Array.isArray(res) ? res : [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load revenue data')
          setData([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [timeRange])

  if (error) {
    return (
      <div className="revenue-chart">
        <div className="chart-header">
          <div>
            <h3>Revenue Overview</h3>
            <p>Revenue from confirmed bookings</p>
          </div>
        </div>
        <p className="revenue-chart-error">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="revenue-chart">
        <div className="chart-header">
          <div>
            <h3>Revenue Overview</h3>
            <p>Revenue from confirmed bookings</p>
          </div>
        </div>
        <p className="revenue-chart-loading">Loading chart...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="revenue-chart">
        <div className="chart-header">
          <div>
            <h3>Revenue Overview</h3>
            <p>Revenue from confirmed bookings</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="chart-select"
          >
            {TIME_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p className="no-data">No revenue data for this period</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({ name: d.label, revenue: d.revenue }))

  return (
    <div className="revenue-chart">
      <div className="chart-header">
        <div>
          <h3>Revenue Overview</h3>
          <p>Revenue from confirmed bookings</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="chart-select"
        >
          {TIME_RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="chart-container chart-container-recharts">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af35" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8B0000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(211,49,49,0.3)', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value) => [value?.toLocaleString(), 'Revenue']}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#d4af35"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RevenueChart
