const InfoRow = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-slate-100">{value || <span className="text-slate-500">Chưa cập nhật</span>}</p>
  </div>
)

const TheaterInfoSection = ({ theater }) => {
  return (
    <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Thông tin chung</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoRow label="Tên nhà hát" value={theater?.name} />
          <InfoRow label="Mô tả" value={theater?.description} />
          <InfoRow label="Địa chỉ" value={theater?.address} />
          <InfoRow label="Thành phố" value={theater?.city} />
        </div>
        <div className="space-y-4">
          <InfoRow label="Số điện thoại" value={theater?.phone} />
          <InfoRow label="Email liên hệ" value={theater?.email} />
          <InfoRow label="Website" value={theater?.website} />
          <InfoRow label="Tổng sức chứa" value={theater?.capacity ? `${theater.capacity} ghế` : null} />
        </div>
      </div>
    </div>
  )
}

export default TheaterInfoSection

