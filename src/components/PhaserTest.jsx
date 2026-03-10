import { useEffect, useRef } from 'react'
import Phaser from 'phaser'

class TestScene extends Phaser.Scene {
  preload() {
    console.log('🎮 TestScene: preload')
    this.load.image('hole', '/game-assets/mole-hole-all.png')
    this.load.image('mask', '/game-assets/mole.png')
  }

  create() {
    console.log('🎮 TestScene: create')
    
    // Add background color
    this.cameras.main.setBackgroundColor('#3a2828')
    
    // Add text
    this.add.text(380, 100, 'Test: Mask tự động chui lên', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5)
    
    // Layer 1: Hole bottom
    const holeBottom = this.add.sprite(325, 325, 'hole')
      .setScale(0.4)
      .setOrigin(0.5, 0.5)
      .setDepth(0)
    
    console.log('✅ Hole bottom created')
    
    // Layer 2: Mask - starts DEEPER below hole (thấp hơn)
    const mask = this.add.sprite(325, 710, 'mask')
      .setScale(1.0)
      .setOrigin(0.5, 0.5)
      .setDepth(1)
      .setInteractive({ cursor: 'pointer' })
    
    console.log('✅ Mask created at lower position (y=710)')
    
    // Layer 3: Hole top (rim) - che phần dưới của mask
    const holeTop = this.add.sprite(325, 325, 'hole')
      .setScale(0.4)
      .setOrigin(0.5, 0.5)
      .setDepth(2)
    
    // Tạo mask để CHỈ hiển thị phần DƯỚI của holeTop (viền dưới)
    const topMaskShape = this.make.graphics()
      .fillRect(100, 390, 500, 300)
      .setVisible(false)
    
    const topGeometryMask = topMaskShape.createGeometryMask()
    holeTop.setMask(topGeometryMask)
    
    console.log('✅ Hole top (rim) created - che phần dưới của mask')
    
    // Biến để theo dõi trạng thái
    let isPopping = false
    
    // Function để mask tự động chui lên
    const popUp = () => {
      if (isPopping) return
      
      isPopping = true
      console.log('🎭 Mask tự động chui lên!')
      
      this.tweens.add({
        targets: mask,
        y: 280,
        duration: 400,
        ease: 'Back.easeOut',
        yoyo: true,
        hold: 800,
        onComplete: () => {
          console.log('✅ Mask chui xuống lại')
          isPopping = false
          // Lên lịch lần chui tiếp theo (1-3 giây)
          scheduleNextPop()
        }
      })
    }
    
    // Function để lên lịch lần chui tiếp theo
    const scheduleNextPop = () => {
      const delay = Phaser.Math.Between(1000, 3000) // Random 1-3 giây
      console.log(`⏰ Lên lịch chui lên sau ${delay}ms`)
      this.time.delayedCall(delay, popUp)
    }
    
    // Bắt đầu chu kỳ tự động sau 1 giây
    this.time.delayedCall(1000, () => {
      console.log('🚀 Bắt đầu chu kỳ tự động!')
      popUp()
    })
    
    // Click để đập mask
    mask.on('pointerdown', () => {
      console.log('💥 Đập trúng mask!')
      // Có thể thêm hiệu ứng đập ở đây
    })
    
    // Add instruction
    this.add.text(325, 600, 'Mask sẽ tự động chui lên! Click để đập!', {
      fontSize: '14px',
      color: '#FED955'
    }).setOrigin(0.5)
    
    // Add layer info
    this.add.text(325, 620, 'Tự động chui lên mỗi 1-3 giây', {
      fontSize: '12px',
      color: '#999999'
    }).setOrigin(0.5)
  }
}

const PhaserTest = () => {
  const gameRef = useRef(null)
  const phaserGameRef = useRef(null)

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return

    console.log('🚀 Initializing Phaser Test...')

    const config = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 650,
      height: 650,
      backgroundColor: '#3a2828',
      scene: TestScene
    }

    const game = new Phaser.Game(config)
    phaserGameRef.current = game

    console.log('✅ Phaser Test created')

    return () => {
      console.log('🗑️ Destroying Phaser Test')
      game.destroy(true)
      phaserGameRef.current = null
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#201212',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '2rem',
      padding: '2rem'
    }}>
      <h1 style={{ color: 'white', fontSize: '2rem' }}>Phaser Test Page</h1>
      <div 
        ref={gameRef} 
        style={{
          width: '650px',
          height: '650px',
          border: '2px solid #FED955',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}
      />
      <p style={{ color: '#999' }}>Mở Console (F12) để xem logs. Click vào mặt nạ để test animation.</p>
    </div>
  )
}

export default PhaserTest
