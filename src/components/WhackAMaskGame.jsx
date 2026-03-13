import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Phaser from 'phaser'
import Leaderboard from './Leaderboard'
import Shop from './Shop'
import Quests from './Quests'
import Inventory from './Inventory'
import TuongRainEffect from './TuongRainEffect'
import { getPlayerStats, saveGameResult, initializePlayerStats } from '../services/gameService'
import { updateQuestProgress } from '../services/questService'
import './WhackAMaskIntro.css'
import './WhackAMaskPhaser.css'

// Phaser Game Scene
class WhackAMaskScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WhackAMaskScene' })
    this.score = 0
    this.holes = []
    this.gameActive = false
    this.roundsLeft = 16
  }

  preload() {
    console.log('📦 Loading assets...')
    this.load.setPath('/game-assets/')
    this.load.image('background', 'background.png')
    this.load.image('hole', 'mole-hole-all.png')
    this.load.image('mask', 'mole.png')
    this.load.image('smash', 'smash.png')
    this.load.image('hammer', 'hammer.png')
    
    this.load.on('complete', () => {
      console.log('✅ Assets loaded successfully')
    })
    
    this.load.on('loaderror', (file) => {
      console.error('❌ Failed to load:', file.key, file.src)
    })
  }

  create() {
    console.log('🎨 Creating game scene...')
    
    const bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'background')
    bg.setDisplaySize(1200, 1000)
    bg.setDepth(-1)
    
    const gridSize = 3
    const spacing = 250
    const startX = this.cameras.main.centerX - spacing
    const startY = this.cameras.main.centerY - spacing + 120

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = startX + col * spacing
        const y = startY + row * spacing
        const hole = new MoleHole(this, x, y, this.holes.length)
        this.holes.push(hole)
      }
    }

    this.hammer = this.add.sprite(0, 0, 'hammer')
      .setScale(0.4)
      .setOrigin(0.3, 0.65)
      .setDepth(10)
      .setAlpha(1.0)
      .setAngle(-15)
    
    this.isHammering = false
    this.input.on('pointermove', (pointer) => {
      if (!this.isHammering) {
        this.hammer.setPosition(pointer.x, pointer.y)
      }
    })

    this.input.on('pointerdown', (pointer) => {
      let clickedOnMask = false
      for (const hole of this.holes) {
        if (hole.mask && hole.mask.getBounds().contains(pointer.x, pointer.y)) {
          clickedOnMask = true
          break
        }
      }
      
      if (!clickedOnMask) {
        this.hammerSmash(pointer.x, pointer.y)
      }
    })

    this.events.on('scoreUpdate', (newScore) => {
      this.score = newScore
      if (this.onScoreUpdate) {
        this.onScoreUpdate(newScore)
      }
    })
  }

  hammerSmash(x, y) {
    if (this.isHammering) return
    
    this.isHammering = true
    const smashY = y
    const smashDepth = 30

    this.tweens.add({
      targets: this.hammer,
      angle: -100,
      y: smashY + smashDepth,
      duration: 100,
      ease: 'Power3',
      onComplete: () => {
        this.tweens.add({
          targets: this.hammer,
          angle: -15,
          y: smashY - 20,
          duration: 120,
          ease: 'Power2',
          onComplete: () => {
            this.isHammering = false
          }
        })
      }
    })
  }

  startGame() {
    this.score = 0
    this.roundsLeft = 16
    this.gameActive = true
    
    if (this.onScoreUpdate) {
      this.onScoreUpdate(0)
    }

    this.cameras.main.shake(500, 0.01)

    this.time.delayedCall(500, () => {
      this.spawnMole()
    })
  }
  spawnMole() {
    if (!this.gameActive || this.roundsLeft <= 0) {
      this.endGame()
      return
    }

    let randomIndex
    do {
      randomIndex = Phaser.Math.Between(0, this.holes.length - 1)
    } while (this.lastHoleIndex === randomIndex)
    
    this.lastHoleIndex = randomIndex
    const hole = this.holes[randomIndex]
    
    hole.popup()
    this.roundsLeft--

    this.time.delayedCall(700, () => {
      this.spawnMole()
    })
  }

  endGame() {
    this.gameActive = false
    if (this.onGameOver) {
      this.onGameOver(this.score)
    }
  }

  addScore() {
    this.score++
    this.events.emit('scoreUpdate', this.score)
  }
}

