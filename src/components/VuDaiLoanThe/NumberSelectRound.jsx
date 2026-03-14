import React from 'react'

const NUMBERS = [1, 2, 3]

export default function NumberSelectRound({ onSelect }) {
  const handleSelect = (num) => {
    if (typeof onSelect !== 'function') return
    // Random 1 trong 3 kết quả (không phụ thuộc số chọn)
    const rand = Math.floor(Math.random() * 3)
    const tiers = ['silver', 'gold', 'mixed']
    onSelect(tiers[rand])
  }

  return (
    <div className="vdlt-number-select-wrap">
      <h3 className="vdlt-number-select-title">Chọn 1 trong 3 số</h3>
      <p className="vdlt-number-select-desc">
        Số bạn chọn sẽ quyết định vận may cho vòng lựa chọn lõi đầu tiên.
      </p>
      <div className="vdlt-number-select-options">
        {NUMBERS.map((n) => (
          <button
            key={n}
            type="button"
            className="vdlt-number-select-option"
            onClick={() => handleSelect(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
