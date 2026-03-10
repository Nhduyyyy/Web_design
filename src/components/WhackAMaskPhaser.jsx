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
    
    // Set base path for assets
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
    
    // Add background image - scale to fill entire canvas
    const bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'background')
    bg.setDisplaySize(1200, 1000)  // Larger background
    bg.setDepth(-1)
    console.log('✅ Background added')
    
    // Setup game board - 3x3 grid (giữ nguyên kích thước)
    const gridSize = 3
    const spacing = 250  // Giữ nguyên spacing
    const startX = this.cameras.main.centerX - spacing
    const startY = this.cameras.main.centerY - spacing + 120  // Tăng từ +20 lên +120 để đẩy grid xuống thấp

    // Create 9 holes
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = startX + col * spacing
        const y = startY + row * spacing
        const hole = new MoleHole(this, x, y, this.holes.length)
        this.holes.push(hole)
      }
    }

    console.log(`✅ Created ${this.holes.length} holes`)

    // Layer: Hammer (búa) - theo dõi con trỏ chuột
    this.hammer = this.add.sprite(0, 0, 'hammer')
      .setScale(0.4)
      .setOrigin(0.3, 0.65)
      .setDepth(10)
      .setAlpha(1.0)
      .setAngle(-15)
    
    console.log('✅ Hammer created')
    
    this.isHammering = false

    // Update hammer position theo con trỏ chuột
    this.input.on('pointermove', (pointer) => {
      if (!this.isHammering) {
        this.hammer.setPosition(pointer.x, pointer.y)
      }
    })

    // Click vào background cũng hiển thị animation búa
    this.input.on('pointerdown', (pointer) => {
      // Kiểm tra xem có click vào mask nào không
      let clickedOnMask = false
      for (const hole of this.holes) {
        if (hole.mask && hole.mask.getBounds().contains(pointer.x, pointer.y)) {
          clickedOnMask = true
          break
        }
      }
      
      // Nếu không click vào mask nào, hiển thị animation búa
      if (!clickedOnMask) {
        this.hammerSmash(pointer.x, pointer.y)
      }
    })

    // Listen for score updates
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
    console.log('🔨 Búa đập xuống!')
    
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

