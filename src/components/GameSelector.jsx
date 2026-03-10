import { Link } from 'react-router-dom'
import './GameSelector.css'

const GameSelector = () => {
  return (
    <div className="game-selector-container">
      <div className="game-selector-content">
        <h1 className="game-selector-title">
          Chọn Phiên Bản Game
        </h1>
        
        <div className="game-selector-cards">
          {/* CSS Version */}
          <Link to="/game/kiem-lua" className="game-card">
            <div className="game-card-icon">
              <span className="material-symbols-outlined">css</span>
            </div>
            <h2>Phiên Bản CSS</h2>
            <p>Animation CSS truyền thống với transform và transition</p>
            <ul className="game-features">
              <li>✓ Nhẹ và đơn giản</li>
              <li>✓ CSS animations</li>
              <li>✓ React Class Component</li>
            </ul>
            <div className="game-card-badge">Original</div>
          </Link>

          {/* Phaser Version */}
          <Link to="/game/kiem-lua-phaser" className="game-card game-card-featured">
            <div className="game-card-icon">
              <span className="material-symbols-outlined">sports_esports</span>
            </div>
            <h2>Phiên Bản Phaser</h2>
            <p>Game engine chuyên nghiệp với WebGL và hiệu ứng đẹp mắt</p>
            <ul className="game-features">
              <li>✨ Particle effects</li>
              <li>✨ Camera shake</li>
              <li>✨ Smooth tweens</li>
              <li>✨ WebGL rendering</li>
            </ul>
            <div className="game-card-badge game-card-badge-new">New!</div>
          </Link>
        </div>

        <div className="game-selector-info">
          <div className="info-card">
            <span className="material-symbols-outlined">info</span>
            <div>
              <h3>So Sánh</h3>
              <p>Phiên bản Phaser có animation mượt mà hơn, nhiều hiệu ứng đặc biệt và performance tốt hơn nhờ WebGL.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameSelector
