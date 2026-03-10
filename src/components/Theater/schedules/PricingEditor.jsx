export default function PricingEditor({ pricing, onChange }) {
  const tiers = pricing?.tiers || []

  const addTier = () => {
    onChange({
      ...pricing,
      tiers: [...tiers, { name: '', price: 0, currency: 'VND' }],
    })
  }

  const removeTier = (index) => {
    onChange({
      ...pricing,
      tiers: tiers.filter((_, i) => i !== index),
    })
  }

  const updateTier = (index, field, value) => {
    const next = tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    onChange({ ...pricing, tiers: next })
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">Cấu hình giá vé</label>
      {tiers.map((tier, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            className="flex-1 rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
            placeholder="Loại vé"
            value={tier.name}
            onChange={(e) => updateTier(index, 'name', e.target.value)}
          />
          <input
            type="number"
            className="w-28 rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
            placeholder="Giá"
            value={tier.price}
            onChange={(e) => updateTier(index, 'price', Number(e.target.value))}
          />
          <span className="text-xs text-slate-400">{tier.currency || 'VND'}</span>
          <button
            type="button"
            onClick={() => removeTier(index)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTier}
        className="text-xs font-medium text-blue-400 hover:text-blue-300"
      >
        + Thêm loại vé
      </button>
    </div>
  )
}

