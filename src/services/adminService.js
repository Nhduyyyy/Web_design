import { supabase } from '../lib/supabase'

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async () => {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (usersError) throw usersError

    // Get total theaters count
    const { count: totalTheaters, error: theatersError } = await supabase
      .from('theaters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    if (theatersError) throw theatersError

    // Get active events count (scheduled + ongoing)
    const { count: activeEvents, error: eventsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .in('status', ['scheduled', 'ongoing'])

    if (eventsError) throw eventsError

    // Get total revenue from completed payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')

    if (paymentsError) throw paymentsError

    const totalRevenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0

    // Calculate growth rates (compare with last month)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const { count: lastMonthUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', lastMonth.toISOString())

    const userGrowth = lastMonthUsers ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : 0

    return {
      totalUsers: totalUsers || 0,
      totalTheaters: totalTheaters || 0,
      activeEvents: activeEvents || 0,
      totalRevenue: totalRevenue || 0,
      userGrowth: `+${userGrowth}%`,
      eventGrowth: '+5.2%', // TODO: Calculate real growth
      revenueGrowth: '+8.1%' // TODO: Calculate real growth
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    throw error
  }
}

/**
 * Get top theaters by revenue
 */
export const getTopTheaters = async (limit = 4) => {
  try {
    // Get all approved theaters
    const { data: theaters, error: theatersError } = await supabase
      .from('theaters')
      .select('id, name, logo_url')
      .eq('status', 'approved')

    if (theatersError) throw theatersError

    if (!theaters || theaters.length === 0) {
      return []
    }

    // Get bookings for each theater through schedules
    const theatersWithRevenue = await Promise.all(
      theaters.map(async (theater) => {
        // Get schedules for this theater
        const { data: schedules } = await supabase
          .from('schedules')
          .select('id')
          .eq('theater_id', theater.id)

        const scheduleIds = schedules?.map(s => s.id) || []

        if (scheduleIds.length === 0) {
          return {
            id: theater.id,
            name: theater.name,
            logo_url: theater.logo_url,
            tickets: 0,
            revenue: 0,
            change: '+0%'
          }
        }

        // Get confirmed bookings for these schedules
        const { data: bookings } = await supabase
          .from('bookings')
          .select('total_amount')
          .in('schedule_id', scheduleIds)
          .eq('status', 'confirmed')

        const revenue = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0
        const ticketCount = bookings?.length || 0

        return {
          id: theater.id,
          name: theater.name,
          logo_url: theater.logo_url,
          tickets: ticketCount,
          revenue: revenue,
          change: '+14%' // TODO: Calculate real change
        }
      })
    )

    // Sort by revenue and return top N
    theatersWithRevenue.sort((a, b) => b.revenue - a.revenue)
    return theatersWithRevenue.slice(0, limit)
  } catch (error) {
    console.error('Error fetching top theaters:', error)
    throw error
  }
}

/**
 * Get recent booking activities
 */
export const getRecentActivities = async (limit = 10) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_code,
        customer_name,
        customer_email,
        total_amount,
        status,
        created_at,
        schedule_id
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Get schedule and show info for each booking
    const activitiesWithDetails = await Promise.all(
      (bookings || []).map(async (booking) => {
        let eventName = 'Unknown Event'

        if (booking.schedule_id) {
          const { data: schedule } = await supabase
            .from('schedules')
            .select('title, show_id')
            .eq('id', booking.schedule_id)
            .single()

          if (schedule) {
            eventName = schedule.title

            // Try to get show title if available
            if (schedule.show_id) {
              const { data: show } = await supabase
                .from('shows')
                .select('title')
                .eq('id', schedule.show_id)
                .single()

              if (show) {
                eventName = show.title
              }
            }
          }
        }

        return {
          id: booking.id,
          customer: booking.customer_name || 'Guest',
          event: eventName,
          date: new Date(booking.created_at).toLocaleDateString('vi-VN'),
          amount: booking.total_amount || 0,
          status: booking.status
        }
      })
    )

    return activitiesWithDetails
  } catch (error) {
    console.error('Error fetching recent activities:', error)
    throw error
  }
}

/**
 * Get revenue data for chart (last 6 months)
 */
export const getRevenueData = async (months = 6) => {
  try {
    const monthsData = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())

      if (error) throw error

      const revenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0

      monthsData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        revenue: revenue
      })
    }

    return monthsData
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    throw error
  }
}

/**
 * Get user statistics by role
 */
export const getUserStatsByRole = async () => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('role')

    if (error) throw error

    const stats = {
      admin: 0,
      theater: 0,
      user: 0
    }

    users?.forEach(user => {
      if (stats.hasOwnProperty(user.role)) {
        stats[user.role]++
      }
    })

    return stats
  } catch (error) {
    console.error('Error fetching user stats by role:', error)
    throw error
  }
}

/**
 * Get theater statistics
 */
export const getTheaterStats = async () => {
  try {
    const { data: theaters, error } = await supabase
      .from('theaters')
      .select('status')

    if (error) throw error

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0
    }

    theaters?.forEach(theater => {
      if (stats.hasOwnProperty(theater.status)) {
        stats[theater.status]++
      }
    })

    return stats
  } catch (error) {
    console.error('Error fetching theater stats:', error)
    throw error
  }
}

/**
 * Get booking statistics
 */
export const getBookingStats = async () => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('status, total_amount')

    if (error) throw error

    const stats = {
      pending: { count: 0, amount: 0 },
      confirmed: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 }
    }

    bookings?.forEach(booking => {
      if (stats.hasOwnProperty(booking.status)) {
        stats[booking.status].count++
        stats[booking.status].amount += booking.total_amount || 0
      }
    })

    return stats
  } catch (error) {
    console.error('Error fetching booking stats:', error)
    throw error
  }
}
