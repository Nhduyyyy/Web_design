import './ArtisticText.css'

function ArtisticText({ text = "Văn Hóa Nghệ Thuật", variant = "gold-glow" }) {
  return (
    <h1 className={`art-text art-text-${variant}`}>
      {text}
    </h1>
  )
}

export default ArtisticText