// Mole Hole Class
class MoleHole {
  constructor(scene, x, y, index) {
    this.scene = scene
    this.x = x
    this.y = y
    this.index = index
    this.isActive = false
    this.isHit = false

    const hiddenY = y + 385

    this.holeBottom = scene.add.sprite(x, y, 'hole')
      .setScale(0.18)
      .setOrigin(0.5, 0.5)
      .setDepth(0)

    this.mask = scene.add.sprite(x, hiddenY, 'mask')
      .setScale(0.35)
      .setOrigin(0.5, 0.5)
      .setDepth(1)
      .setInteractive({ cursor: 'pointer' })

    const visibleHeight = y + 65
    const moleMaskShape = scene.make.graphics()
      .fillRect(0, 0, 1200, visibleHeight)
      .setVisible(false)
    
    const moleGeometryMask = moleMaskShape.createGeometryMask()
    this.mask.setMask(moleGeometryMask)

    this.holeTop = scene.add.sprite(x, y, 'hole')
      .setScale(0.18)
      .setOrigin(0.5, 0.5)
      .setDepth(2)

    const holeSize = this.holeBottom.displayWidth
    const topMaskShape = scene.make.graphics()
      .fillRect(x - holeSize/2, y + 20, holeSize, holeSize)
      .setVisible(false)
    
    const topGeometryMask = topMaskShape.createGeometryMask()
    this.holeTop.setMask(topGeometryMask)
    this.smashEffect = scene.add.sprite(x, y, 'smash')
      .setScale(0.10)
      .setOrigin(0.5, 0.5)
      .setDepth(3)
      .setVisible(false)

    this.mask.on('pointerdown', (pointer) => this.onHit(pointer))
    
    this.mask.on('pointerover', () => {
      if (this.isActive && !this.isHit) {
        this.mask.setTint(0xffcccc)
      }
    })
    
    this.mask.on('pointerout', () => {
      this.mask.clearTint()
    })
  }

  popup() {
    if (this.isActive) return
    
    this.isActive = true
    this.isHit = false
    this.mask.clearTint()

    const targetY = this.y - 25

    this.scene.tweens.add({
      targets: this.mask,
      y: targetY,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(800, () => {
          if (!this.isHit) {
            this.hide()
          }
        })
      }
    })
  }

  hide() {
    if (!this.isActive) return
    
    this.isActive = false
    const hiddenY = this.y + 385

    this.scene.tweens.add({
      targets: this.mask,
      y: hiddenY,
      duration: 300,
      ease: 'Cubic.easeIn'
    })
  }

  onHit(pointer) {
    if (!this.isActive || this.isHit) return
    
    this.isHit = true
    this.scene.addScore()

    this.scene.hammerSmash(pointer.x, pointer.y)
    this.scene.tweens.killTweensOf(this.mask)
    this.showSmashEffect()

    const hiddenY = this.y + 385
    this.scene.tweens.add({
      targets: this.mask,
      y: hiddenY,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.isActive = false
      }
    })

    this.scene.cameras.main.shake(100, 0.003)
  }
  showSmashEffect() {
    this.smashEffect.setVisible(true)
    this.smashEffect.setPosition(this.mask.x, this.mask.y + 15)
    this.smashEffect.setAlpha(1)
    this.smashEffect.setScale(0.25)
    
    this.scene.tweens.add({
      targets: this.smashEffect,
      scale: 0.38,
      duration: 100,
      ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(1000, () => {
          this.scene.tweens.add({
            targets: this.smashEffect,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
              this.smashEffect.setVisible(false)
            }
          })
        })
      }
    })
  }
}

