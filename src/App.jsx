import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import CameraExperience from './components/CameraExperience'
import TuongPerformance from './components/TuongPerformance'
import ScrollProgress from './components/ScrollProgress'
import ItemDetailModal from './components/ItemDetailModal'
import LearningPage from './components/LearningPage'
import AboutPage from './components/AboutPage'
import ProfilePage from './components/Profile/ProfilePage'
import ChatDemo from './components/ChatDemo'
import PromotionBanner from './components/PromotionBanner'
import './styles/App.css'

const sectionTransition = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
}

function getItemType(item) {
  if (!item) return 'mask'
  if (item.costume != null) return 'character'
  return 'mask'
}

function App() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeSection, setActiveSection] = useState(
    () => searchParams.get('section') || 'experience'
  )

  useEffect(() => {
    const next = searchParams.get('section') || 'experience'
    setActiveSection((prev) => (prev === next ? prev : next))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    const current = searchParams.get('section') || 'experience'
    if (current !== activeSection) {
      setSearchParams({ section: activeSection }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  return (
    <div className="app">
      <ScrollProgress />
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <AnimatePresence mode="wait">
        {activeSection === 'experience' && (
          <motion.div
            key="experience"
            className="app-section-wrap"
            {...sectionTransition}
          >
            <CameraExperience />
          </motion.div>
        )}
        {activeSection === 'watch' && (
          <motion.div
            key="watch"
            className="app-section-wrap"
            {...sectionTransition}
          >
            <TuongPerformance setActiveSection={setActiveSection} />
          </motion.div>
        )}
        {activeSection === 'tryRole' && (
          <motion.div
            key="tryRole"
            className="app-section-wrap"
            {...sectionTransition}
          >
            <AboutPage />
          </motion.div>
        )}
        {activeSection === 'profile' && (
          <motion.div
            key="profile"
            className="app-section-wrap"
            {...sectionTransition}
          >
            <ProfilePage 
              setActiveSection={setActiveSection}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          type={getItemType(selectedItem)}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {activeSection === 'learning' && (
        <LearningPage />
      )}

      <ChatDemo />
      
      {/* Promotion Banner - Tự động hiện/ẩn */}
      <PromotionBanner />
    </div>
  )
}

export default App

