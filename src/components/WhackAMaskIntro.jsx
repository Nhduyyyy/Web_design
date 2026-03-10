import { Component } from 'react'
import './WhackAMaskIntro.css'

// Game components
const Score = ({ context }) => (
  <div className="game__score" style={{ display: context.display }}>
    Điểm: {context.score}
  </div>
)

const GameOver = ({ context }) => (
  <div className="game__game-over game__game-over-animate" style={{ display: context.gameOver }}>
    <h2>Hết Giờ!</h2>
    <p>Điểm Số: {context.score}</p>
  </div>
)

const StartButton = ({ context, onClick }) => (
  <button
    className="game__start-button"
    type="button"
    onClick={onClick}
    style={{ display: context.buttonDisplay }}
  >
    {context.buttonMessage}
  </button>
)

const MoleHole = ({ context, onClick, holeNumber }) => (
  <div className="game__mole-hole">
    
    <div
      className="game__mole"
      onClick={onClick}
      style={{ transform: context[holeNumber] }}
    />
    <div className="game__mole-hole-2">
    </div>
  </div>
)

class WhackAMaskIntro extends Component {
  constructor(props) {
    super(props)

    this.state = {
      // Game states
      1: 'translate(0, 110%)',
      2: 'translate(0, 110%)',
      3: 'translate(0, 110%)',
      4: 'translate(0, 110%)',
      5: 'translate(0, 110%)',
      6: 'translate(0, 110%)',
      7: 'translate(0, 110%)',
      8: 'translate(0, 110%)',
      9: 'translate(0, 110%)',
      shake: 'translate(0, 0)',
      gameHasStarted: false,
      moleHasBeenWhacked: false,
      score: 0,
      lastMole: '',
      display: 'none',
      buttonMessage: 'Chơi Lại',
      gameOver: 'none',
      buttonDisplay: 'inline-block',
      titleMargin: '15px',
      // UI state
      isPlaying: false
    }
  }

  handlePlayGame = () => {
    this.setState({ 
      isPlaying: true,
      buttonDisplay: 'none',
      titleMargin: 0
    })
    setTimeout(() => {
      this.timeOut(500)
    }, 300)
  }

  handleViewScores = () => {
    alert('Bảng xếp hạng đang được phát triển!')
  }

  timeOut = (num = 1000) => {
    if (this.state.gameHasStarted) {
      return
    }
    this.setState({
      buttonDisplay: 'none',
      display: 'block',
      gameOver: 'none',
      titleMargin: 0
    })
    this.shakeScreen()
    window.setTimeout(() => {
      this.startGame()
    }, num)
  }

  startGame() {
    if (this.state.gameHasStarted) {
      return
    }

    this.setState({
      gameHasStarted: true,
      score: 0
    })

    let x = 0
    const intervalID = setInterval(() => {
      this.displayMoles()
      if (++x === 16) {
        window.clearInterval(intervalID)
        this.clearMoles()
        this.setState({ gameHasStarted: false })
        window.setTimeout(() => {
          // Hiển thị điểm số cuối cùng
          const finalScore = this.state.score
          alert(`Hết Giờ! Điểm Số: ${finalScore}`)
          
          // Reset về màn hình chính
          this.setState({
            display: 'none',
            gameOver: 'none',
            buttonMessage: 'Chơi Lại',
            buttonDisplay: 'inline-block',
            titleMargin: '15px',
            isPlaying: false,
            score: 0
          })
        }, 850)
      }
    }, 700)
  }

  clearMoles() {
    for (let value in this.state) {
      if (!isNaN(value)) {
        this.setState({
          [value]: 'translate(0, 110%)'
        })
      }
    }
  }

  displayMoles() {
    let activeMole = Math.ceil(Math.random() * 9)
    if (this.state.lastMole[0] === activeMole) {
      this.displayMoles()
      return
    }
    this.clearMoles()
    this.setState({
      [activeMole]: 'visible',
      lastMole: [activeMole]
    })
  }

  lockOutClick() {
    window.setTimeout(() => {
      this.setState({ moleHasBeenWhacked: false })
    }, 350)
  }

  addToScore = (e) => {
    if (this.state.moleHasBeenWhacked) {
      return
    }
    let target = e.target
    target.parentNode.classList.add('game__cross')
    target.classList.add('no-background')
    this.lockOutClick()
    this.setState({
      background: '75px',
      moleHasBeenWhacked: true,
      score: [parseInt(this.state.score, 10) + 1]
    })
    window.setTimeout(function () {
      target.parentNode.classList.remove('game__cross')
      target.classList.remove('no-background')
    }, 500)
  }

  shakeScreen() {
    let posOrNeg = '+'
    let i = 0
    let shake = () => {
      if (i === 15) {
        this.setState({ shake: 'translate(0, 0)' })
        return
      }
      window.setTimeout(() => {
        posOrNeg = posOrNeg === '-' ? '+' : '-'
        this.setState({ shake: `translate(${posOrNeg}${i}px, 0)` })
        shake()
      }, 80)
      i++
    }
    shake()
  }

  createMoleHoles() {
    var holes = []
    for (let i = 1; i <= 9; i++) {
      holes.push(
        <MoleHole
          key={i}
          context={this.state}
          onClick={this.addToScore}
          holeNumber={i}
        />
      )
    }
    return <div className="board">{holes}</div>
  }

  render() {
    const { isPlaying } = this.state

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

            {/* Daily Reward Card */}
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
                {/* Hero Mask Image */}
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
                  <button className="whack-intro-play-btn" onClick={this.handlePlayGame}>
                    <span className="material-symbols-outlined">play_arrow</span>
                    CHƠI NGAY
                    <div className="whack-intro-play-ping"></div>
                  </button>
                  <button className="whack-intro-scores-btn" onClick={this.handleViewScores}>
                    <span className="material-symbols-outlined">social_leaderboard</span>
                    ĐIỂM SỐ
                  </button>
                </div>

                {/* Stage Floor Pattern */}
                <div className="whack-intro-divider"></div>
                <div className="whack-intro-decorations">
                  <span className="material-symbols-outlined">filter_vintage</span>
                  <span className="material-symbols-outlined">grid_view</span>
                  <span className="material-symbols-outlined">filter_vintage</span>
                </div>
              </div>
            ) : (
              /* Game Board */
              <div className="whack-game-container" style={{ WebkitTransform: this.state.shake }}>
                <h1 className="game__title" style={{ margin: this.state.titleMargin }}>
                  KIẾM LÚA
                </h1>
                <div className="game__button-container">
                  <StartButton context={this.state} onClick={this.timeOut} />
                </div>
                {this.createMoleHoles()}
                <Score context={this.state} />
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
}

export default WhackAMaskIntro
