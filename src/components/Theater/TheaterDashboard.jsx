import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import TheaterProfile from './TheaterProfile'
import TheaterOverview from './TheaterOverview'
import VenueList from './VenueList'
import TheaterStats from './TheaterStats'
import RecentActivity from './RecentActivity'
import TheaterHeader from './TheaterHeader'
import { getTheatersByOwner, getVenuesByTheater, createTheater } from '../../services/theaterService'
import { getMyOrganizations } from '../../services/organizationService'
import './TheaterDashboard.css'

const TheaterDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [theater, setTheater] = useState(null)
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [isCreatingTheater, setIsCreatingTheater] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // overview, venues, activity

  // Set dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.body.style.backgroundColor = '#121212'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  useEffect(() => {
    loadTheaterData()
  }, [user])

  const loadTheaterData = async () => {
    try {
      setLoading(true)
      
      // Get theater owned by current user
      const theaters = await getTheatersByOwner(user.id)
      
      if (theaters && theaters.length > 0) {
        const theaterData = theaters[0] // Get first theater
        setTheater(theaterData)
        setOrganization(null) // Clear organization if theater exists
        
        // Load venues for this theater
        const venuesData = await getVenuesByTheater(theaterData.id)
        setVenues(venuesData || [])
      } else {
        // Check if user has organization registration
        try {
          const orgs = await getMyOrganizations()
          if (orgs && orgs.length > 0) {
            const org = orgs[0]
            setOrganization(org)
            
            // If organization is approved and not already creating theater
            if (org.status === 'approved' && !isCreatingTheater) {
              console.log('Organization approved, creating theater...')
              setIsCreatingTheater(true)
              
              try {
                const newTheater = await createTheater({
                  owner_id: user.id,
                  name: org.legal_name,
                  description: org.description || '',
                  address: org.address || '',
                  city: org.city || '',
                  phone: org.phone,
                  email: org.email,
                  website: org.website || '',
                  business_license: org.business_license_number || '',
                  tax_code: org.tax_code || '',
                  status: 'approved' // Already approved via organization
                })
                
                console.log('Theater created successfully:', newTheater)
                setTheater(newTheater)
                setOrganization(null) // Clear organization state
                
                // Reload venues
                const venuesData = await getVenuesByTheater(newTheater.id)
                setVenues(venuesData || [])
              } catch (createErr) {
                console.error('Error creating theater:', createErr)
                setError('Không thể tạo nhà hát. Vui lòng thử lại.')
              } finally {
                setIsCreatingTheater(false)
              }
            }
          }
        } catch (err) {
          console.log('No organization found or error:', err)
        }
      }
    } catch (err) {
      console.error('Error loading theater data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTheaterUpdate = (updatedTheater) => {
    setTheater(updatedTheater)
  }

  const handleVenueUpdate = () => {
    // Reload venues
    if (theater) {
      getVenuesByTheater(theater.id).then(setVenues)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải dữ liệu nhà hát...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Lỗi: {error}</p>
        </div>
      </div>
    )
  }

  if (!theater) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <TheaterHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md bg-surface-dark p-8 rounded-xl border border-border-gold">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">theater_comedy</span>
            
            {organization ? (
              // Has organization registration
              <>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Đơn đăng ký đang được xử lý</h2>
                <p className="text-slate-400 mb-4">
                  Đơn đăng ký nhà hát của bạn đang được xem xét.
                </p>
                <div className="mb-6 p-4 bg-background-dark rounded-lg border border-border-gold">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Tên tổ chức:</span>
                    <span className="text-sm text-slate-200 font-semibold">{organization.legal_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Trạng thái:</span>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      organization.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-400' :
                      organization.status === 'under_review' ? 'bg-blue-500/20 text-blue-400' :
                      organization.status === 'need_more_info' ? 'bg-orange-500/20 text-orange-400' :
                      organization.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      organization.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {organization.status === 'draft' && 'Nháp'}
                      {organization.status === 'submitted' && 'Chờ duyệt'}
                      {organization.status === 'under_review' && 'Đang xem xét'}
                      {organization.status === 'need_more_info' && 'Cần bổ sung'}
                      {organization.status === 'approved' && 'Đã duyệt'}
                      {organization.status === 'rejected' && 'Từ chối'}
                    </span>
                  </div>
                </div>
                {organization.status === 'approved' && (
                  <>
                    <p className="text-green-400 text-sm mb-4">
                      ✓ Đơn đăng ký đã được duyệt! Đang tạo nhà hát...
                    </p>
                    <button 
                      onClick={loadTheaterData}
                      className="px-6 py-3 gold-gradient text-background-dark font-bold rounded-lg hover:brightness-110 transition-all mb-4"
                    >
                      🔄 Tải lại trang
                    </button>
                  </>
                )}
                {organization.status === 'need_more_info' && (
                  <>
                    <p className="text-yellow-400 text-sm mb-4">
                      ⚠️ Admin yêu cầu bổ sung thông tin. Vui lòng cập nhật đơn đăng ký.
                    </p>
                    <button 
                      onClick={() => navigate('/organization/register')}
                      className="px-6 py-3 gold-gradient text-background-dark font-bold rounded-lg hover:brightness-110 transition-all"
                    >
                      Cập nhật đơn đăng ký
                    </button>
                  </>
                )}
                {organization.status === 'rejected' && organization.rejection_reason && (
                  <>
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm">
                        <strong>Lý do từ chối:</strong><br />
                        {organization.rejection_reason}
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/organization/register')}
                      className="px-6 py-3 gold-gradient text-background-dark font-bold rounded-lg hover:brightness-110 transition-all"
                    >
                      Đăng ký lại
                    </button>
                  </>
                )}
                {(organization.status === 'submitted' || organization.status === 'under_review') && (
                  <p className="text-slate-500 text-sm">
                    Chúng tôi sẽ xem xét trong vòng 1-3 ngày làm việc.
                  </p>
                )}
              </>
            ) : (
              // No organization registration
              <>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Chưa có Nhà hát</h2>
                <p className="text-slate-400 mb-6">
                  Bạn chưa đăng ký nhà hát. Đăng ký ngay để trở thành đối tác của chúng tôi.
                </p>
                <button 
                  onClick={() => navigate('/organization/register')}
                  className="px-6 py-3 gold-gradient text-background-dark font-bold rounded-lg hover:brightness-110 transition-all"
                >
                  Đăng ký Nhà hát
                </button>
                <div className="mt-6 text-left">
                  <p className="text-slate-500 text-sm mb-2">Quyền lợi khi đăng ký:</p>
                  <ul className="text-slate-400 text-sm space-y-1">
                    <li>✓ Tạo và quản lý địa điểm diễn</li>
                    <li>✓ Đăng lịch diễn và bán vé</li>
                    <li>✓ Livestream trực tiếp</li>
                    <li>✓ Tổ chức workshop và sự kiện</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <TheaterHeader theater={theater} />
      
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 max-w-[1600px] mx-auto w-full">
        {/* Left Sidebar */}
        <aside className="w-full md:w-1/3 lg:w-1/4 space-y-6">
          <TheaterProfile 
            theater={theater} 
            onUpdate={handleTheaterUpdate}
          />
          <TheaterStats 
            theater={theater}
            venueCount={venues.length}
          />
        </aside>

        {/* Main Content */}
        <section className="flex-1 space-y-6">
          {/* Tabs */}
          <div className="bg-surface-dark rounded-xl border border-border-gold overflow-hidden">
            <div className="flex border-b border-border-gold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-background-dark'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">dashboard</span>
                  Tổng quan
                </span>
              </button>
              <button
                onClick={() => setActiveTab('venues')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'venues'
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-background-dark'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">location_on</span>
                  Địa điểm ({venues.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'activity'
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-background-dark'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">history</span>
                  Hoạt động
                </span>
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && <TheaterOverview theater={theater} />}
              {activeTab === 'venues' && (
                <VenueList 
                  theater={theater}
                  venues={venues}
                  onUpdate={handleVenueUpdate}
                />
              )}
              {activeTab === 'activity' && <RecentActivity theaterId={theater.id} />}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-border-gold p-6 text-center bg-surface-dark">
        <p className="text-slate-500 text-sm">© 2024 Tuồng Platform Vietnam. All Rights Reserved.</p>
      </footer>
    </div>
  )
}

export default TheaterDashboard
