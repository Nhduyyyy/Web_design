import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'

class DebugScene extends Phaser.Scene {
  preload() {
    this.load.image('hole', '/game-assets/mole-hole-all.png')
    this.load.image('mask', '/game-assets/mole.png')
  }

  create() {
    this.cameras.main.setBackgroundColor('#3a2828')
    
    // Title
    this.add.text(325, 30, 'Debug: Kích Thước Sprites', {
      fontSize: '28px',
      color: '#FED955',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    const x = 325
    const y = 325
    
    // Layer 1: Hole bottom
    const holeBottom = this.add.sprite(x, y, 'hole')
      .setScale(0.35)
      .setOrigin(0.5, 0.5)
      .setDepth(0)
    
    // Layer 2: Mask
    const mask = this.add.sprite(x, y + 60, 'mask')
      .setScale(0.8)
      .setOrigin(0.5, 0.5)
      .setDepth(1)
    
    // Layer 3: Hole top
    const holeTop = this.add.sprite(x, y, 'hole')
      .setScale(0.35)
      .setOrigin(0.5, 0.5)
      .setDepth(2)
    
    const holeSize = holeBottom.displayWidth
    const topMaskShape = this.make.graphics()
      .fillRect(x - holeSize/2, y, holeSize, holeSize)
      .setVisible(false)
    
    const topGeometryMask = topMaskShape.createGeometryMask()
    holeTop.setMask(topGeometryMask)
    
    // Display info
    const infoY = 550
    const lineHeight = 25
    
    this.add.text(50, infoY, 'KÍCH THƯỚC SPRITES:', {
      fontSize: '18px',
      color: '#FED955',
      fontStyle: 'bold'
    })
    
    this.add.text(50, infoY + lineHeight, `Hole Original: ${holeBottom.width} x ${holeBottom.height} px`, {
      fontSize: '16px',
      color: '#ffffff'
    })
    
    this.add.text(50, infoY + lineHeight * 2, `Hole Display (scale 0.35): ${holeBottom.displayWidth.toFixed(1)} x ${holeBottom.displayHeight.toFixed(1)} px`, {
      fontSize: '16px',
      color: '#ffffff'
    })
    
    this.add.text(50, infoY + lineHeight * 3, `Mask Original: ${mask.width} x ${mask.height} px`, {
      fontSize: '16px',
      color: '#ffffff'
    })
    
    this.add.text(50, infoY + lineHeight * 4, `Mask Display (scale 0.8): ${mask.displayWidth.toFixed(1)} x ${mask.displayHeight.toFixed(1)} px`, {
      fontSize: '16px',
      color: '#ffffff'
    })
    
    this.add.text(50, infoY + lineHeight * 5, `Tỷ lệ Mask/Hole: ${(mask.displayWidth / holeBottom.displayWidth * 100).toFixed(1)}%`, {
      fontSize: '16px',
      color: '#FED955'
    })
    
    // Draw bounding boxes
    const graphics = this.add.graphics()
    
    // Hole bounding box (green)
    graphics.lineStyle(2, 0x00ff00)
    graphics.strokeRect(
      x - holeBottom.displayWidth/2,
      y - holeBottom.displayHeight/2,
      holeBottom.displayWidth,
      holeBottom.displayHeight
    )
    
    // Mask bounding box (red)
    graphics.lineStyle(2, 0xff0000)
    graphics.strokeRect(
      x - mask.displayWidth/2,
      y + 60 - mask.displayHeight/2,
      mask.displayWidth,
      mask.displayHeight
    )
    
    // Legend
    this.add.text(400, infoY, 'LEGEND:', {
      fontSize: '18px',
      color: '#FED955',
      fontStyle: 'bold'
    })
    
    this.add.rectangle(410, infoY + lineHeight + 5, 20, 10, 0x00ff00)
    this.add.text(435, infoY + lineHeight, 'Hole bounding box', {
      fontSize: '16px',
      color: '#ffffff'
    })
    
    this.add.rectangle(410, infoY + lineHeight * 2 + 5, 20, 10, 0xff0000)
    this.add.text(435, infoY + lineHeight * 2, 'Mask bounding box', {
      fontSize: '16px',
      color: '#ffffff'
    })
  }
}

const PhaserDebug = () => {
  const gameRef = useRef(null)
  const phaserGameRef = useRef(null)

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return

    const config = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 650,
      height: 650,
      backgroundColor: '#3a2828',
      scene: DebugScene
    }

    const game = new Phaser.Game(config)
    phaserGameRef.current = game

    return () => {
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
      <h1 style={{ color: 'white', fontSize: '2rem' }}>Debug: Kích Thước Sprites</h1>
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
      <div style={{ color: '#999', textAlign: 'center', maxWidth: '600px' }}>
        <p>Trang này hiển thị kích thước chính xác của các sprites trong game.</p>
        <p>Hộp xanh lá = Hole | Hộp đỏ = Mask</p>
      </div>
    </div>
  )
}

export default PhaserDebug
