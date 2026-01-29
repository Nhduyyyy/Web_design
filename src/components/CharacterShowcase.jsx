import { motion } from 'framer-motion'
import { characterData } from '../data/tuongData'
import './CharacterShowcase.css'

function CharacterShowcase({ selectedItem, setSelectedItem }) {
  return (
    <section className="character-showcase">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Nhân Vật Tuồng Nổi Tiếng
        </motion.h2>
        <p className="section-subtitle">
          Khám phá trang phục và câu chuyện của các nhân vật
        </p>

        <div className="character-grid">
          {characterData.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="character-card"
              onClick={() => setSelectedItem(character)}
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="character-avatar">
                <span style={{ fontSize: '5rem' }}>{character.emoji}</span>
              </div>
              <div className="character-info">
                <h3 className="character-name">{character.name}</h3>
                <p className="character-type">{character.type}</p>
                <div className="costume-preview">
                  <div className="costume-color" style={{ backgroundColor: character.costume.color === 'Đỏ' ? '#e74c3c' : character.costume.color === 'Hồng' ? '#e91e63' : '#f1c40f' }}></div>
                  <span className="costume-text">{character.costume.color}</span>
                </div>
                <p className="character-story">{character.story}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CharacterShowcase



