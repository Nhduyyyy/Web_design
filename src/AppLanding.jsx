import { useState, useEffect } from 'react'
import HeaderLanding from './components/HeaderLanding'
import Hero from './components/Hero'
import Introduction from './components/Introduction'
import MaskGallery from './components/MaskGallery'
import Features from './components/Features'
import FamousArtists from './components/FamousArtists'
import Footer from './components/Footer'
import ScrollProgress from './components/ScrollProgress'
import './styles/AppLanding.css'

function AppLanding() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeSection, setActiveSection] = useState('home')

  // Detect active section khi scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero-section', 'intro-section', 'gallery-section', 'features-section', 'artists-section']
      const scrollPosition = window.scrollY + 100 // Offset 100px từ top

      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionId = sections[i]
        const element = document.getElementById(sectionId)
        if (element) {
          const { offsetTop } = element
          if (scrollPosition >= offsetTop) {
            const sectionName = sectionId === 'hero-section' ? 'home'
              : sectionId === 'intro-section' ? 'intro'
                : sectionId === 'gallery-section' ? 'gallery'
                  : sectionId === 'features-section' ? 'features'
                    : 'artists'
            setActiveSection(sectionName)
            break
          }
        }
      }
    }

    // Gọi ngay khi mount để set active section đúng
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="app-landing">
      <ScrollProgress />
      <HeaderLanding activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Page 1: Hero */}
      <section id="hero-section" className="page-section-landing">
        <Hero setActiveSection={setActiveSection} />
      </section>

      {/* Page 2: Introduction */}
      <section id="intro-section" className="page-section-landing">
        <Introduction />
      </section>

      {/* Page 3: Mask Gallery */}
      <section id="gallery-section" className="page-section-landing">
        <MaskGallery
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
      </section>

      {/* Page 4: Features */}
      <section id="features-section" className="page-section-landing">
        <Features />
      </section>

      {/* Page 5: Famous Artists */}
      <section id="artists-section" className="page-section-landing">
        <FamousArtists />
        <Footer />
      </section>

      
    </div>
  )
}

export default AppLanding
