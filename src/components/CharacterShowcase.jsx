import { motion } from 'framer-motion'
import { characterData, maskData } from '../data/tuongData'
import './CharacterShowcase.css'

function getMaskImagePath(maskId) {
  const mask = maskData.find((m) => m.id === maskId)
  if (!mask?.imagePath) return null
  try {
    return new URL(mask.imagePath, window.location.origin).href
  } catch {
    return mask.imagePath
  }
}

function getCostumeColorHex(color) {
  const map = { Đỏ: '#c41e3a', Hồng: '#d4567a', Vàng: '#d4af37' }
  return map[color] ?? '#d4af37'
}

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
          {characterData.map((character, index) => {
            const maskImage = getMaskImagePath(character.maskId)
            return (
              <motion.div
                key={character.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className={`character-card ${selectedItem?.id === character.id ? 'selected' : ''}`}
                onClick={() => setSelectedItem(character)}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="character-avatar">
                  {maskImage ? (
                    <img src={maskImage} alt={character.name} className="character-mask-img" />
                  ) : (
                    <span className="character-emoji">{character.emoji}</span>
                  )}
                </div>
                <div className="character-info">
                  <h3 className="character-name">{character.name}</h3>
                  <span className="character-type">{character.type}</span>
                  <div className="costume-preview">
                    <div
                      className="costume-color"
                      style={{ backgroundColor: getCostumeColorHex(character.costume.color) }}
                    />
                    <span className="costume-text">{character.costume.color}</span>
                  </div>
                  <p className="character-story">{character.story}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default CharacterShowcase



