import './PageThree.css'

function PageThree() {
  return (
    <section className="page-three">
      <div className="page-three-content">
        <div className="page-three-text">
          <h2 className="page-three-title">Trải Nghiệm Tuồng</h2>
          <p className="page-three-description">
            Khám phá nghệ thuật Tuồng Việt Nam qua công nghệ hiện đại. 
            Tương tác với AI, xem biểu diễn 3D, và trải nghiệm AR với mặt nạ Tuồng.
          </p>
          <button className="cta-button">Bắt Đầu Khám Phá</button>
        </div>
        
        <div className="page-three-visual">
          <div className="visual-circle">
            <span className="visual-icon">🎭</span>
            <div className="floating-particles">
              <span className="particle">✨</span>
              <span className="particle">🎨</span>
              <span className="particle">🎵</span>
              <span className="particle">👑</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PageThree
