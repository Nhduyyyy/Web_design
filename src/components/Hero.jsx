import { useRef, useState, useEffect } from 'react'
import { gsap } from 'gsap'
import './Hero.css'
import ArtisticText from './ArtisticText'

function Hero() {
  const videoRef = useRef(null);
  const [showImage, setShowImage] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const spotlightsRef = useRef([]);
  const coneBeamsRef = useRef([]);
  const heroRef = useRef(null);

  useEffect(() => {
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

    return () => {
      gsap.killTweensOf(spotlightsRef.current);
      gsap.killTweensOf(coneBeamsRef.current);
    };
  }, []);

  const handleClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setTimeout(() => {
          setShowImage(true);
          setShowBackground(true);
        }, 1000);
      }
    }
  };

  return (
    <section ref={heroRef} className={`hero ${showImage ? 'show-image' : ''} ${showBackground ? 'show-background' : ''}`} onClick={handleClick}>
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
          <ArtisticText text="Văn Hóa Nghệ Thuật" variant="gold-gradient" />
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



