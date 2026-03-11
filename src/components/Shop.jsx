import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getShopItems, getShopCategories, purchaseItem, checkAffordability } from '../services/shopService'
import { getPlayerStats } from '../services/gameService'
import { updateQuestProgress } from '../services/questService'
import './Shop.css'

const Shop = () => {
  const { user, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [shopItems, setShopItems] = useState([])
  const [categories, setCategories] = useState([])
  const [userCoins, setUserCoins] = useState(0)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)

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
      }
    } catch (error) {
      console.error('Error loading user coins:', error)
    }
  }

  const handlePurchase = async (item) => {
    if (!isAuthenticated || !user) {
      alert('Vui lòng đăng nhập để mua sản phẩm!')
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
            <p className="shop-balance-label">Your Treasury</p>
            <h1 className="shop-balance-amount">
              {userCoins.toLocaleString()} <span className="shop-balance-unit">Coin</span>
            </h1>
            <div className="shop-balance-multiplier">
              <span className="shop-multiplier-badge">
                <span className="material-symbols-outlined">trending_up</span> +150%
              </span>
              <span className="shop-multiplier-text">Season Multiplier Active</span>
            </div>
          </div>
          <button className="shop-history-btn">
            <span className="material-symbols-outlined">history</span>
            Transaction History
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
              onClick={() => setActiveTab(category.slug)}
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
            Featured Items
          </h2>
          <div className="shop-view-all">
            View Selection <span className="material-symbols-outlined">arrow_forward</span>
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
                  <div className="shop-card-footer">
                    <div className="shop-card-price">
                      <span className="material-symbols-outlined">toll</span>
                      <span>{item.price.toLocaleString()}</span>
                    </div>
                    <button
                      className="shop-card-cart-btn"
                      onClick={() => handlePurchase(item)}
                      disabled={purchasing === item.id}
                      title={purchasing === item.id ? 'Processing...' : 'Buy now'}
                    >
                      {purchasing === item.id ? (
                        <span className="material-symbols-outlined">hourglass_empty</span>
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
