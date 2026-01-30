import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import MaskGallery from './components/MaskGallery'
import CharacterShowcase from './components/CharacterShowcase'
import CameraExperience from './components/CameraExperience'
import TuongPerformance from './components/TuongPerformance'
import ScrollProgress from './components/ScrollProgress'
import ItemDetailModal from './components/ItemDetailModal'
import './styles/App.css'

function getItemType(item) {
  if (!item) return 'mask'
  if (item.costume != null) return 'character'
  return 'mask'
}

function App() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeSection, setActiveSection] = useState('home')

  return (
    <div className="app">
      <ScrollProgress />
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      
      {activeSection === 'home' && (
        <motion.div
          className="home-layout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Hero setActiveSection={setActiveSection} />
          <section id="mask-gallery" className="home-section">
            <MaskGallery
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
            />
          </section>
          <section className="home-section home-section-characters">
            <CharacterShowcase
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
            />
          </section>
        </motion.div>
      )}

      {activeSection === 'experience' && (
        <CameraExperience />
      )}

      {activeSection === 'watch' && (
        <TuongPerformance setActiveSection={setActiveSection} />
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          type={getItemType(selectedItem)}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}

export default App

