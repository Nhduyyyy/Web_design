import React from 'react'
import ChampionCard from './ChampionCard'
import { ITEM_COMPONENTS } from './constants/items'
import { getTribeByKey } from './constants/tribes'
import { getClassByKey } from './constants/classes'

const getItemName = (itemKeyOrItem) => {
  const key = typeof itemKeyOrItem === 'string' ? itemKeyOrItem : itemKeyOrItem?.key
  const item = ITEM_COMPONENTS.find((i) => i.key === key)
  return item?.name ?? key ?? '?'
}

export default function CarouselRound({ options = [], championsMap = {}, onSelect }) {
  return (
    <div className="vdlt-carousel-wrap">
      <h3 className="vdlt-carousel-title">Carousel – Chọn 1 tướng + item</h3>
      <div className="vdlt-carousel-options">
        {options.map((opt, i) => {
          const champion = opt?.champion_key ? championsMap[opt.champion_key] : null
          const itemName = getItemName(opt?.itemKey)
          if (!champion) return null
          const tribe = getTribeByKey(champion.tribe_key)
          const cls = getClassByKey(champion.class_key)
          return (
            <button
              key={`${opt.champion_key}-${i}`}
              type="button"
              className="vdlt-carousel-option"
              onClick={() => onSelect?.(i)}
            >
              <ChampionCard
                champion={champion}
                star={1}
                maskColor={champion.default_mask_color}
                tribeName={tribe?.name}
                classRole={cls?.name}
              />
              <span className="vdlt-carousel-item">{itemName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
