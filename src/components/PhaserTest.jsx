import { useEffect, useRef } from 'react'
import Phaser from 'phaser'

class TestScene extends Phaser.Scene {
  preload() {
    console.log('🎮 TestScene: preload')
    this.load.image('hole', '/game-assets/mole-hole-all.png')
    this.load.image('mask', '/game-assets/mole.png')
    this.load.image('smash', '/game-assets/smash.png')
    this.load.image('hammer', '/game-assets/hammer.png')
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
    
    // Tạo mask để CHỈ hiển thị phần TRÊN y=390 của mole
    const moleMaskShape = this.make.graphics()
      .fillRect(0, 0, 650, 390)
      .setVisible(false)
    
    const moleGeometryMask = moleMaskShape.createGeometryMask()
    mask.setMask(moleGeometryMask)
    
    console.log('✅ Mask created at lower position (y=710) - chỉ hiển thị phần trên y=390')
    
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
    
    // Layer 4: Smash effect - ẩn ban đầu
    const smashEffect = this.add.sprite(325, 325, 'smash')
      .setScale(0.5)
      .setOrigin(0.5, 0.5)
      .setDepth(3)
      .setVisible(false)
    
    console.log('✅ Smash effect created')
    
    // Layer 5: Hammer (búa) - theo dõi con trỏ chuột
    const hammer = this.add.sprite(0, 0, 'hammer')
      .setScale(0.4)
      .setOrigin(0.3, 0.65) // Pivot point ở gần đầu cán búa
      .setDepth(4)
      .setAlpha(1.0) // Độ mờ 100% - rõ ràng hoàn toàn
      .setAngle(-15) // Góc nghiêng tự nhiên
    
    console.log('✅ Hammer created')
    
    // Biến để theo dõi trạng thái búa
    let isHammering = false
    
    // Biến để theo dõi trạng thái
    let isPopping = false
    let isClickable = false // Chỉ cho phép click khi chuột chui lên qua y=390
    
    // Update hammer position theo con trỏ chuột
    this.input.on('pointermove', (pointer) => {
      if (!isHammering) {
        hammer.setPosition(pointer.x, pointer.y)
      }
    })
    
    // Function để thực hiện animation búa đập
    const hammerSmash = (x, y) => {
      if (isHammering) return
      
      isHammering = true
      console.log('🔨 Búa đập xuống!')
      
      // Lưu vị trí đập
      const smashX = x
      const smashY = y
      
      // Animation búa: nâng lên -> đập xuống -> nảy lên
      // búa đang cầm
const smashDepth = 30

this.tweens.add({
  targets: hammer,
  angle: -100,   // đập theo chiều ngược lại
  y: smashY + smashDepth,
  duration: 100,
  ease: 'Power3',
  onComplete: () => {

    this.tweens.add({
      targets: hammer,
      angle: 0,
      y: smashY - 20,
      duration: 120,
      ease: 'Power2',
      onComplete: () => {
        isHammering = false
      }
    })

  }
})
    }
    
    // Function để mask tự động chui lên
    const popUp = () => {
      if (isPopping) return
      
      isPopping = true
      isClickable = false // Reset clickable
      console.log('🎭 Mask tự động chui lên!')
      
      this.tweens.add({
        targets: mask,
        y: 280,
        duration: 400,
        ease: 'Back.easeOut',
        yoyo: true,
        hold: 800,
        onUpdate: (tween) => {
          // Kiểm tra khi mask chui lên qua y=390
          if (mask.y <= 390 && !isClickable) {
            isClickable = true
            console.log('✅ Mask có thể click được! (y <= 390)')
          } else if (mask.y > 390 && isClickable) {
            isClickable = false
            console.log('❌ Mask không thể click (y > 390)')
          }
        },
        onComplete: () => {
          console.log('✅ Mask chui xuống lại')
          isPopping = false
          isClickable = false
          // Lên lịch lần chui tiếp theo (1-3 giây)
          scheduleNextPop()
        }
      })
    }
    
    // Function để hiển thị hiệu ứng smash
    const showSmashEffect = () => {
      smashEffect.setVisible(true)
      smashEffect.setPosition(mask.x, mask.y)
      smashEffect.setAlpha(1)
      smashEffect.setScale(0.5)
      
      // Animation cho smash effect - phóng to nhanh
      this.tweens.add({
        targets: smashEffect,
        scale: 0.7,
        duration: 100,
        ease: 'Power2',
        onComplete: () => {
          // Dừng lại 1 giây
          this.time.delayedCall(1000, () => {
            // Sau đó mờ dần
            this.tweens.add({
              targets: smashEffect,
              alpha: 0,
              duration: 200,
              ease: 'Power2',
              onComplete: () => {
                smashEffect.setVisible(false)
              }
            })
          })
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
    
    // Click để đập mask - CHỈ khi mask ở trên y=390
    mask.on('pointerdown', (pointer) => {
      if (!isClickable || mask.y > 390) {
        console.log('❌ Không thể đập! Mask chưa chui lên đủ cao (y > 390)')
        // Vẫn hiển thị animation búa đập
        hammerSmash(pointer.x, pointer.y)
        return
      }
      
      console.log('💥 Đập trúng mask! Chuột chết!')
      
      // Animation búa đập
      hammerSmash(pointer.x, pointer.y)
      
      // Dừng animation hiện tại
      this.tweens.killTweensOf(mask)
      
      // Hiển thị hiệu ứng smash
      showSmashEffect()
      
      // Mask chết - chui xuống nhanh
      this.tweens.add({
        targets: mask,
        y: 710,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          console.log('☠️ Chuột đã chết và chui xuống')
          isPopping = false
          isClickable = false
          // Lên lịch lần chui tiếp theo
          scheduleNextPop()
        }
      })
    })
    
    // Click vào background cũng hiển thị animation búa
    this.input.on('pointerdown', (pointer) => {
      // Chỉ xử lý nếu không click vào mask
      if (!mask.getBounds().contains(pointer.x, pointer.y)) {
        hammerSmash(pointer.x, pointer.y)
      }
    })
    
    // Add instruction
    this.add.text(325, 600, 'Click chuột khi nó chui lên qua vạch vàng!', {
      fontSize: '14px',
      color: '#ffffffff'
    }).setOrigin(0.5)
    
    // Add layer info
    this.add.text(325, 620, 'Búa sẽ theo dõi con trỏ và đập xuống khi click', {
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
          border: '1px solid #ffffffff',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}
      />
      <p style={{ color: '#999' }}>Mở Console (F12) để xem logs. Click vào mặt nạ để test animation.</p>
    </div>
  )
}

export default PhaserTest
