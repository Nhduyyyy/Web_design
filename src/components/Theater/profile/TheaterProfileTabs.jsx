const tabs = [
  { id: 'info', label: 'Thông tin chung', icon: 'description' },
  { id: 'legal', label: 'Pháp lý', icon: 'gavel' },
  { id: 'system', label: 'Hệ thống', icon: 'settings' },
]

const TheaterProfileTabs = ({ activeTab, onChange }) => {
  return (
    <div className="bg-surface-dark rounded-xl border border-border-gold overflow-hidden mb-6">
      <div className="flex flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 min-w-[150px] px-6 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-slate-100 hover:bg-background-dark'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TheaterProfileTabs
