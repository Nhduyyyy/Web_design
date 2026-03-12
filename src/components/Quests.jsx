import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  getAllQuestData, 
  claimDailyLoginReward, 
  claimQuestReward,
  claimMilestoneReward,
  initializeQuestSystem,
  updateDailyLoginStreak
} from '../services/questService'
import './Quests.css'

const Quests = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [streakData, setStreakData] = useState(null)
  const [quests, setQuests] = useState([])
  const [milestones, setMilestones] = useState([])
  const [dailyRewards, setDailyRewards] = useState([])
  const [error, setError] = useState(null)

  // Load dữ liệu khi component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadQuestData()
    }
  }, [isAuthenticated, user])

  const loadQuestData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Khởi tạo quest system nếu cần
      await initializeQuestSystem(user.id)

      // Cập nhật daily login streak
      await updateDailyLoginStreak(user.id)

      // Lấy tất cả dữ liệu
      const result = await getAllQuestData(user.id)

      if (result.error) {
        throw result.error
      }

      // Set streak data
      setStreakData(result.streak)

      // Set quests data
      const questsData = result.quests.map(pq => ({
        id: pq.id,
        title: pq.quest_template.title,
        description: pq.quest_template.description,
        icon: pq.quest_template.icon,
        progress: pq.current_progress,
        target: pq.target_value,
        reward: {
          type: pq.quest_template.reward_type,
          amount: pq.quest_template.reward_amount
        },
        completed: pq.is_completed,
        claimed: pq.is_claimed
      }))
      setQuests(questsData)

      // Set milestones data
      const milestonesData = result.milestones.map(pm => ({
        id: pm.id,
        title: pm.milestone_template.title,
        description: pm.milestone_template.description,
        category: pm.milestone_template.category,
        progress: pm.current_progress,
        target: pm.target_value,
        progressLabel: `${pm.current_progress} / ${pm.target_value}`,
        rewards: pm.milestone_template.icon_rewards || [],
        rewardText: pm.milestone_template.reward_description,
        completed: pm.is_completed,
        claimed: pm.is_claimed
      }))
      setMilestones(milestonesData)

      // Set daily rewards với claimed status
      const claimedDays = result.streak?.streak_rewards_claimed || []
      const currentStreak = result.streak?.current_streak || 0
      
      const rewardsData = result.rewardConfig.map(config => ({
        day: config.day_number,
        reward: `+${config.reward_amount} Coin`,
        icon: config.icon,
        claimed: claimedDays.includes(config.day_number),
        current: config.day_number === currentStreak && !claimedDays.includes(config.day_number),
        grand: config.is_grand_prize
      }))
      setDailyRewards(rewardsData)

    } catch (err) {
      console.error('Error loading quest data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimQuest = async (questId) => {
    if (claiming) return

    try {
      setClaiming(true)
      const result = await claimQuestReward(user.id, questId)

      if (result.error) {
        throw result.error
      }

      // Hiển thị thông báo thành công
      alert(`Nhận được ${result.data.reward_amount} coin!`)

      // Reload dữ liệu
      await loadQuestData()
    } catch (err) {
      console.error('Error claiming quest:', err)
      alert('Lỗi khi nhận thưởng: ' + err.message)
    } finally {
      setClaiming(false)
    }
  }

  const handleClaimDailyReward = async (day) => {
    if (claiming) return

    try {
      setClaiming(true)
      const result = await claimDailyLoginReward(user.id, day)

      if (result.error) {
        throw result.error
      }

      if (!result.data.success) {
        throw new Error(result.data.error || 'Không thể nhận thưởng')
      }

      // Hiển thị thông báo thành công
      alert(`Nhận được ${result.data.reward_amount} coin!`)

      // Reload dữ liệu
      await loadQuestData()
    } catch (err) {
      console.error('Error claiming daily reward:', err)
      alert('Lỗi khi nhận thưởng: ' + err.message)
    } finally {
      setClaiming(false)
    }
  }

  const handleClaimMilestone = async (milestoneId) => {
    if (claiming) return

    try {
      setClaiming(true)
      const result = await claimMilestoneReward(user.id, milestoneId)

      if (result.error) {
        throw result.error
      }

      // Hiển thị thông báo thành công
      alert(`Nhận được ${result.data.reward_amount} coin!`)

      // Reload dữ liệu
      await loadQuestData()
    } catch (err) {
      console.error('Error claiming milestone:', err)
      alert('Lỗi khi nhận thưởng: ' + err.message)
    } finally {
      setClaiming(false)
    }
  }

  const getProgressPercentage = (progress, target) => {
    return Math.min((progress / target) * 100, 100)
  }

  if (!isAuthenticated) {
    return (
      <div className="quests-container">
        <div className="quests-hero">
          <div className="quests-hero-content">
            <h1 className="quests-hero-title">Vui lòng đăng nhập</h1>
            <p className="quests-hero-description">
              Bạn cần đăng nhập để xem và hoàn thành nhiệm vụ.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="quests-container">
        <div className="quests-hero">
          <div className="quests-hero-content">
            <h1 className="quests-hero-title">Đang tải...</h1>
            <p className="quests-hero-description">Vui lòng đợi trong giây lát.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="quests-container">
        <div className="quests-hero">
          <div className="quests-hero-content">
            <h1 className="quests-hero-title">Có lỗi xảy ra</h1>
            <p className="quests-hero-description">{error}</p>
            <button onClick={loadQuestData} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quests-container">
      {/* Hero Header Section */}
      <div className="quests-hero">
        <div className="quests-hero-bg"></div>
        <div className="quests-hero-content">
          <div>
            <h1 className="quests-hero-title">Nhiệm Vụ Sân Khấu Lớn</h1>
            <p className="quests-hero-description">
              Rèn luyện kỹ năng nghệ thuật Tuồng của bạn. Hoàn thành nhiệm vụ hàng ngày để nhận coin và phần thưởng đặc biệt.
            </p>
            {streakData && (
              <p className="quests-hero-description" style={{ marginTop: '0.5rem', color: '#D4AF37' }}>
                🔥 Chuỗi đăng nhập: {streakData.current_streak} ngày | Kỷ lục: {streakData.longest_streak} ngày
              </p>
            )}
          </div>
          <div className="quests-season-timer">
            <p className="quests-season-label">Mùa Kết Thúc Sau</p>
            <p className="quests-season-time">12 ngày : 04 giờ : 15 phút</p>
          </div>
        </div>
      </div>

      {/* 7-Day Daily Rewards */}
      <section className="quests-section">
        <div className="quests-section-header">
          <span className="material-symbols-outlined quests-section-icon">stars</span>
          <h2 className="quests-section-title">Chuỗi Đăng Nhập Hàng Ngày</h2>
        </div>
        
        <div className="quests-daily-grid">
          {dailyRewards.map((reward) => (
            <div 
              key={reward.day}
              className={`quests-daily-card ${
                reward.claimed ? 'claimed' : ''
              } ${reward.current ? 'current' : ''} ${reward.grand ? 'grand' : ''}`}
            >
              {reward.current && (
                <div className="quests-daily-badge">HIỆN TẠI</div>
              )}
              
              <span className="quests-daily-day">Ngày {reward.day}</span>
              
              <div className={`quests-daily-icon ${reward.grand ? 'grand-icon' : ''}`}>
                <span className={`material-symbols-outlined ${reward.grand ? 'fill-1' : ''}`}>
                  {reward.icon}
                </span>
              </div>
              
              <span className={`quests-daily-reward ${reward.grand ? 'grand-text' : ''}`}>
                {reward.reward}
              </span>
              
              {reward.claimed && (
                <span className="material-symbols-outlined quests-daily-check">check_circle</span>
              )}
              
              {reward.current && !reward.claimed && (
                <button 
                  className="quests-daily-claim-btn"
                  onClick={() => handleClaimDailyReward(reward.day)}
                  disabled={claiming}
                >
                  {claiming ? 'ĐANG XỬ LÝ...' : 'NHẬN'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="quests-main-grid">
        {/* Daily Quests List */}
        <div className="quests-list-section">
          <div className="quests-list-header">
            <div className="quests-list-title-wrapper">
              <span className="material-symbols-outlined">assignment</span>
              <h2 className="quests-section-title">Nhiệm Vụ Hàng Ngày</h2>
            </div>
            <span className="quests-reset-time">Làm mới sau 8 giờ 45 phút</span>
          </div>

          <div className="quests-list">
            {quests.map((quest) => (
              <div key={quest.id} className="quest-card">
                <div className="quest-card-header">
                  <div className="quest-card-info">
                    <div className="quest-icon">
                      <span className="material-symbols-outlined">{quest.icon}</span>
                    </div>
                    <div>
                      <h3 className="quest-title">{quest.title}</h3>
                      <p className="quest-description">{quest.description}</p>
                    </div>
                  </div>
                  
                  <div className="quest-reward">
                    <span className="quest-reward-label">PHẦN THƯỞNG</span>
                    <div className="quest-reward-value">
                      <span className="material-symbols-outlined">toll</span>
                      <span>{quest.reward.amount} Coin</span>
                    </div>
                  </div>
                </div>

                <div className="quest-progress-section">
                  <div className="quest-progress-bar-wrapper">
                    <div 
                      className="quest-progress-bar"
                      style={{ width: `${getProgressPercentage(quest.progress, quest.target)}%` }}
                    ></div>
                  </div>
                  
                  <span className="quest-progress-text">
                    {quest.progress.toLocaleString()} / {quest.target.toLocaleString()}
                  </span>
                  
                  {quest.completed && !quest.claimed ? (
                    <button 
                      className="quest-claim-btn"
                      onClick={() => handleClaimQuest(quest.id)}
                      disabled={claiming}
                    >
                      {claiming ? 'ĐANG XỬ LÝ...' : 'NHẬN'}
                    </button>
                  ) : quest.claimed ? (
                    <button className="quest-locked-btn" disabled>
                      ĐÃ NHẬN
                    </button>
                  ) : (
                    <button className="quest-locked-btn" disabled>
                      KHÓA
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones Section */}
        <div className="quests-milestones-section">
          <div className="quests-section-header">
            <span className="material-symbols-outlined quests-section-icon">emoji_events</span>
            <h2 className="quests-section-title">Cột Mốc</h2>
          </div>

          <div className="quests-milestones-list">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="milestone-card">
                <h4 className="milestone-category">{milestone.category}</h4>
                <h3 className="milestone-title">{milestone.title}</h3>
                <p className="milestone-description">{milestone.description}</p>
                
                <div className="milestone-progress-header">
                  <span>Tiến Độ</span>
                  <span className="milestone-progress-label">{milestone.progressLabel}</span>
                </div>
                
                <div className="milestone-progress-bar-wrapper">
                  <div 
                    className="milestone-progress-bar"
                    style={{ width: `${getProgressPercentage(milestone.progress, milestone.target)}%` }}
                  ></div>
                </div>

                {milestone.rewards && (
                  <div className="milestone-rewards">
                    <div className="milestone-reward-icons">
                      {milestone.rewards.map((icon, idx) => (
                        <div key={idx} className="milestone-reward-icon">
                          <span className="material-symbols-outlined">{icon}</span>
                        </div>
                      ))}
                    </div>
                    <span className="milestone-reward-text">{milestone.rewardText}</span>
                  </div>
                )}

                {milestone.completed && !milestone.claimed && (
                  <button 
                    className="quest-claim-btn"
                    style={{ marginTop: '1rem', width: '100%' }}
                    onClick={() => handleClaimMilestone(milestone.id)}
                    disabled={claiming}
                  >
                    {claiming ? 'ĐANG XỬ LÝ...' : 'NHẬN THƯỞNG'}
                  </button>
                )}

                {milestone.claimed && (
                  <button 
                    className="quest-locked-btn"
                    style={{ marginTop: '1rem', width: '100%' }}
                    disabled
                  >
                    ĐÃ NHẬN
                  </button>
                )}
              </div>
            ))}

            {/* Decorative Quote */}
            <div className="milestone-quote-card">
              <span className="material-symbols-outlined milestone-quote-icon">light</span>
              <p className="milestone-quote-title">Trí Tuệ Xưa</p>
              <p className="milestone-quote-text">
                "Sự tinh thông mặt nạ không đến từ tốc độ, mà từ nhịp điệu của tâm hồn."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quests
