import './PageTwo.css'

function PageTwo() {
  return (
    <section className="page-two">
      <div className="page-two-content">
        <h2 className="page-two-title">Khám Phá Tuồng</h2>
        <p className="page-two-subtitle">Nghệ thuật truyền thống Việt Nam</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🎭</span>
            <h3>Mặt Nạ</h3>
            <p>Khám phá ý nghĩa của các mặt nạ Tuồng</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">👤</span>
            <h3>Nhân Vật</h3>
            <p>Tìm hiểu về các nhân vật nổi tiếng</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">🎨</span>
            <h3>Trang Phục</h3>
            <p>Khám phá trang phục đặc sắc</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">🎵</span>
            <h3>Âm Nhạc</h3>
            <p>Trải nghiệm âm nhạc truyền thống</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PageTwo
