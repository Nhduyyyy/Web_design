const Row = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-slate-100">{value || <span className="text-slate-500">Chưa cập nhật</span>}</p>
  </div>
)

const formatDateTime = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

const TheaterSystemSection = ({ theater }) => {
  return (
    <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Thông tin hệ thống</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <Row label="Ngày tạo hồ sơ" value={formatDateTime(theater?.created_at)} />
        <Row label="Lần cập nhật cuối" value={formatDateTime(theater?.updated_at)} />
        <Row label="Ngày được duyệt" value={formatDateTime(theater?.approved_at)} />
        <Row label="Người duyệt (ID)" value={theater?.approved_by} />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Các trường này chỉ mang tính chất hệ thống và không thể chỉnh sửa từ giao diện này.
      </p>
    </div>
  )
}

export default TheaterSystemSection

