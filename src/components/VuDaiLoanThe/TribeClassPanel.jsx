import React, { useState } from 'react'
import { TRIBES } from './constants/tribes'
import { CLASSES } from './constants/classes'
import { CHAMPIONS_STATIC } from '../../data/vuDaiLoanTheChampions'

function getChampionsByTribe(tribeKey) {
  return CHAMPIONS_STATIC
    .filter((c) => c.tribe_key === tribeKey)
    .sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0))
}

function getChampionsByClass(classKey) {
  return CHAMPIONS_STATIC
    .filter((c) => c.class_key === classKey)
    .sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0))
}

export default function TribeClassPanel({ boardState = [], championsMap }) {
  const [hoveredTribe, setHoveredTribe] = useState(null)
  const [hoveredClass, setHoveredClass] = useState(null)

  const boardChampKeys = boardState.map((u) => u.champion_key).filter(Boolean)
  const tribeCount = {}
  const classCount = {}
  boardChampKeys.forEach((key) => {
    const c = CHAMPIONS_STATIC.find((x) => x.key === key)
    if (c?.tribe_key) tribeCount[c.tribe_key] = (tribeCount[c.tribe_key] || 0) + 1
    if (c?.class_key) classCount[c.class_key] = (classCount[c.class_key] || 0) + 1
  })

  const tribesOnBoard = TRIBES.filter((t) => tribeCount[t.key] > 0)
  const classesOnBoard = CLASSES.filter((c) => classCount[c.key] > 0)
  const hasChampionsOnBoard = boardChampKeys.length > 0

  return (
    <div className="vdlt-tribe-class-panel">
      <h3 className="vdlt-panel-title">
        <span className="material-symbols-outlined">menu_book</span>
        Tộc & Hệ đang kích hoạt
      </h3>

      {!hasChampionsOnBoard ? (
        <p className="vdlt-tribe-class-empty">
          Kéo tướng lên sân khấu để xem tộc & hệ đang kích hoạt.
        </p>
      ) : (
        <>
          <section className="vdlt-panel-section">
            <h4>Tộc trên sân ({boardChampKeys.length} tướng)</h4>
            <ul className="vdlt-tribe-list">
              {tribesOnBoard.map((t) => (
                <li
                  key={t.key}
                  className="vdlt-tribe-item vdlt-hoverable"
                  style={{ borderLeftColor: t.color_hex }}
                  onMouseEnter={() => setHoveredTribe(t.key)}
                  onMouseLeave={() => setHoveredTribe(null)}
                >
                  <span className="vdlt-tribe-name">{t.name}</span>
                  <span className="vdlt-tribe-count">×{tribeCount[t.key]} trên sân</span>
                  <p className="vdlt-tribe-mechanic">{t.mechanic_description}</p>
                  {hoveredTribe === t.key && (
                    <div className="vdlt-champ-tooltip" role="tooltip">
                      <strong>Các tướng {t.name}:</strong>
                      <ul>
                        {getChampionsByTribe(t.key).map((ch) => (
                          <li key={ch.key}>{ch.name} ({ch.cost} vàng)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="vdlt-panel-section">
            <h4>Hệ trên sân</h4>
            <ul className="vdlt-class-list">
              {classesOnBoard.map((c) => (
                <li
                  key={c.key}
                  className="vdlt-class-item vdlt-hoverable"
                  onMouseEnter={() => setHoveredClass(c.key)}
                  onMouseLeave={() => setHoveredClass(null)}
                >
                  <span className="vdlt-class-name">{c.name}</span>
                  <span className="vdlt-class-role">{c.role}</span>
                  <span className="vdlt-class-count">×{classCount[c.key]}</span>
                  {hoveredClass === c.key && (
                    <div className="vdlt-champ-tooltip" role="tooltip">
                      <strong>Các tướng hệ {c.name}:</strong>
                      <ul>
                        {getChampionsByClass(c.key).map((ch) => (
                          <li key={ch.key}>{ch.name} ({ch.cost} vàng)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="vdlt-panel-section vdlt-mask-legend">
        <h4>Hóa Trang</h4>
        <ul className="vdlt-mask-list">
          <li><span className="vdlt-mask-dot mask-red" /> Đỏ: +Sát thương</li>
          <li><span className="vdlt-mask-dot mask-black" /> Đen: +Chống chịu</li>
          <li><span className="vdlt-mask-dot mask-white" /> Trắng: +Hiệu ứng</li>
          <li><span className="vdlt-mask-dot mask-blue" /> Xanh: Sát thủ</li>
        </ul>
      </section>
    </div>
  )
}
