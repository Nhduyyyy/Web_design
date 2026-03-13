import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getInventoryWithItems, getShopCategories, toggleItemEquipped } from '../services/shopService'
import { getPlayerStats } from '../services/gameService'
import './Shop.css'

const Inventory = () => {
  const { user, isAuthenticated } = useAuth()
  const [inventoryItems, setInventoryItems] = useState([])
  const [categories, setCategories] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [userCoins, setUserCoins] = useState(0)
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [togglingEquip, setTogglingEquip] = useState(null)

  useEffect(() => {
    loadData()
  }, [isAuthenticated, user])

  useEffect(() => {
    if (categories.length) {
      // Filter is applied in render from inventoryItems
    }
  }, [activeTab])

  const loadData = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [statsRes, invRes, catRes] = await Promise.all([
        getPlayerStats(user.id),
        getInventoryWithItems(user.id),
        getShopCategories()
      ])
      if (statsRes.data) {
        setUserCoins(statsRes.data.total_coins ?? 0)
        setUserRank(statsRes.data.current_rank)
      }
      if (invRes.data) setInventoryItems(invRes.data)
      if (catRes.data) setCategories(catRes.data)
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMultiplier = () => {
    if (!userRank) return 0
    const rankLevel = userRank.rank_level || 1
    return (rankLevel - 1) * 25
  }

  const handleToggleEquip = async (invRow) => {
    if (!isAuthenticated || !user || !invRow?.item_id) return
    const nextEquipped = !invRow.is_equipped
    try {
      setTogglingEquip(invRow.id)
      const { error } = await toggleItemEquipped(user.id, invRow.item_id, nextEquipped)
      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error toggling equip:', error)
      alert('Không thể thay đổi trang bị: ' + (error?.message || error))
    } finally {
      setTogglingEquip(null)
    }
  }

  const activeCategoryId = categories.find((c) => c.slug === activeTab)?.id
  const filteredItems =
    activeTab === 'all'
      ? inventoryItems
      : inventoryItems.filter(
          (row) => row.item?.category_id && row.item.category_id === activeCategoryId
        )

  return (
    <div className="shop-content">
      {/* Balance Header - same as Shop */}
      <div className="shop-balance-header">
        <div className="shop-balance-content">
          <div className="shop-balance-info">
            <p className="shop-balance-label">Kho Báu Của Bạn</p>
            <h1 className="shop-balance-amount">
              {userCoins.toLocaleString()}{' '}
              <span className="shop-balance-unit">Coin</span>
            </h1>
            <div className="shop-balance-multiplier">
              {getMultiplier() > 0 ? (
                <>
                  <span className="shop-multiplier-badge">
                    <span className="material-symbols-outlined">trending_up</span>+
                    {getMultiplier()}%
                  </span>
                  <span className="shop-multiplier-text">
                    {userRank?.rank_name || 'Rank'} Bonus Active
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="shop-multiplier-badge"
                    style={{ opacity: 0.5 }}
                  >
                    <span className="material-symbols-outlined">info</span> 0%
                  </span>
                  <span className="shop-multiplier-text">
                    Tăng rank để nhận bonus
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="shop-balance-decoration">
          <span className="material-symbols-outlined">stars</span>
        </div>
      </div>

      {/* Tabs by category - same as Shop */}
      {categories.length > 0 && (
        <div className="shop-tabs-container">
          <div className="shop-tabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`shop-tab ${activeTab === cat.slug ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.slug)}
              >
                <span className="material-symbols-outlined">{cat.icon || 'category'}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inventory grid */}
      <div className="shop-rewards-section">
        <div className="shop-section-header">
          <h2 className="shop-section-title">
            <span className="material-symbols-outlined">inventory_2</span>
            Vật Phẩm Của Bạn
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <p>Đang tải kho đồ...</p>
          </div>
        ) : !isAuthenticated || !user ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <p>Vui lòng đăng nhập để xem kho vật phẩm.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <p>Bạn chưa có vật phẩm nào. Hãy ghé Cửa Hàng để mua!</p>
          </div>
        ) : (
          <div className="shop-rewards-grid">
            {filteredItems.map((row) => {
              const item = row.item
              if (!item) return null
              return (
                <div key={row.id} className="shop-reward-card">
                  <div className="shop-card-image">
                    {item.badge && (
                      <div className="shop-card-badge-container">
                        <span
                          className={`shop-card-badge ${item.badge_color || 'primary'}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                    )}
                    {row.is_equipped && (
                      <div className="shop-card-badge-container" style={{ top: 'auto', bottom: '0.5rem', left: '0.5rem' }}>
                        <span className="shop-card-badge" style={{ background: '#16a34a' }}>
                          Đang trang bị
                        </span>
                      </div>
                    )}
                    <div
                      className="shop-card-image-bg"
                      style={{
                        backgroundImage: item.image_url
                          ? `url('${item.image_url}')`
                          : 'none',
                        backgroundColor: item.image_url ? undefined : 'rgba(0,0,0,0.3)'
                      }}
                    />
                    <div className="shop-card-gradient" />
                  </div>
                  <div className="shop-card-content">
                    <h3 className="shop-card-title">{item.name}</h3>
                    <p className="shop-card-description">{item.description}</p>
                    <div className="shop-card-stock">
                      <span className="shop-stock-available">
                        Số lượng: {row.quantity}
                      </span>
                    </div>
                    <div className="shop-card-footer">
                      <div className="shop-card-price">
                        <span className="material-symbols-outlined">inventory_2</span>
                        <span>{row.quantity}</span>
                      </div>
                      <button
                        type="button"
                        className="shop-card-cart-btn"
                        onClick={() => handleToggleEquip(row)}
                        disabled={togglingEquip === row.id}
                        title={row.is_equipped ? 'Gỡ trang bị' : 'Trang bị'}
                      >
                        {togglingEquip === row.id ? (
                          <span className="material-symbols-outlined">hourglass_empty</span>
                        ) : row.is_equipped ? (
                          <span className="material-symbols-outlined">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined">add_circle_outline</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer className="shop-footer">
        <div className="shop-footer-content">
          <div className="shop-footer-info">
            <p className="shop-footer-text">
              Vật phẩm đã mua được lưu tại đây. Trang bị để sử dụng trong game.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Inventory
