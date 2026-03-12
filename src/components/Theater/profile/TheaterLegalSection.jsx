const Field = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-slate-100">{value || <span className="text-slate-500">Chưa cập nhật</span>}</p>
  </div>
)

const TheaterLegalSection = ({ theater }) => {
  return (
    <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Thông tin pháp lý</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <Field label="Số giấy phép kinh doanh" value={theater?.business_license} />
        <Field label="Mã số thuế" value={theater?.tax_code} />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Thông tin pháp lý chỉ nên được cập nhật bởi người có thẩm quyền của đơn vị.
      </p>
    </div>
  )
}

export default TheaterLegalSection

