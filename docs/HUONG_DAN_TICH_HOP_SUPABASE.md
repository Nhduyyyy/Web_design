# Hướng dẫn tích hợp Supabase vào Frontend

## Bước 1: Cài đặt Dependencies

```bash
npm install @supabase/supabase-js
```

## Bước 2: Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Bước 3: Setup Supabase Project

### 3.1. Tạo Project trên Supabase

1. Truy cập https://app.supabase.com
2. Tạo project mới
3. Copy Project URL và Anon Key vào `.env.local`

### 3.2. Chạy Schema

1. Vào **SQL Editor** trong Supabase Dashboard
2. Copy nội dung file `supabase/schema.sql`
3. Paste và Run
4. Kiểm tra không có lỗi

### 3.3. Chạy Seed Data (Optional)

1. Copy nội dung file `supabase/seed.sql`
2. Paste vào SQL Editor và Run

### 3.4. Cấu hình Storage Buckets

Tạo các buckets sau trong **Storage**:

- `avatars` - Avatar người dùng
- `theater-images` - Ảnh nhà hát
- `show-images` - Ảnh vở diễn
- `mask-images` - Ảnh mặt nạ
- `user-photos` - Ảnh chụp của user
- `livestream-thumbnails` - Thumbnail livestream

Cấu hình policies cho mỗi bucket (xem file `supabase/README.md`)

## Bước 4: Tích hợp vào React App

### 4.1. Wrap App với Auth Provider

Tạo file `src/contexts/AuthContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { onAuthStateChange } from '../services/authService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    setProfile(data)
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isTheater: profile?.role === 'theater',
    isUser: profile?.role === 'user'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
```

### 4.2. Update main.jsx

```jsx
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

### 4.3. Tạo Protected Routes

Tạo file `src/components/ProtectedRoute.jsx`:

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = ({ children, requireRole }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requireRole && profile?.role !== requireRole) {
    return <Navigate to="/" />
  }

  return children
}
```

## Bước 5: Tích hợp các chức năng

### 5.1. Authentication

#### Login Component

```jsx
import { useState } from 'react'
import { signIn } from '../services/authService'
import { useNavigate } from 'react-router-dom'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await signIn({ email, password })
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  )
}
```

#### Signup Component

```jsx
import { useState } from 'react'
import { signUp } from '../services/authService'
import { useNavigate } from 'react-router-dom'

export const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'user' // or 'theater'
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    try {
      await signUp(formData)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSignup}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      <input
        type="text"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        placeholder="Full Name"
        required
      />
      <input
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="Phone"
        required
      />
      <select
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
      >
        <option value="user">User</option>
        <option value="theater">Theater Owner</option>
      </select>
      {error && <p className="error">{error}</p>}
      <button type="submit">Sign Up</button>
    </form>
  )
}
```

### 5.2. Lịch diễn (Schedule)

#### Update Schedule Component

```jsx
import { useEffect, useState } from 'react'
import { getSchedules } from '../services/scheduleService'

export const Schedule = () => {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      const data = await getSchedules()
      setSchedules(data)
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="schedules">
      {schedules.map(schedule => (
        <div key={schedule.id} className="schedule-card">
          <h3>{schedule.title}</h3>
          <p>{schedule.show?.title}</p>
          <p>{schedule.venue?.name}</p>
          <p>{new Date(schedule.start_datetime).toLocaleString('vi-VN')}</p>
          <button onClick={() => handleBooking(schedule.id)}>
            Đặt vé
          </button>
        </div>
      ))}
    </div>
  )
}
```

### 5.3. Đặt vé (Booking)

#### Booking Flow Component

```jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getScheduleById, getSeatsBySchedule, reserveSeats } from '../services/scheduleService'
import { completeBookingFlow } from '../services/bookingService'
import { useAuth } from '../contexts/AuthContext'

export const BookingFlow = () => {
  const { scheduleId } = useParams()
  const { user } = useAuth()
  const [schedule, setSchedule] = useState(null)
  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [step, setStep] = useState(1) // 1: select seats, 2: info, 3: payment, 4: confirmation

  useEffect(() => {
    loadScheduleAndSeats()
  }, [scheduleId])

  const loadScheduleAndSeats = async () => {
    const scheduleData = await getScheduleById(scheduleId)
    const seatsData = await getSeatsBySchedule(scheduleId)
    setSchedule(scheduleData)
    setSeats(seatsData)
  }

  const handleSeatSelect = (seat) => {
    if (seat.status !== 'available') return
    
    if (selectedSeats.find(s => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id))
    } else {
      setSelectedSeats([...selectedSeats, seat])
    }
  }

  const handleReserve = async () => {
    const seatIds = selectedSeats.map(s => s.id)
    await reserveSeats(seatIds, user.id, 10) // Reserve for 10 minutes
    setStep(2)
  }

  const handleComplete = async (customerInfo, paymentMethod) => {
    try {
      const result = await completeBookingFlow({
        userId: user.id,
        scheduleId,
        seatIds: selectedSeats.map(s => s.id),
        customerInfo,
        paymentMethod
      })

      if (result.success) {
        setStep(4)
      }
    } catch (error) {
      console.error('Booking error:', error)
    }
  }

  // Render based on step...
  return (
    <div className="booking-flow">
      {/* Step 1: Seat Selection */}
      {/* Step 2: Customer Info */}
      {/* Step 3: Payment */}
      {/* Step 4: Confirmation */}
    </div>
  )
}
```

### 5.4. Livestream

#### Livestream Component

```jsx
import { useEffect, useState } from 'react'
import { getLiveStreams, subscribeLivestreamUpdates } from '../services/livestreamService'

export const LiveStream = () => {
  const [liveStreams, setLiveStreams] = useState([])

  useEffect(() => {
    loadLiveStreams()
  }, [])

  const loadLiveStreams = async () => {
    const data = await getLiveStreams()
    setLiveStreams(data)

    // Subscribe to real-time updates
    data.forEach(stream => {
      subscribeLivestreamUpdates(stream.id, (payload) => {
        setLiveStreams(prev => 
          prev.map(s => s.id === payload.new.id ? payload.new : s)
        )
      })
    })
  }

  return (
    <div className="livestreams">
      {liveStreams.map(stream => (
        <div key={stream.id} className="stream-card">
          <h3>{stream.title}</h3>
          <p>👁️ {stream.current_viewers} viewers</p>
          <video src={stream.stream_url} controls />
        </div>
      ))}
    </div>
  )
}
```

### 5.5. Events

#### Events Component

```jsx
import { useEffect, useState } from 'react'
import { getEvents, completeEventRegistrationFlow } from '../services/eventService'
import { useAuth } from '../contexts/AuthContext'

export const Events = () => {
  const [events, setEvents] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    const data = await getEvents()
    setEvents(data)
  }

  const handleRegister = async (eventId) => {
    try {
      const result = await completeEventRegistrationFlow({
        userId: user.id,
        eventId,
        participantInfo: {
          name: user.user_metadata.full_name,
          email: user.email,
          phone: user.user_metadata.phone
        },
        paymentMethod: 'card'
      })

      if (result.success) {
        alert('Đăng ký thành công!')
        loadEvents()
      }
    } catch (error) {
      console.error('Registration error:', error)
    }
  }

  return (
    <div className="events">
      {events.map(event => (
        <div key={event.id} className="event-card">
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          <p>Giá: {event.price.toLocaleString('vi-VN')} VND</p>
          <p>Còn: {event.max_participants - event.current_participants} chỗ</p>
          <button 
            onClick={() => handleRegister(event.id)}
            disabled={event.current_participants >= event.max_participants}
          >
            Đăng ký
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Bước 6: Theater Dashboard

### Theater Dashboard Component

```jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getTheatersByOwner } from '../services/theaterService'
import { getSchedulesByTheater } from '../services/scheduleService'
import { getEventsByTheater } from '../services/eventService'