// React Component
const WhackAMaskGame = () => {
  const { user, profile, isAuthenticated } = useAuth()
  const gameRef = useRef(null)
  const phaserGameRef = useRef(null)
  const gameStartTimeRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [score, setScore] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)
  const [currentRank, setCurrentRank] = useState('Newbie')
  const [gameOver, setGameOver] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load player stats khi component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadPlayerStats()
    }
  }, [isAuthenticated, user])

  const loadPlayerStats = async () => {
    try {
      // Khởi tạo stats nếu chưa có
      await initializePlayerStats(user.id)
      
      // Lấy stats hiện tại
      const { data, error } = await getPlayerStats(user.id)
      if (error) throw error

      if (data) {
        setTotalCoins(data.total_coins || 0)
        setCurrentRank(data.current_rank?.rank_name || 'Newbie')
      }
    } catch (error) {
      console.error('Error loading player stats:', error)
    }
  }

  // Get user display info
  const getUserDisplayInfo = () => {
    if (!isAuthenticated || !profile) {
      return {
        name: 'Guest Player',
        rank: 'Newbie',
        avatar: '/masks/quan_công-removebg-preview.png'
      }
    }

    return {
      name: profile.full_name || profile.email?.split('@')[0] || 'Player',
      rank: currentRank,
      avatar: profile.avatar_url || '/masks/bao_công__tuồng_nam_bộ_-removebg-preview.png'
    }
  }

  const userInfo = getUserDisplayInfo()

  useEffect(() => {
    if (!isPlaying || !gameRef.current || phaserGameRef.current) return

    const config = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 1200,
      height: 1000,
      backgroundColor: '#3a2828',
      scene: WhackAMaskScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    }

    const game = new Phaser.Game(config)
    phaserGameRef.current = game

    game.events.once('ready', () => {
      const scene = game.scene.scenes[0]
      
      scene.onScoreUpdate = (newScore) => {
        setScore(newScore)
      }

      scene.onGameOver = async (finalScore) => {
        setGameOver(true)
        setScore(finalScore)
        
        // Lưu kết quả game vào database
        if (isAuthenticated && user) {
          await handleSaveGameResult(finalScore)
        }
      }

      setTimeout(() => {
        if (scene) {
          scene.startGame()
        }
      }, 300)
    })

    return () => {
      if (game) {
        game.destroy(true)
      }
      phaserGameRef.current = null
    }
  }, [isPlaying])

  // Lưu kết quả game vào database
  const handleSaveGameResult = async (finalScore) => {
    try {
      setLoading(true)
      
      // Tính thời gian chơi
      const gameDuration = gameStartTimeRef.current 
        ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
        : null

      // Lưu kết quả (score = coins earned trong game này)
      const result = await saveGameResult({
        userId: user.id,
        score: finalScore,
        coinsEarned: finalScore, // Mỗi điểm = 1 coin
        masksHit: finalScore, // Số mặt nạ đập trúng = score
        totalRounds: 16,
        gameDurationSeconds: gameDuration
      })

      if (result.data) {
        // Cập nhật UI với dữ liệu mới
        setTotalCoins(result.data.total_coins)
        
        // Reload stats để cập nhật rank
        await loadPlayerStats()
        
        // Cập nhật quest progress
        // Quest 1: Chơi 5 ván game
        await updateQuestProgress(user.id, 'play_5_games', 1)
        
        // Quest 2: Đạt 10,000 điểm
        if (finalScore >= 10000) {
          await updateQuestProgress(user.id, 'score_10000', finalScore)
        }
        
        console.log('Game result saved:', result.data)
      }
    } catch (error) {
      console.error('Error saving game result:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePlayGame = () => {
    gameStartTimeRef.current = Date.now()
    setIsPlaying(true)
    setGameOver(false)
    setScore(0)
  }

  const handleViewScores = () => {
    setShowLeaderboard(true)
    setShowShop(false)
    setShowQuests(false)
    setShowInventory(false)
  }

  const handleViewShop = () => {
    setShowShop(true)
    setShowLeaderboard(false)
    setShowQuests(false)
    setShowInventory(false)
  }

  const handleViewQuests = () => {
    setShowQuests(true)
    setShowLeaderboard(false)
    setShowShop(false)
    setShowInventory(false)
  }

  const handleViewInventory = () => {
    setShowInventory(true)
    setShowLeaderboard(false)
    setShowShop(false)
    setShowQuests(false)
  }

  const handleBackToIntro = () => {
    setIsPlaying(false)
    setShowLeaderboard(false)
    setShowShop(false)
    setShowQuests(false)
    setShowInventory(false)
    setGameOver(false)
    setScore(0)
    
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true)
      phaserGameRef.current = null
    }
  }

  const handlePlayAgain = () => {
    setGameOver(false)
    
    // Destroy old game
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true)
      phaserGameRef.current = null
    }
    
    // Reset score và trigger useEffect để tạo game mới
    setScore(0)
    
    // Tạm thời set isPlaying = false rồi lại true để trigger useEffect
    setIsPlaying(false)
    setTimeout(() => {
      setIsPlaying(true)
    }, 100)
  }

  return (
    <div className="whack-intro-root">
      {/* Tuong Rain Effect Background */}
      <TuongRainEffect />
      
      <div className="whack-intro-container">
        <header className="whack-intro-header">
          <div className="whack-intro-logo">
            <span className="material-symbols-outlined">theater_comedy</span>
            <h2>Whack-a-Mask</h2>
          </div>
          <div className="whack-intro-nav-buttons">
            {/* Coin Display in Header */}
            <div className="whack-intro-coin-display-header">
              <div className="whack-intro-coin-left">
                <span className="material-symbols-outlined whack-intro-coin-icon">toll</span>
                <div className="whack-intro-coin-amount-wrapper">
                  <span className="whack-intro-coin-number">{totalCoins.toLocaleString()}</span>
                  <span className="whack-intro-coin-label">Coin</span>
                </div>
              </div>
              <button className="whack-intro-coin-add-btn" title="Mua thêm coins">
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            
            {isPlaying && (
              <button className="whack-intro-icon-btn" onClick={handleBackToIntro} title="Về trang chủ">
                <span className="material-symbols-outlined">home</span>
              </button>
            )}
            <button className="whack-intro-icon-btn" title="Cài đặt">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="whack-intro-icon-btn" title="Trợ giúp">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </header>

        <main className="whack-intro-main">
          <aside className="whack-intro-sidebar">
            <div className="whack-intro-profile">
              <div className="whack-intro-avatar-wrapper">
                <img
                  className="whack-intro-avatar"
                  src={userInfo.avatar}
                  alt={userInfo.name}
                  onError={(e) => {
                    e.target.src = '/masks/quan_công-removebg-preview.png'
                  }}
                />
              </div>
              <div className="whack-intro-profile-info">
                <h3>{userInfo.name}</h3>
                <p>Rank: {userInfo.rank}</p>
              </div>
            </div>
            
            <nav className="whack-intro-nav">
              <a className={`whack-intro-nav-link ${!isPlaying && !showLeaderboard && !showShop && !showQuests && !showInventory ? 'active' : ''}`} href="#" onClick={() => {setIsPlaying(false); setShowLeaderboard(false); setShowShop(false); setShowQuests(false); setShowInventory(false)}}>
                <span className="material-symbols-outlined">home</span>
                <span>Trang Chủ</span>
              </a>
              <a className={`whack-intro-nav-link ${showLeaderboard ? 'active' : ''}`} href="#" onClick={handleViewScores}>
                <span className="material-symbols-outlined">leaderboard</span>
                <span>Bảng Xếp Hạng</span>
              </a>
              <a className={`whack-intro-nav-link ${showShop ? 'active' : ''}`} href="#" onClick={handleViewShop}>
                <span className="material-symbols-outlined">shopping_cart</span>
                <span>Cửa Hàng</span>
              </a>
              <a className={`whack-intro-nav-link ${showQuests ? 'active' : ''}`} href="#" onClick={handleViewQuests}>
                <span className="material-symbols-outlined">task_alt</span>
                <span>Nhiệm Vụ</span>
              </a>
              <a className={`whack-intro-nav-link ${showInventory ? 'active' : ''}`} href="#" onClick={handleViewInventory}>
                <span className="material-symbols-outlined">inventory</span>
                <span>Kho Vật Phẩm</span>
              </a>
            </nav>

            <div className="whack-intro-reward-card">
              <div className="whack-intro-reward-header">
                <span className="material-symbols-outlined">auto_awesome</span>
                <span>Phần Thưởng Hàng Ngày</span>
              </div>
              <p className="whack-intro-reward-text">
                Nhận cuộn giấy hàng ngày để mở khóa mặt nạ hiếm.
              </p>
              <button type="button" className="whack-intro-reward-btn" onClick={handleViewQuests}>Nhận Thưởng</button>
            </div>
          </aside>

          <section className="whack-intro-game-area">
            <div className="whack-intro-curtains">
              <div className="whack-intro-curtain-left"></div>
              <div className="whack-intro-curtain-right"></div>
              <div className="whack-intro-curtain-top"></div>
            </div>

            <div className="whack-intro-lantern whack-intro-lantern-left">
              <span className="material-symbols-outlined">light</span>
            </div>
            <div className="whack-intro-lantern whack-intro-lantern-right">
              <span className="material-symbols-outlined">light</span>
            </div>

            {showLeaderboard ? (
              <Leaderboard />
            ) : showShop ? (
              <Shop />
            ) : showQuests ? (
              <Quests />
            ) : showInventory ? (
              <Inventory />
            ) : !isPlaying ? (
              <div className="whack-intro-content">
                <div className="whack-intro-hero-mask">
                  <div className="whack-intro-mask-glow"></div>
                  <div className="whack-intro-mask-container">
                    <img
                      src="/masks/quan_công-removebg-preview.png"
                      alt="Mặt nạ Tuồng truyền thống"
                      onError={(e) => {
                        e.target.src = '/masks/quan_công-removebg-preview.png'
                      }}
                    />
                  </div>
                </div>

                <h1 className="whack-intro-title">
                  WHACK-A-<span className="whack-intro-title-highlight">MASK</span>
                </h1>

                <p className="whack-intro-description">
                  Bước vào sân khấu hoành tráng của nghệ thuật Tuồng Việt Nam truyền thống. 
                  Thử thách phản xạ của bạn với những mặt nạ Tuồng đang xuất hiện!
                </p>
                <div className="whack-intro-buttons">
                  <button className="whack-intro-play-btn" onClick={handlePlayGame}>
                    <span className="material-symbols-outlined">play_arrow</span>
                    CHƠI NGAY
                    <div className="whack-intro-play-ping"></div>
                  </button>
                  <button className="whack-intro-scores-btn" onClick={handleViewScores}>
                    <span className="material-symbols-outlined">social_leaderboard</span>
                    ĐIỂM SỐ
                  </button>
                </div>

                <div className="whack-intro-divider"></div>
                <div className="whack-intro-decorations">
                  <span className="material-symbols-outlined">filter_vintage</span>
                  <span className="material-symbols-outlined">grid_view</span>
                  <span className="material-symbols-outlined">filter_vintage</span>
                </div>
              </div>
            ) : (
              <div className="phaser-game-wrapper">
                <div className="phaser-score-display">
                  Coin: <span className="phaser-score-value">{score}</span>
                </div>

                <div ref={gameRef} className="phaser-game-container" />

                {gameOver && (
                  <div className="phaser-game-over">
                    <div className="phaser-game-over-content">
                      <h2>Hết Giờ!</h2>
                      <p>Coin: {score}</p>
                      <button className="phaser-play-again-btn" onClick={handlePlayAgain}>
                        <span className="material-symbols-outlined">replay</span>
                        Chơi Lại
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="whack-intro-floating-icons">
              <span className="material-symbols-outlined">swords</span>
              <span className="material-symbols-outlined">music_note</span>
            </div>
          </section>
        </main>

        <footer className="whack-intro-footer">
          <div className="whack-intro-footer-users">
            <div className="whack-intro-avatars">
              <img src="/masks/quan_công-removebg-preview.png" alt="User" />
              <img src="/masks/triệu_văn_hoán-removebg-preview.png" alt="User" />
              <img src="/masks/lưu_bị-removebg-preview.png" alt="User" />
            </div>
            <p>{isAuthenticated ? `Chào ${userInfo.name}! Cùng ${Math.floor(Math.random() * 500) + 800} người chơi khác` : '1,248 nghệ sĩ đang trên sân khấu'}</p>
          </div>
          <div className="whack-intro-footer-links">
            <a href="#">Về Tuồng</a>
            <span>|</span>
            <a href="#">Tín Dụng</a>
            <span>|</span>
            <a href="#">Điều Khoản</a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default WhackAMaskGame