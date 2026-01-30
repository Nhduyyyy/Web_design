import { motion } from 'framer-motion'
import './Hero.css'

function Hero({ setActiveSection }) {
  return (
    <section className="hero">
      <div className="hero-content">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-text"
        >
          <h1 className="hero-title">
            Khám Phá Nghệ Thuật <span className="highlight">Tuồng</span> Việt Nam
          </h1>
          <p className="hero-subtitle">
            Trải nghiệm nghệ thuật truyền thống qua công nghệ hiện đại. 
            Tương tác với mặt nạ, trang phục và nhân vật Tuồng một cách sống động.
          </p>
          <div className="hero-buttons">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary"
              onClick={() => {
                setActiveSection('home')
                setTimeout(() => document.getElementById('mask-gallery')?.scrollIntoView({ behavior: 'smooth' }), 100)
              }}
            >
              Bắt Đầu Khám Phá
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary"
              onClick={() => setActiveSection('experience')}
            >
              Trải Nghiệm AR
            </motion.button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hero-visual"
        >
          <div className="mask-preview">
            <div className="mask-icon">🎭</div>
            <div className="floating-elements">
              <span className="floating-icon">👑</span>
              <span className="floating-icon">⚔️</span>
              <span className="floating-icon">🎪</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero



