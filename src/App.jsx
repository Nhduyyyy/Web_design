import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import MaskGallery from './components/MaskGallery'
import CharacterShowcase from './components/CharacterShowcase'
import AIExplainer from './components/AIExplainer'
import CameraExperience from './components/CameraExperience'
import TuongPerformance from './components/TuongPerformance'
import Viewer3D from './components/Viewer3D'
import ScrollProgress from './components/ScrollProgress'
import './styles/App.css'

function App() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeSection, setActiveSection] = useState('home')

  return (
    <div className="app">
      <ScrollProgress />
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      
      {activeSection === 'home' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Hero setActiveSection={setActiveSection} />
          <MaskGallery 
            selectedItem={selectedItem} 
            setSelectedItem={setSelectedItem}
          />
          <CharacterShowcase 
            selectedItem={selectedItem} 
            setSelectedItem={setSelectedItem}
          />
        </motion.div>
      )}

      {activeSection === 'explore' && (
        <AIExplainer selectedItem={selectedItem} />
      )}

      {activeSection === 'experience' && (
        <CameraExperience />
      )}

      {activeSection === 'watch' && (
        <TuongPerformance />
      )}

      {activeSection === '3d' && (
        <Viewer3D />
      )}
    </div>
  )
}

export default App