export const TheaterDashboard = () => {
  const { user } = useAuth()
  const [theaters, setTheaters] = useState([])
  const [schedules, setSchedules] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const theatersData = await getTheatersByOwner(user.id)
    setTheaters(theatersData)

    if (theatersData.length > 0) {
      const schedulesData = await getSchedulesByTheater(theatersData[0].id)
      const eventsData = await getEventsByTheater(theatersData[0].id)
      setSchedules(schedulesData)
      setEvents(eventsData)
    }
  }

  return (
    <div className="theater-dashboard">
      <h1>Theater Dashboard</h1>
      
      <section>
        <h2>My Theaters</h2>
        {/* List theaters */}
      </section>

      <section>
        <h2>Schedules</h2>
        {/* List schedules */}
      </section>

      <section>
        <h2>Events</h2>
        {/* List events */}
      </section>
    </div>
  )
}
```

## Bước 7: Admin Dashboard

### Admin Dashboard Component

```jsx
import { useEffect, useState } from 'react'
import { getPendingTheaters, approveTheater, rejectTheater } from '../services/theaterService'

export const AdminDashboard = () => {
  const [pendingTheaters, setPendingTheaters] = useState([])

  useEffect(() => {
    loadPendingTheaters()
  }, [])

  const loadPendingTheaters = async () => {
    const data = await getPendingTheaters()
    setPendingTheaters(data)
  }

  const handleApprove = async (theaterId, adminId) => {
    await approveTheater(theaterId, adminId)
    loadPendingTheaters()
  }

  const handleReject = async (theaterId) => {
    await rejectTheater(theaterId)
    loadPendingTheaters()
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <section>
        <h2>Pending Theaters</h2>
        {pendingTheaters.map(theater => (
          <div key={theater.id} className="theater-card">
            <h3>{theater.name}</h3>
            <p>{theater.address}</p>
            <button onClick={() => handleApprove(theater.id, user.id)}>
              Approve
            </button>
            <button onClick={() => handleReject(theater.id)}>
              Reject
            </button>
          </div>
        ))}
      </section>
    </div>
  )
}
```

## Bước 8: Testing

### Test Authentication

```bash
# Tạo user đầu tiên (sẽ tự động là admin)
# Đăng ký qua UI hoặc:
```

```javascript
import { signUp } from './services/authService'

await signUp({
  email: 'admin@example.com',
  password: 'password123',
  fullName: 'Admin User',
  phone: '0123456789',
  role: 'admin'
})
```

### Test Theater Creation

```javascript
import { createTheater } from './services/theaterService'

await createTheater({
  name: 'Nhà hát Lớn Hà Nội',
  description: 'Nhà hát lớn nhất Hà Nội',
  address: '1 Tràng Tiền, Hoàn Kiếm',
  city: 'Hà Nội',
  phone: '024-xxx-xxxx',
  email: 'contact@theater.vn',
  capacity: 500
})
```

## Troubleshooting

### Issue: CORS errors

**Solution**: Kiểm tra Supabase project settings → API → CORS allowed origins

### Issue: RLS blocking queries

**Solution**: Kiểm tra policies trong `supabase/schema.sql` và đảm bảo user đã authenticated

### Issue: Storage upload fails

**Solution**: Kiểm tra storage policies và bucket permissions

## Next Steps

1. ✅ Setup Supabase project
2. ✅ Tích hợp authentication
3. ✅ Implement booking flow
4. ✅ Implement livestream
5. ✅ Implement events
6. ✅ Create theater dashboard
7. ✅ Create admin dashboard
8. 🔲 Add real-time features
9. 🔲 Add notifications
10. 🔲 Deploy to production

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [React + Supabase Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