// Mole Hole Class - Dựa trên logic từ PhaserTest.jsx
class MoleHole {
  constructor(scene, x, y, index) {
    this.scene = scene
    this.x = x
    this.y = y
    this.index = index
    this.isActive = false
    this.isHit = false

    // Tính toán vị trí ẩn (dưới hố) - DEEPER như PhaserTest
    const hiddenY = y + 385  // Tương đương với logic PhaserTest (710 - 325 = 385)

    // Layer 1: Hole bottom
    this.holeBottom = scene.add.sprite(x, y, 'hole')
      .setScale(0.18)
      .setOrigin(0.5, 0.5)
      .setDepth(0)

    // Layer 2: Mask - starts DEEPER below hole
    this.mask = scene.add.sprite(x, hiddenY, 'mask')
      .setScale(0.35)
      .setOrigin(0.5, 0.5)
      .setDepth(1)
      .setInteractive({ cursor: 'pointer' })

    // Tạo mask để CHỈ hiển thị phần TRÊN của mole (phần có thể nhìn thấy)
    const visibleHeight = y + 65
    const moleMaskShape = scene.make.graphics()
      .fillRect(0, 0, 1200, visibleHeight)  // Match canvas width
      .setVisible(false)
    
    const moleGeometryMask = moleMaskShape.createGeometryMask()
    this.mask.setMask(moleGeometryMask)

    // Layer 3: Hole top (rim) - che phần dưới của mask
    this.holeTop = scene.add.sprite(x, y, 'hole')
      .setScale(0.18)
      .setOrigin(0.5, 0.5)
      .setDepth(2)

    // Tạo mask để CHỈ hiển thị phần DƯỚI của holeTop (viền dưới)
    const holeSize = this.holeBottom.displayWidth
    const topMaskShape = scene.make.graphics()
      .fillRect(x - holeSize/2, y + 20, holeSize, holeSize)  // Thêm +10 để đẩy xuống thấp hơn
      .setVisible(false)
    
    const topGeometryMask = topMaskShape.createGeometryMask()
    this.holeTop.setMask(topGeometryMask)

    // Layer 4: Smash effect
    this.smashEffect = scene.add.sprite(x, y, 'smash')
      .setScale(0.10)  // Giảm từ 0.12 xuống 0.10
      .setOrigin(0.5, 0.5)
      .setDepth(3)
      .setVisible(false)

    // Click handler
    this.mask.on('pointerdown', (pointer) => this.onHit(pointer))
    
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

    // Target Y giống PhaserTest: y=280 (tương đương với y - 45 trong grid)
    const targetY = this.y - 25  // Giảm từ -45 lên -25 để mole xuất hiện thấp hơn

    // Pop up animation - giống PhaserTest
    this.scene.tweens.add({
      targets: this.mask,
      y: targetY,
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

    // Hidden Y giống constructor
    const hiddenY = this.y + 385

    // Hide animation
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

    // Animation búa đập
    this.scene.hammerSmash(pointer.x, pointer.y)

    // Dừng animation hiện tại
    this.scene.tweens.killTweensOf(this.mask)

    // Show smash effect
    this.showSmashEffect()

    // Mask chết - chui xuống nhanh (giống PhaserTest)
    const hiddenY = this.y + 385
    this.scene.tweens.add({
      targets: this.mask,
      y: hiddenY,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        console.log('☠️ Mask đã chết và chui xuống')
        this.isActive = false
      }
    })

    // Camera shake
    this.scene.cameras.main.shake(100, 0.003)
  }

  showSmashEffect() {
    this.smashEffect.setVisible(true)
    this.smashEffect.setPosition(this.mask.x, this.mask.y + 15)  // Thêm +15 để đẩy xuống thấp hơn
    this.smashEffect.setAlpha(1)
    this.smashEffect.setScale(0.25)  // Giảm từ 0.3 xuống 0.25
    
    // Animation cho smash effect - giống PhaserTest
    this.scene.tweens.add({
      targets: this.smashEffect,
      scale: 0.38,  // Giảm từ 0.45 xuống 0.38
      duration: 100,
      ease: 'Power2',
      onComplete: () => {
        // Dừng lại 1 giây
        this.scene.time.delayedCall(1000, () => {
          // Sau đó mờ dần
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

// React Component Wrapper
const WhackAMaskPhaser = () => {
  const gameRef = useRef(null)
  const phaserGameRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    // Chỉ khởi tạo game khi isPlaying = true
    if (!isPlaying || !gameRef.current || phaserGameRef.current) return

    console.log('🎮 Initializing Phaser game...')

    const config = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 1200,  // Canvas rộng hơn
      height: 1000, // Canvas cao hơn
      backgroundColor: '#3a2828',
      scene: WhackAMaskScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
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

      // Tự động start game sau khi scene ready
      setTimeout(() => {
        if (scene) {
          scene.startGame()
        }
      }, 300)
    })

    return () => {
      console.log('🗑️ Destroying Phaser game')
      if (game) {
        game.destroy(true)
      }
      phaserGameRef.current = null
    }
  }, [isPlaying])

  const handlePlayGame = () => {
    setIsPlaying(true)
    setGameOver(false)
    setScore(0)
  }

  const handleViewScores = () => {
    alert('Bảng xếp hạng đang được phát triển!')
  }

  const handlePlayAgain = () => {
    setGameOver(false)
    setIsPlaying(false)
    
    // Destroy old game
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true)
      phaserGameRef.current = null
    }
    
    // Restart
    setTimeout(() => {
      setScore(0)
      setIsPlaying(true)
    }, 100)
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
