import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { gsap } from 'gsap'
import './Hero.css'
import ArtisticText from './ArtisticText'
import logoMoMan from '../img/logo_mo_man.png'

function Hero() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const videoRef = useRef(null);
  const [showImage, setShowImage] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const spotlightsRef = useRef([]);
  const coneBeamsRef = useRef([]);
  const heroRef = useRef(null);

  useEffect(() => {
    // Delay 1s trước khi spotlight xuất hiện
    const spotlightTimer = setTimeout(() => {
      // Giảm số lượng spotlight và tối ưu animation
      const zones = [
        { xMin: -300, xMax: 300, yMin: -200, yMax: 200 },
        { xMin: -250, xMax: 350, yMin: -150, yMax: 250 },
        { xMin: -350, xMax: 250, yMin: -250, yMax: 150 }
      ];
      
      spotlightsRef.current.forEach((spotlight, index) => {
        if (!spotlight) return;
        
        const zone = zones[index];
        const delay = index * 0.3;
        
        // Fade in spotlight
        gsap.fromTo(spotlight, 
          { opacity: 0 },
          { opacity: 0.7, duration: 0.8, ease: "power2.out" }
        );
        
        // Animation di chuyển - tối ưu với duration dài hơn
        const moveAnimation = () => {
          gsap.to(spotlight, {
            x: gsap.utils.random(zone.xMin, zone.xMax),
            y: gsap.utils.random(zone.yMin, zone.yMax),
            duration: gsap.utils.random(2, 3.5),
            ease: "power1.inOut",
            onComplete: moveAnimation
          });
        };
        
        gsap.delayedCall(delay, moveAnimation);
        
        // Chỉ giữ opacity animation, bỏ scale
        gsap.to(spotlight, {
          opacity: gsap.utils.random(0.6, 0.9),
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
        });
      });

      // Tối ưu cone beam - chỉ opacity
      coneBeamsRef.current.forEach((beam) => {
        if (!beam) return;
        
        gsap.to(beam, {
          opacity: 0.6,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
        });
      });
    }, 1000); // Delay 1 giây

    return () => {
      clearTimeout(spotlightTimer);
      gsap.killTweensOf(spotlightsRef.current);
      gsap.killTweensOf(coneBeamsRef.current);
    };
  }, []);

  const handleKhaiTuong = (e) => {
    e.stopPropagation(); // Ngăn event bubble lên section
    setShowIntro(false);
    if (videoRef.current) {
      videoRef.current.play();
      setHasClicked(true);
      setTimeout(() => {
        setShowImage(true);
        setShowBackground(true);
      }, 1000);
    }
  };

  return (
    <section ref={heroRef} className={`hero ${showImage ? 'show-image' : ''} ${showBackground ? 'show-background' : ''}`}>
      {/* Logo và Button Intro */}
      {showIntro && (
        <div className="intro-overlay">
          <img src={logoMoMan} alt="Logo Tuồng Opera" className="intro-logo" />
          <button className="khai-tuong-btn" onClick={handleKhaiTuong}>
            Khai tuồng!
          </button>
        </div>
      )}
      {/* Cone Beams - Ánh đèn hình nón từ trên xuống - ĐỨNG YÊN Ở GIỮA */}
      <div className="cone-beams-container">
        <div
          ref={el => coneBeamsRef.current[0] = el}
          className="cone-beam cone-beam-center"
        />
      </div>

      {/* Spotlights - Giảm từ 5 xuống 3 */}
      <div className="spotlights-container">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            ref={el => spotlightsRef.current[i] = el}
            className="spotlight"
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + (i % 2) * 30}%`
            }}
          />
        ))}
      </div>

      {/* Artistic Text - Giữa màn hình (z-index: 2.5) */}
      {showImage && (
        <div className="hero-text-container">
          <div className="hero-text-wrapper">
            <div className="hero-subtitle">GÌN GIỮ DI SẢN</div>
            <ArtisticText text="Văn Hóa Nghệ Thuật" variant="gold-gradient" />
            <p className="hero-description">
              "Khám phá vẻ đẹp truyền thống của nghệ thuật Tuồng Việt Nam – Nơi tinh hoa hội tụ qua từng giai điệu, mặt nạ và điệu bộ điêu luyện."
            </p>
            <div className="hero-buttons">
              <button 
                className="hero-btn hero-btn-primary"
                onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
              >
                {isAuthenticated ? 'KHÁM PHÁ NGAY' : 'ĐĂNG NHẬP'}
              </button>
              <button 
                className="hero-btn hero-btn-secondary"
                onClick={() => navigate('/kiem-lua-phaser')}
              >
                Giải Trí
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background - Đặt sau ảnh giữa (z-index: 3) */}
      <div className="hero-background"></div>

      <video
        ref={videoRef}
        className="hero-video"
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        poster=""
      >
        <source src="/src/img/Untitled video - Made with Clipchamp (2).mp4" type="video/mp4" />
      </video>
    </section>
  )
}

export default Hero



