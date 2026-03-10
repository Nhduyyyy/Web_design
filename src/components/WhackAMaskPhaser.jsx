import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
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
    // Load assets - simplified version
    this.load.image('hole', '/game-assets/mole-hole-all.png')
    this.load.image('mask', '/game-assets/mole.png')
    this.load.image('smash', '/game-assets/smash.png')
    
    this.load.on('complete', () => {
      console.log('✅ Assets loaded successfully')
    })
    
    this.load.on('loaderror', (file) => {
      console.error('❌ Failed to load:', file.key, file.src)
    })
  }

  create() {
    console.log('🎨 Creating game scene...')
    // Setup game board - 3x3 grid
    const gridSize = 3
    const spacing = 180
    const startX = this.cameras.main.centerX - spacing
    const startY = this.cameras.main.centerY - spacing + 20

    console.log('📍 Camera center:', this.cameras.main.centerX, this.cameras.main.centerY)
    console.log('📍 Start position:', startX, startY)

    // Create 9 holes
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = startX + col * spacing
        const y = startY + row * spacing
        console.log(`🕳️ Creating hole ${this.holes.length} at (${x}, ${y})`)
        const hole = new MoleHole(this, x, y, this.holes.length)
        this.holes.push(hole)
      }
    }

    console.log(`✅ Created ${this.holes.length} holes`)

    // Listen for score updates
    this.events.on('scoreUpdate', (newScore) => {
      this.score = newScore
      if (this.onScoreUpdate) {
        this.onScoreUpdate(newScore)
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

    // Shake screen effect
    this.cameras.main.shake(500, 0.01)

    // Start spawning moles
    this.time.delayedCall(500, () => {
      this.spawnMole()
    })
  }

  spawnMole() {
    if (!this.gameActive || this.roundsLeft <= 0) {
      this.endGame()
      return
    }

    // Pick random hole (avoid last one)
    let randomIndex
    do {
      randomIndex = Phaser.Math.Between(0, this.holes.length - 1)
    } while (this.lastHoleIndex === randomIndex)
    
    this.lastHoleIndex = randomIndex
    const hole = this.holes[randomIndex]
    
    hole.popup()
    this.roundsLeft--

    // Schedule next mole
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

    // Layer 1: Hole bottom (phần dưới của hố)
    this.holeBottom = scene.add.sprite(x, y, 'hole')
      .setScale(0.35)
      .setOrigin(0.5, 0.5)
      .setDepth(0)

    // Layer 2: Mask (con chuột - sẽ chui lên từ dưới)
    this.mask = scene.add.sprite(x, y + 60, 'mask')
      .setScale(0.8) // Tăng từ 0.4 lên 0.8 (gấp 4 lần so với ban đầu 0.2)
      .setOrigin(0.5, 0.5)
      .setDepth(1)
      .setInteractive({ cursor: 'pointer' })

    // Layer 3: Hole top (viền hố - che phần dưới của mask)
    // Tạo một bản sao của hố nhưng chỉ hiển thị phần viền DƯỚI
    this.holeTop = scene.add.sprite(x, y, 'hole')
      .setScale(0.35)
      .setOrigin(0.5, 0.5)
      .setDepth(2)
      .setAlpha(1)

    // Tạo mask để chỉ hiển thị phần viền DƯỚI của holeTop
    // Phần này sẽ che mask khi nó ở dưới hố
    const holeSize = this.holeBottom.displayWidth
    const topMaskShape = scene.make.graphics()
      .fillRect(x - holeSize/2, y, holeSize, holeSize) // Chỉ hiển thị phần dưới (từ y trở xuống)
      .setVisible(false)
    
    const topGeometryMask = topMaskShape.createGeometryMask()
    this.holeTop.setMask(topGeometryMask)

    // Layer 4: Smash effect (hidden)
    this.smash = scene.add.sprite(x, y - 10, 'smash')
      .setScale(0.3)
      .setOrigin(0.5, 0.5)
      .setDepth(3)
      .setAlpha(0)

    // Click handler
    this.mask.on('pointerdown', () => this.onHit())
    
    // Hover effect
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

    // Pop up animation - mask chui từ dưới (y + 60) lên (y - 15)
    this.scene.tweens.add({
      targets: this.mask,
      y: this.y - 15,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Auto hide after delay
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

    // Hide animation - mask chui xuống lại
    this.scene.tweens.add({
      targets: this.mask,
      y: this.y + 60,
      duration: 300,
      ease: 'Cubic.easeIn'
    })
  }

  onHit() {
    if (!this.isActive || this.isHit) return
    
    this.isHit = true
    this.scene.addScore()

    // Show smash effect
    this.smash.setAlpha(1)
    this.scene.tweens.add({
      targets: this.smash,
      alpha: 0,
      duration: 400,
      ease: 'Power2'
    })

    // Particle burst effect
    const particles = this.scene.add.particles(this.x, this.y - 10, 'mask', {
      speed: { min: 100, max: 200 },
      scale: { start: 0.6, end: 0 }, // Tăng từ 0.3 lên 0.6
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 8,
      blendMode: 'ADD'
    })

    this.scene.time.delayedCall(400, () => {
      particles.destroy()
    })

    // Camera shake
    this.scene.cameras.main.shake(100, 0.003)

    // Hide mask
    this.hide()
  }
}

// React Component Wrapper
const WhackAMaskPhaser = () => {
  const gameRef = useRef(null)
  const phaserGameRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return

    console.log('🎮 Initializing Phaser game...')

    const config = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 650,
      height: 650,
      backgroundColor: '#3a2828',
      scene: WhackAMaskScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    }

    const game = new Phaser.Game(config)
    phaserGameRef.current = game

    console.log('✅ Phaser game created')

    // Get scene reference
    game.events.once('ready', () => {
      console.log('✅ Phaser scene ready')
      const scene = game.scene.scenes[0]
      
      scene.onScoreUpdate = (newScore) => {
        setScore(newScore)
      }

      scene.onGameOver = (finalScore) => {
        setGameOver(true)
        setScore(finalScore)
      }
    })

    return () => {
      console.log('🗑️ Destroying Phaser game')
      game.destroy(true)
      phaserGameRef.current = null
    }
  }, [])

  const handlePlayGame = () => {
    setIsPlaying(true)
    setGameOver(false)
    setScore(0)
    
    setTimeout(() => {
      const scene = phaserGameRef.current?.scene.scenes[0]
      if (scene) {
        scene.startGame()
      }
    }, 300)
  }

  const handleViewScores = () => {
    alert('Bảng xếp hạng đang được phát triển!')
  }

  const handlePlayAgain = () => {
    setGameOver(false)
    handlePlayGame()
  }

  return (
    <div className="whack-intro-root">
      <div className="whack-intro-container">
        {/* Navigation Bar */}
        <header className="whack-intro-header">
          <div className="whack-intro-logo">
            <span className="material-symbols-outlined">theater_comedy</span>
            <h2>Whack-a-Mask</h2>
          </div>
          <div className="whack-intro-nav-buttons">
            <button className="whack-intro-icon-btn" title="Cài đặt">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="whack-intro-icon-btn" title="Trợ giúp">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </header>

        <main className="whack-intro-main">
          {/* Sidebar Navigation */}
          <aside className="whack-intro-sidebar">
            <div className="whack-intro-profile">
              <div className="whack-intro-avatar-wrapper">
                <img
                  className="whack-intro-avatar"
                  src="/masks/bao_công__tuồng_nam_bộ_-removebg-preview.png"
                  alt="Tuồng Master"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/48'
                  }}
                />
              </div>
              <div className="whack-intro-profile-info">
                <h3>Tuồng Master</h3>
                <p>Rank: Grandmaster</p>
              </div>
            </div>

            <nav className="whack-intro-nav">
              <a className="whack-intro-nav-link active" href="#">
                <span className="material-symbols-outlined">home</span>
                <span>Trang Chủ</span>
              </a>
              <a className="whack-intro-nav-link" href="#">
                <span className="material-symbols-outlined">leaderboard</span>
                <span>Bảng Xếp Hạng</span>
              </a>
              <a className="whack-intro-nav-link" href="#">
                <span className="material-symbols-outlined">style</span>
                <span>Bộ Sưu Tập Mặt Nạ</span>
              </a>
              <a className="whack-intro-nav-link" href="#">
                <span className="material-symbols-outlined">history</span>
                <span>Lịch Sử Trận Đấu</span>
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
              <button className="whack-intro-reward-btn">Nhận Thưởng</button>
            </div>
          </aside>

          {/* Main Game Area */}
          <section className="whack-intro-game-area">
            {/* Background Decoration */}
            <div className="whack-intro-curtains">
              <div className="whack-intro-curtain-left"></div>
              <div className="whack-intro-curtain-right"></div>
              <div className="whack-intro-curtain-top"></div>
            </div>

            {/* Lanterns */}
            <div className="whack-intro-lantern whack-intro-lantern-left">
              <span className="material-symbols-outlined">light</span>
            </div>
            <div className="whack-intro-lantern whack-intro-lantern-right">
              <span className="material-symbols-outlined">light</span>
            </div>

            {!isPlaying ? (
              /* Start Screen Content */
              <div className="whack-intro-content">
                <div className="whack-intro-hero-mask">
                  <div className="whack-intro-mask-glow"></div>
                  <div className="whack-intro-mask-container">
                    <img
                      src="/masks/quan_công-removebg-preview.png"
                      alt="Mặt nạ Tuồng truyền thống"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/256'
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
              /* Game Board */
              <div className="phaser-game-wrapper">
                <h1 className="phaser-game-title">KIẾM LÚA</h1>
                
                <div className="phaser-score-display">
                  Điểm: <span className="phaser-score-value">{score}</span>
                </div>

                <div ref={gameRef} className="phaser-game-container" />

                {gameOver && (
                  <div className="phaser-game-over">
                    <div className="phaser-game-over-content">
                      <h2>Hết Giờ!</h2>
                      <p>Điểm Số: {score}</p>
                      <button className="phaser-play-again-btn" onClick={handlePlayAgain}>
                        <span className="material-symbols-outlined">replay</span>
                        Chơi Lại
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Floating Decorative Elements */}
            <div className="whack-intro-floating-icons">
              <span className="material-symbols-outlined">swords</span>
              <span className="material-symbols-outlined">music_note</span>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="whack-intro-footer">
          <div className="whack-intro-footer-users">
            <div className="whack-intro-avatars">
              <img src="https://i.pravatar.cc/32?img=1" alt="User" />
              <img src="https://i.pravatar.cc/32?img=2" alt="User" />
              <img src="https://i.pravatar.cc/32?img=3" alt="User" />
            </div>
            <p>1,248 nghệ sĩ đang trên sân khấu</p>
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

export default WhackAMaskPhaser
