import { Component } from 'react'
import './WhackAMoleGame.css'

// Game components
const Score = ({ context }) => (
  <div className="game__score" style={{ display: context.display }}>
    Score: {context.score}
  </div>
)

const GameOver = ({ context }) => (
  <div className="game__game-over game__game-over-animate" style={{ display: context.gameOver }}>
    <h2>Game Over!</h2>
    <p>Final Score: {context.score}</p>
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
  </div>
)

class WhackAMoleGame extends Component {
  constructor(props) {
    super(props)

    this.state = {
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
      buttonMessage: 'Bắt Đầu Chơi',
      gameOver: 'none',
      buttonDisplay: 'inline-block',
      titleMargin: '15px'
    }
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
          this.setState({
            display: 'none',
            gameOver: 'block',
            buttonMessage: 'Chơi Lại',
            buttonDisplay: 'inline-block',
            titleMargin: '15px'
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
      [activeMole]: 'translate(0, 15%)',
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
    return (
      <div className="whack-a-mole-container">
        <div className="main-container">
          <div className="game" style={{ WebkitTransform: this.state['shake'] }}>
            <h1 className="game__title" style={{ margin: this.state.titleMargin }}>
              KIẾM LÚA
            </h1>
            <GameOver context={this} />
            <div className="game__button-container">
              <StartButton context={this.state} onClick={this.timeOut} />
            </div>
            {this.createMoleHoles()}
            <Score context={this.state} />
          </div>
        </div>
      </div>
    )
  }
}

export default WhackAMoleGame
