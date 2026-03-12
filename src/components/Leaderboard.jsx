import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getLeaderboard, getUserRank, getPlayerStats } from '../services/gameService'
import './WhackAMaskIntro.css'

const Leaderboard = () => {
  const { user, profile } = useAuth()
  const [leaderboardData, setLeaderboardData] = useState([])
  const [currentUserRank, setCurrentUserRank] = useState(null)
  const [currentUserStats, setCurrentUserStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboardData()
  }, [user])

  const loadLeaderboardData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading leaderboard data...')

      // Lấy top 10 players
      const { data: topPlayers, error: leaderboardError } = await getLeaderboard(10)
      
      console.log('📊 Leaderboard response:', { topPlayers, leaderboardError })
      
      if (leaderboardError) {
        console.error('❌ Leaderboard error:', leaderboardError)
        throw leaderboardError
      }

      // Format data cho UI
      const formattedData = topPlayers?.map(player => ({
        rank: Number(player.rank),
        name: player.full_name || player.email?.split('@')[0] || 'Người Chơi',
        score: player.total_coins,
        avatar: player.avatar_url || '/masks/quan_công-removebg-preview.png',
        title: player.rank_name
      })) || []

      console.log('✅ Formatted leaderboard data:', formattedData)
      setLeaderboardData(formattedData)

      // Nếu user đã đăng nhập, lấy rank và stats của họ
      if (user) {
        console.log('👤 Loading user rank for:', user.id)
        
        const [rankResult, statsResult] = await Promise.all([
          getUserRank(user.id),
          getPlayerStats(user.id)
        ])

        console.log('📈 User rank result:', rankResult)
        console.log('📊 User stats result:', statsResult)

        if (rankResult.data) {
          setCurrentUserRank({
            rank: Number(rankResult.data.user_rank) || 0,
            name: profile?.full_name || profile?.email?.split('@')[0] || 'Bạn',
            score: statsResult.data?.total_coins || 0
          })
        }

        if (statsResult.data) {
          setCurrentUserStats(statsResult.data)
        }
      }
    } catch (error) {
      console.error('❌ Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayData = leaderboardData
  const currentUser = currentUserRank || { rank: 0, name: 'Bạn', score: 0 }

  return (
    <div className="leaderboard-container">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#d4af37' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem' }}>hourglass_empty</span>
          <p>Đang tải bảng xếp hạng...</p>
        </div>
      ) : displayData.length === 0 ? (
        <>
          <div className="leaderboard-hero">
            <div className="leaderboard-hero-overlay"></div>
            <span className="leaderboard-subtitle">Triều Đình Hoàng Gia</span>
            <h1 className="leaderboard-title">Đại Sảnh Danh Vọng</h1>
            <div className="leaderboard-divider"></div>
          </div>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>emoji_events</span>
            <p style={{ fontSize: '1.2rem' }}>Chưa có người chơi nào</p>
            <p>Hãy là người đầu tiên chinh phục bảng xếp hạng!</p>
          </div>
        </>
      ) : (
        <>
          {/* Hero Section / Title */}
          <div className="leaderboard-hero">
            <div className="leaderboard-hero-overlay"></div>
            <span className="leaderboard-subtitle">Triều Đình Hoàng Gia</span>
            <h1 className="leaderboard-title">Đại Sảnh Danh Vọng</h1>
            <div className="leaderboard-divider"></div>
          </div>

      {/* Podium Section (Top 3) */}
      <div className="leaderboard-podium">
        {/* 2nd Place */}
        <div className="podium-item podium-second">
          <div className="podium-avatar-container">
            <div className="podium-avatar silver-border">
              <img 
                src={displayData[1]?.avatar || '/masks/triệu_văn_hoán-removebg-preview.png'} 
                alt="Silver medalist" 
                onError={(e) => e.target.src = '/masks/quan_công-removebg-preview.png'}
              />
            </div>
            <div className="podium-badge silver-badge">BẠC</div>
          </div>
          <div className="podium-info silver-info">
            <p className="podium-name">{displayData[1]?.name || 'Người Chơi 2'}</p>
            <p className="podium-score">{(displayData[1]?.score || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* 1st Place */}
        <div className="podium-item podium-first">
          <div className="podium-avatar-container">
            <div className="podium-crown">
              <span className="material-symbols-outlined">crown</span>
            </div>
            <div className="podium-avatar gold-border">
              <img 
                src={displayData[0]?.avatar || '/masks/quan_công-removebg-preview.png'} 
                alt="Gold medalist" 
                onError={(e) => e.target.src = '/masks/quan_công-removebg-preview.png'}
              />
            </div>
            <div className="podium-badge gold-badge">VÔ ĐỊCH</div>
          </div>
          <div className="podium-info gold-info">
            <p className="podium-title">{displayData[0]?.title || 'Vô Địch'}</p>
            <p className="podium-name">{displayData[0]?.name || 'Người Chơi 1'}</p>
            <p className="podium-score">{(displayData[0]?.score || 0).toLocaleString()} điểm</p>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="podium-item podium-third">
          <div className="podium-avatar-container">
            <div className="podium-avatar bronze-border">
              <img 
                src={displayData[2]?.avatar || '/masks/lưu_bị-removebg-preview.png'} 
                alt="Bronze medalist" 
                onError={(e) => e.target.src = '/masks/quan_công-removebg-preview.png'}
              />
            </div>
            <div className="podium-badge bronze-badge">ĐỒNG</div>
          </div>
          <div className="podium-info bronze-info">
            <p className="podium-name">{displayData[2]?.name || 'Người Chơi 3'}</p>
            <p className="podium-score">{(displayData[2]?.score || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Current User Rank */}
      {user && currentUser.rank > 0 && (
        <div className="current-user-rank">
          <div className="current-user-overlay"></div>
          <div className="current-user-info">
            <div className="current-user-left">
              <div className="current-user-rank-number">#{currentUser.rank}</div>
              <div className="current-user-avatar">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div className="current-user-details">
                <p className="current-user-label">Hạng Của Bạn</p>
                <p className="current-user-name">{currentUser.name}</p>
              </div>
            </div>
            <div className="current-user-right">
              <p className="current-user-score">{currentUser.score.toLocaleString()}</p>
              <p className="current-user-score-label">Điểm Cao Nhất</p>
            </div>
          </div>
        </div>
      )}

      {/* List of Top Players (4-10) */}
      {displayData.length > 3 && (
        <div className="leaderboard-list">
          <div className="leaderboard-list-header">
            <h3>Danh Sách Cao Thủ</h3>
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div className="leaderboard-rows">
            {displayData.slice(3).map((player) => (
              <div key={player.rank} className="leaderboard-row">
                <div className="leaderboard-row-left">
                  <span className="leaderboard-row-rank">{player.rank}</span>
                  <div className="leaderboard-row-avatar">
                    <img 
                      src={player.avatar} 
                      alt={`Rank ${player.rank} player`}
                      onError={(e) => e.target.src = '/masks/quan_công-removebg-preview.png'}
                    />
                  </div>
                  <span className="leaderboard-row-name">{player.name}</span>
                </div>
                <span className="leaderboard-row-score">{player.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

export default Leaderboard