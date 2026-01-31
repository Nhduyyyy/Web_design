import './AboutPage.css'

const CARDS = [
  {
    icon: 'history_edu',
    ornament: 'flare',
    title: 'Lịch sử hình thành',
    description: 'Tuồng là loại hình nghệ thuật sân khấu cổ truyền của Việt Nam, xuất hiện từ thế kỷ 17. Phát triển cực thịnh dưới triều Nguyễn, Tuồng trở thành quốc kịch với những chuẩn mực khắt khe về biểu diễn.',
    cta: 'Tìm hiểu thêm',
  },
  {
    icon: 'theater_comedy',
    ornament: 'stars',
    title: 'Đặc điểm nghệ thuật',
    description: 'Nghệ thuật Tuồng mang tính ước lệ và tượng trưng cao. Từ cử chỉ chân tay đến cách di chuyển trên sân khấu đều được cách điệu hóa để biểu đạt nội tâm và tính cách nhân vật một cách mãnh liệt.',
    cta: 'Xem chi tiết',
  },
  {
    icon: 'mask',
    ornament: 'brush',
    title: 'Nghệ thuật Hóa trang',
    description: 'Mặt nạ Tuồng là một ngôn ngữ hội họa độc đáo. Màu sắc và đường nét trên khuôn mặt thể hiện trung, nịnh, thiện, ác rõ rệt. Đỏ của sự trung trinh, đen của sự nóng nảy, trắng của kẻ gian hùng.',
    cta: 'Khám phá mẫu mặt nạ',
  },
  {
    icon: 'library_music',
    ornament: 'music_note',
    title: 'Âm nhạc & Nhịp phách',
    description: 'Dàn nhạc Tuồng với tiếng trống chiến, tiếng kèn bóp và đàn nhị tạo nên không khí bi tráng. Nhịp trống không chỉ giữ nhịp mà còn là linh hồn điều khiển mọi diễn biến trên sân khấu.',
    cta: 'Nghe tư liệu',
  },
  {
    icon: 'auto_stories',
    ornament: 'book',
    title: 'Tác phẩm Kinh điển',
    description: 'Những vở Tuồng đồ sộ như "Sơn Hậu", "Tam nữ đồ vương" hay "Đào Tam Xuân" là kho tàng kịch bản đồ sộ, chứa đựng những triết lý nhân sinh sâu sắc và lòng yêu nước nồng nàn.',
    cta: 'Đọc tóm tắt',
  },
  {
    icon: 'language',
    ornament: 'public',
    title: 'Bảo tồn Di sản',
    description: 'Trong dòng chảy hiện đại, nghệ thuật Tuồng đang được nỗ lực bảo tồn và làm mới để tiếp cận khán giả trẻ, giữ vững vị thế là viên ngọc quý trong di sản văn hóa phi vật thể của nhân loại.',
    cta: 'Chương trình bảo tồn',
  },
]

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-page-inner">
        <header className="about-header">
          <div className="about-header-line" aria-hidden="true" />
          <h1 className="about-title gold-gradient-text">
            Về Nghệ Thuật Tuồng
          </h1>
          <p className="about-intro">
            Khám phá chiều sâu di sản sân khấu cổ truyền nghìn năm của dân tộc Việt Nam qua những hiện vật và câu chuyện lịch sử.
          </p>
        </header>

        <div className="about-grid">
          {CARDS.map((card) => (
            <article key={card.title} className="about-card premium-card">
              <div className="about-card-icon-wrap">
                <span className="material-symbols-outlined about-card-icon" aria-hidden>
                  {card.icon}
                </span>
              </div>
              <h3 className="about-card-title">{card.title}</h3>
              <p className="about-card-desc">{card.description}</p>
              <div className="about-card-cta">
                {card.cta}
                <span className="material-symbols-outlined about-card-cta-icon" aria-hidden>
                  arrow_forward
                </span>
              </div>
              <div className="about-card-ornament" aria-hidden>
                <span className="material-symbols-outlined">{card.ornament}</span>
              </div>
            </article>
          ))}
        </div>

        <footer className="about-footer">
          <div className="about-footer-deco">
            <span className="about-footer-line" />
            <span className="material-symbols-outlined about-footer-icon">potted_plant</span>
            <span className="about-footer-line" />
          </div>
          <p className="about-footer-copy">
            Vietnamese Traditional Opera Heritage Center © 2024
          </p>
        </footer>
      </div>
    </div>
  )
}
