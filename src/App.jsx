import { useState } from 'react'
import Header from './components/Header'
import CameraExperience from './components/CameraExperience'
import TuongPerformance from './components/TuongPerformance'
import ScrollProgress from './components/ScrollProgress'
import ItemDetailModal from './components/ItemDetailModal'
import LearningPage from './components/LearningPage'
import './styles/App.css'

function getItemType(item) {
  if (!item) return 'mask'
  if (item.costume != null) return 'character'
  return 'mask'
}

function App() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeSection, setActiveSection] = useState('experience')

  return (
    <div className="app">
      <ScrollProgress />
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      
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

      {activeSection === 'learning' && (
        <LearningPage />
      )}
    </div>
  )
}

export default App

