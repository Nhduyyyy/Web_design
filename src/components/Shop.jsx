import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getShopItems, getShopCategories, purchaseItem, checkAffordability, getTransactionHistory } from '../services/shopService'
import { getPlayerStats } from '../services/gameService'
import { updateQuestProgress } from '../services/questService'
import './Shop.css'

const Shop = () => {
  const { user, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [allShopItems, setAllShopItems] = useState([]) // Cache tất cả items
  const [shopItems, setShopItems] = useState([])
  const [categories, setCategories] = useState([])
  const [userCoins, setUserCoins] = useState(0)
  const [userRank, setUserRank] = useState(null) // Thêm state cho rank
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Load shop data on mount
  useEffect(() => {
    loadShopData()
    if (isAuthenticated && user) {
      loadUserCoins()
    }
  }, [isAuthenticated, user])

  // Reload items when tab changes
  useEffect(() => {
    loadShopItems(activeTab)
  }, [activeTab])

  const loadShopData = async () => {
    try {
      setLoading(true)
      
      // Load categories
      const { data: categoriesData } = await getShopCategories()
      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Load initial items
      await loadShopItems('all')
    } catch (error) {
      console.error('Error loading shop data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadShopItems = async (categorySlug) => {
    try {
      const { data, error } = await getShopItems(categorySlug)
      if (error) throw error
      
      if (data) {
        setShopItems(data)
      }
    } catch (error) {
      console.error('Error loading shop items:', error)
    }
  }

  const loadUserCoins = async () => {
    try {
      const { data } = await getPlayerStats(user.id)
      if (data) {
        setUserCoins(data.total_coins || 0)
        setUserRank(data.current_rank) // Lưu rank info
      }
    } catch (error) {
      console.error('Error loading user coins:', error)
    }
  }

  // Tính multiplier dựa trên rank level
  const getMultiplier = () => {
    if (!userRank) return 0
    
    const rankLevel = userRank.rank_level || 1
    // Công thức: mỗi rank level tăng 25%
    // Rank 1 (Newbie): 0%
    // Rank 2 (Bronze): 25%
    // Rank 3 (Silver): 50%
    // Rank 4 (Gold): 75%
    // Rank 5 (Platinum): 100%
    // Rank 6 (Diamond): 125%
    // Rank 7 (Master): 150%
    // Rank 8 (Tuồng Master): 175%
    return (rankLevel - 1) * 25
  }

  const isOutOfStock = (item) => {
    return item.stock_quantity != null && item.stock_quantity <= 0
  }

  const openHistoryModal = async () => {
    if (!isAuthenticated || !user) {
      alert('Vui lòng đăng nhập để xem lịch sử giao dịch.')
      return
    }
    setShowHistoryModal(true)
    setHistoryLoading(true)
    try {
      const { data, error } = await getTransactionHistory(user.id, 50)
      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transaction history:', error)
      setTransactions([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handlePurchase = async (item) => {
    if (!isAuthenticated || !user) {
      alert('Vui lòng đăng nhập để mua sản phẩm!')
      return
    }

    if (isOutOfStock(item)) {
      alert('Sản phẩm đã hết hàng.')
      return
    }

    // Check affordability
    const { canAfford } = await checkAffordability(user.id, item.price)
    if (!canAfford) {
      alert(`Không đủ coin! Bạn cần ${item.price} coin nhưng chỉ có ${userCoins} coin.`)
      return
    }

    if (!confirm(`Bạn có chắc muốn mua "${item.name}" với giá ${item.price.toLocaleString()} coin?`)) {
      return
    }

    try {
      setPurchasing(item.id)
      
      const { data, error } = await purchaseItem(user.id, item.id, 1)
      
      if (error) throw error

      if (data && data.success) {
        alert(`Mua thành công "${item.name}"!\nCoin còn lại: ${data.remaining_coins.toLocaleString()}`)
        
        // Update user coins
        setUserCoins(data.remaining_coins)
        
        // Cập nhật quest progress: Mua 1 vật phẩm
        await updateQuestProgress(user.id, 'buy_1_item', 1)
        
        // Reload items to update stock
        await loadShopItems(activeTab)
      } else {
        alert('Lỗi: ' + (data?.error || 'Không thể mua sản phẩm'))
      }
    } catch (error) {
      console.error('Error purchasing item:', error)
      alert('Lỗi: ' + error.message)
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div className="shop-content">
      {/* Point Balance Header */}
      <div className="shop-balance-header">
        <div className="shop-balance-content">
          <div className="shop-balance-info">
            <p className="shop-balance-label">Kho Báu Của Bạn</p>
            <h1 className="shop-balance-amount">
              {userCoins.toLocaleString()} <span className="shop-balance-unit">Coin</span>
            </h1>
            <div className="shop-balance-multiplier">
              {getMultiplier() > 0 ? (
                <>
                  <span className="shop-multiplier-badge">
                    <span className="material-symbols-outlined">trending_up</span> +{getMultiplier()}%
                  </span>
                  <span className="shop-multiplier-text">
                    {userRank?.rank_name || 'Rank'} Bonus Active
                  </span>
                </>
              ) : (
                <>
                  <span className="shop-multiplier-badge" style={{ opacity: 0.5 }}>
                    <span className="material-symbols-outlined">info</span> 0%
                  </span>
                  <span className="shop-multiplier-text">
                    Tăng rank để nhận bonus
                  </span>
                </>
              )}
            </div>
          </div>
          <button type="button" className="shop-history-btn" onClick={openHistoryModal}>
            <span className="material-symbols-outlined">history</span>
            Lịch Sử Giao Dịch
          </button>
        </div>
        <div className="shop-balance-decoration">
          <span className="material-symbols-outlined">stars</span>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="shop-tabs-container">
        <div className="shop-tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`shop-tab ${activeTab === category.slug ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(category.slug)
                loadShopItems(category.slug)
              }}
            >
              <span className="material-symbols-outlined">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="shop-rewards-section">
        <div className="shop-section-header">
          <h2 className="shop-section-title">
            <span className="material-symbols-outlined">auto_stories</span>
            Vật Phẩm Nổi Bật
          </h2>
          <div className="shop-view-all">
            Xem Tất Cả <span className="material-symbols-outlined">arrow_forward</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <p>Loading shop items...</p>
          </div>
        ) : shopItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <p>No items available in this category.</p>
          </div>
        ) : (
          <div className="shop-rewards-grid">
            {shopItems.map((item) => (
              <div key={item.id} className="shop-reward-card">
                <div className="shop-card-image">
                  {item.badge && (
                    <div className="shop-card-badge-container">
                      <span className={`shop-card-badge ${item.badge_color || 'primary'}`}>
                        {item.badge}
                      </span>
                    </div>
                  )}
                  <div
                    className="shop-card-image-bg"
                    style={{ backgroundImage: `url('${item.image_url}')` }}
                  ></div>
                  <div className="shop-card-gradient"></div>
                </div>
                <div className="shop-card-content">
                  <h3 className="shop-card-title">{item.name}</h3>
                  <p className="shop-card-description">{item.description}</p>
                  <div className="shop-card-stock">
                    {item.stock_quantity != null ? (
                      item.stock_quantity <= 0 ? (
                        <span className="shop-stock-out">Hết hàng</span>
                      ) : (
                        <span className="shop-stock-available">Còn {item.stock_quantity}</span>
                      )
                    ) : (
                      <span className="shop-stock-unlimited">Không giới hạn</span>
                    )}
                  </div>
                  <div className="shop-card-footer">
                    <div className="shop-card-price">
                      <span className="material-symbols-outlined">toll</span>
                      <span>{item.price.toLocaleString()}</span>
                    </div>
                    <button
                      className="shop-card-cart-btn"
                      onClick={() => handlePurchase(item)}
                      disabled={purchasing === item.id || isOutOfStock(item)}
                      title={
                        isOutOfStock(item)
                          ? 'Hết hàng'
                          : purchasing === item.id
                            ? 'Đang xử lý...'
                            : 'Mua ngay'
                      }
                    >
                      {purchasing === item.id ? (
                        <span className="material-symbols-outlined">hourglass_empty</span>
                      ) : isOutOfStock(item) ? (
                        <span className="material-symbols-outlined">block</span>
                      ) : (
                        <span className="material-symbols-outlined">shopping_cart</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History Modal */}
      {showHistoryModal && (
        <div className="shop-history-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="shop-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shop-history-modal-header">
              <h2 className="shop-history-modal-title">
                <span className="material-symbols-outlined">history</span>
                Lịch Sử Giao Dịch
              </h2>
              <button
                type="button"
                className="shop-history-modal-close"
                onClick={() => setShowHistoryModal(false)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="shop-history-modal-body">
              {historyLoading ? (
                <div className="shop-history-loading">
                  <span className="material-symbols-outlined">hourglass_empty</span>
                  <p>Đang tải...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="shop-history-empty">
                  <span className="material-symbols-outlined">receipt_long</span>
                  <p>Chưa có giao dịch nào.</p>
                </div>
              ) : (
                <ul className="shop-history-list">
                  {transactions.map((tx) => (
                    <li key={tx.id} className="shop-history-item">
                      <div
                        className="shop-history-item-image"
                        style={{ backgroundImage: tx.item?.image_url ? `url('${tx.item.image_url}')` : 'none' }}
                      />
                      <div className="shop-history-item-info">
                        <span className="shop-history-item-name">{tx.item?.name || 'Vật phẩm'}</span>
                        <span className="shop-history-item-meta">
                          x{tx.quantity} · {new Date(tx.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="shop-history-item-price">
                        -{tx.price_paid?.toLocaleString() ?? 0} <span className="shop-history-coin">Coin</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="shop-footer">
        <div className="shop-footer-content">
          <div className="shop-footer-info">
            <p className="shop-footer-text">
              Points earned this season reset in <span className="shop-footer-highlight">14 days</span>
            </p>
            <p className="shop-footer-subtext">Unused XP points will be converted to legacy coins.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Shop
