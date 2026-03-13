import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import ShopItemModal from './ShopItemModal'
import './GameManagement.css'

const PAGE_SIZE = 10

function GameManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalGames: 0,
    totalCoins: 0,
    activeToday: 0
  })
  const [shopItems, setShopItems] = useState([])
  const [categories, setCategories] = useState([])
  const [recentGames, setRecentGames] = useState([])
  const [topPlayers, setTopPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // Pagination: page (1-based) and total count per tab
  const [shopPage, setShopPage] = useState(1)
  const [shopTotalCount, setShopTotalCount] = useState(0)
  const [playersPage, setPlayersPage] = useState(1)
  const [playersTotalCount, setPlayersTotalCount] = useState(0)
  const [gamesPage, setGamesPage] = useState(1)
  const [gamesTotalCount, setGamesTotalCount] = useState(0)

  useEffect(() => {
    loadGameData()
  }, [])

  const loadGameData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadStats(),
        loadCategories(),
        loadShopItems(1),
        loadRecentGames(1),
        loadTopPlayers(1)
      ])
      setShopPage(1)
      setPlayersPage(1)
      setGamesPage(1)
    } catch (error) {
      console.error('Error loading game data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Total players
      const { count: playersCount } = await supabase
        .from('player_game_stats')
        .select('*', { count: 'exact', head: true })

      // Total games
      const { count: gamesCount } = await supabase
        .from('game_history')
        .select('*', { count: 'exact', head: true })

      // Total coins distributed
      const { data: coinsData } = await supabase
        .from('player_game_stats')
        .select('total_coins')

      const totalCoins = coinsData?.reduce((sum, p) => sum + (p.total_coins || 0), 0) || 0

      // Active today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: activeCount } = await supabase
        .from('game_history')
        .select('*', { count: 'exact', head: true })
        .gte('played_at', today.toISOString())

      setStats({
        totalPlayers: playersCount || 0,
        totalGames: gamesCount || 0,
        totalCoins: totalCoins,
        activeToday: activeCount || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadShopItems = async (page = 1) => {
    try {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error, count } = await supabase
        .from('shop_items')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      setShopItems(data || [])
      setShopTotalCount(count ?? 0)
      setShopPage(page)
    } catch (error) {
      console.error('Error loading shop items:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadRecentGames = async (page = 1) => {
    try {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error, count } = await supabase
        .from('game_history')
        .select(`
          id,
          user_id,
          score,
          coins_earned,
          masks_hit,
          total_rounds,
          accuracy_percentage,
          game_duration_seconds,
          rank_at_time,
          played_at,
          created_at
        `, { count: 'exact' })
        .order('played_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('[GameManagement] Lỗi khi lấy lịch sử game:', error.message, error)
        throw error
      }

      setGamesTotalCount(count ?? 0)
      setGamesPage(page)

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(g => g.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        const enrichedData = data.map(game => ({
          ...game,
          player: profiles?.find(p => p.id === game.user_id)
        }))
        setRecentGames(enrichedData)
      } else {
        setRecentGames([])
      }
    } catch (error) {
      console.error('[GameManagement] Lỗi load recent games:', error?.message || error)
      setRecentGames([])
    }
  }

  const loadTopPlayers = async (page = 1) => {
    try {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error, count } = await supabase
        .from('player_game_stats')
        .select('*', { count: 'exact' })
        .order('total_coins', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Error loading top players:', error)
        throw error
      }

      setPlayersTotalCount(count ?? 0)
      setPlayersPage(page)

      if (data && data.length > 0) {
        const userIds = data.map(p => p.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds)

        const rankIds = data.map(p => p.current_rank_id).filter(Boolean)
        const { data: ranks } = await supabase
          .from('game_ranks')
          .select('id, rank_name, rank_color, rank_icon')
          .in('id', rankIds)

        const enrichedData = data.map(player => ({
          ...player,
          profile: profiles?.find(p => p.id === player.user_id),
          current_rank: ranks?.find(r => r.id === player.current_rank_id)
        }))
        setTopPlayers(enrichedData)
      } else {
        setTopPlayers([])
      }
    } catch (error) {
      console.error('Error loading top players:', error)
      setTopPlayers([])
    }
  }

  const toggleItemActive = async (itemId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('shop_items')
        .update({ is_active: !currentStatus })
        .eq('id', itemId)

      if (error) throw error
      
      await loadShopItems(shopPage)
      alert('Item status updated successfully!')
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Error updating item: ' + error.message)
    }
  }

  const deleteShopItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('shop_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      
      await loadShopItems(shopPage)
      alert('Item deleted successfully!')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item: ' + error.message)
    }
  }

  const handleAddItem = () => {
    setEditingItem(null)
    setShowItemModal(true)
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setShowItemModal(true)
  }

  const handleSaveItem = async () => {
    await loadShopItems(shopPage)
  }

  const handleCloseModal = () => {
    setShowItemModal(false)
    setEditingItem(null)
  }

  const totalPages = (total) => Math.max(1, Math.ceil(total / PAGE_SIZE))
  const renderPagination = (currentPage, total, loadPage) => {
    const totalP = totalPages(total)
    return (
      <div className="gm-pagination">
        <button
          type="button"
          className="gm-pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => loadPage(currentPage - 1)}
        >
          <span className="material-symbols-outlined">chevron_left</span> Trước
        </button>
        <span className="gm-pagination-info">
          Trang {currentPage} / {totalP} ({total} bản ghi)
        </span>
        <button
          type="button"
          className="gm-pagination-btn"
          disabled={currentPage >= totalP}
          onClick={() => loadPage(currentPage + 1)}
        >
          Sau <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="game-management">
        <div className="loading-state">
          <span className="material-symbols-outlined spinning">progress_activity</span>
          <p>Loading game data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="game-management">
      {/* Header */}
      <div className="gm-header">
        <div className="gm-header-content">
          <div className="gm-title-section">
            <span className="material-symbols-outlined gm-icon">sports_esports</span>
            <div>
              <h1>Game Management</h1>
              <p>Manage Whack-a-Mask game system</p>
            </div>
          </div>
          <button className="gm-refresh-btn" onClick={loadGameData}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="gm-stats-grid">
        <div className="gm-stat-card">
          <div className="gm-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <span className="material-symbols-outlined">group</span>
          </div>
          <div className="gm-stat-content">
            <p className="gm-stat-label">Total Players</p>
            <h3 className="gm-stat-value">{stats.totalPlayers.toLocaleString()}</h3>
          </div>
        </div>

        <div className="gm-stat-card">
          <div className="gm-stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <span className="material-symbols-outlined">videogame_asset</span>
          </div>
          <div className="gm-stat-content">
            <p className="gm-stat-label">Total Games</p>
            <h3 className="gm-stat-value">{stats.totalGames.toLocaleString()}</h3>
          </div>
        </div>

        <div className="gm-stat-card">
          <div className="gm-stat-icon" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
            <span className="material-symbols-outlined">toll</span>
          </div>
          <div className="gm-stat-content">
            <p className="gm-stat-label">Total Coins</p>
            <h3 className="gm-stat-value">{stats.totalCoins.toLocaleString()}</h3>
          </div>
        </div>

        <div className="gm-stat-card">
          <div className="gm-stat-icon" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div className="gm-stat-content">
            <p className="gm-stat-label">Active Today</p>
            <h3 className="gm-stat-value">{stats.activeToday.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="gm-tabs">
        <button
          className={`gm-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="material-symbols-outlined">dashboard</span>
          Overview
        </button>
        <button
          className={`gm-tab ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          Shop Items
        </button>
        <button
          className={`gm-tab ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <span className="material-symbols-outlined">leaderboard</span>
          Top Players
        </button>
        <button
          className={`gm-tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <span className="material-symbols-outlined">history</span>
          Recent Games
        </button>
      </div>

      {/* Tab Content */}
      <div className="gm-tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="gm-overview">
            <div className="gm-section">
              <h2>
                <span className="material-symbols-outlined">insights</span>
                Quick Insights
              </h2>
              <div className="gm-insights-grid">
                <div className="gm-insight-card">
                  <h4>Average Score</h4>
                  <p className="gm-insight-value">
                    {recentGames.length > 0
                      ? Math.round(recentGames.reduce((sum, g) => sum + g.score, 0) / recentGames.length)
                      : 0}
                  </p>
                </div>
                <div className="gm-insight-card">
                  <h4>Shop Items</h4>
                  <p className="gm-insight-value">{shopItems.length}</p>
                </div>
                <div className="gm-insight-card">
                  <h4>Active Items</h4>
                  <p className="gm-insight-value">
                    {shopItems.filter(item => item.is_active).length}
                  </p>
                </div>
                <div className="gm-insight-card">
                  <h4>Avg Game Duration</h4>
                  <p className="gm-insight-value">
                    {recentGames.length > 0 && recentGames.some(g => g.game_duration_seconds)
                      ? Math.round(recentGames.filter(g => g.game_duration_seconds).reduce((sum, g) => sum + g.game_duration_seconds, 0) / recentGames.filter(g => g.game_duration_seconds).length)
                      : 0}s
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shop Items Tab */}
        {activeTab === 'shop' && (
          <div className="gm-shop-section">
            <div className="gm-section-header">
              <h2>
                <span className="material-symbols-outlined">shopping_cart</span>
                Shop Items Management
              </h2>
              <button className="gm-add-btn" onClick={handleAddItem}>
                <span className="material-symbols-outlined">add</span>
                Add New Item
              </button>
            </div>

            <div className="gm-table-container">
              <table className="gm-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Type</th>
                    <th>Badge</th>
                    <th>Status</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shopItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="gm-item-image">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} />
                          ) : (
                            <span className="material-symbols-outlined">image</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="gm-item-name">
                          <strong>{item.name}</strong>
                          <small>{item.description?.substring(0, 50)}...</small>
                        </div>
                      </td>
                      <td>
                        <span className="gm-price">
                          <span className="material-symbols-outlined">toll</span>
                          {item.price.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="gm-badge gm-badge-type">{item.item_type}</span>
                      </td>
                      <td>
                        {item.badge && (
                          <span className={`gm-badge gm-badge-${item.badge_color || 'primary'}`}>
                            {item.badge}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`gm-status ${item.is_active ? 'active' : 'inactive'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{item.stock_quantity || '∞'}</td>
                      <td>
                        <div className="gm-actions">
                          <button
                            className="gm-action-btn"
                            onClick={() => toggleItemActive(item.id, item.is_active)}
                            title={item.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <span className="material-symbols-outlined">
                              {item.is_active ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                          <button 
                            className="gm-action-btn" 
                            onClick={() => handleEditItem(item)}
                            title="Edit"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="gm-action-btn gm-action-delete"
                            onClick={() => deleteShopItem(item.id)}
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shopTotalCount > 0 && renderPagination(shopPage, shopTotalCount, loadShopItems)}
          </div>
        )}

        {/* Top Players Tab */}
        {activeTab === 'players' && (
          <div className="gm-players-section">
            {topPlayers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.3 }}>
                  person_off
                </span>
                <p>No players found. Players will appear here after they play the game.</p>
              </div>
            ) : (
              <div className="gm-table-container">
                <table className="gm-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Total Coins</th>
                      <th>Games Played</th>
                      <th>Best Score</th>
                      <th>Current Rank</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPlayers.map((player, index) => (
                      <tr key={player.user_id}>
                        <td>
                          <div className="gm-rank">#{(playersPage - 1) * PAGE_SIZE + index + 1}</div>
                        </td>
                        <td>
                          <div className="gm-player-info">
                            <div className="gm-player-avatar">
                              {player.profile?.avatar_url ? (
                                <img src={player.profile.avatar_url} alt={player.profile.full_name} />
                              ) : (
                                <span className="material-symbols-outlined">person</span>
                              )}
                            </div>
                            <div>
                              <strong>{player.profile?.full_name || 'Unknown'}</strong>
                              <small>{player.profile?.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="gm-coins">
                            <span className="material-symbols-outlined">toll</span>
                            {player.total_coins?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td>{player.total_games_played || 0}</td>
                        <td>{player.highest_score || 0}</td>
                        <td>
                          <span className="gm-badge gm-badge-rank">
                            {player.current_rank?.rank_name || 'Newbie'}
                          </span>
                        </td>
                        <td>
                          <div className="gm-actions">
                            <button className="gm-action-btn" title="View Details">
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                            <button className="gm-action-btn" title="Edit">
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {playersTotalCount > 0 && renderPagination(playersPage, playersTotalCount, loadTopPlayers)}
          </div>
        )}

        {/* Recent Games Tab */}
        {activeTab === 'sessions' && (
          <div className="gm-sessions-section">
            {recentGames.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.3 }}>
                  videogame_asset_off
                </span>
                <p>No game sessions found. Game history will appear here after players start playing.</p>
              </div>
            ) : (
              <div className="gm-table-container">
                <table className="gm-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Score</th>
                      <th>Coins</th>
                      <th>Masks Hit</th>
                      <th>Rounds</th>
                      <th>Accuracy</th>
                      <th>Duration</th>
                      <th>Rank</th>
                      <th>Played At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGames.map(game => (
                      <tr key={game.id}>
                        <td>
                          <div className="gm-player-simple">
                            <strong>{game.player?.full_name || 'Unknown'}</strong>
                            <small>{game.player?.email}</small>
                          </div>
                        </td>
                        <td><strong>{game.score ?? 0}</strong></td>
                        <td>
                          <span className="gm-coins">
                            <span className="material-symbols-outlined">toll</span>
                            {game.coins_earned ?? 0}
                          </span>
                        </td>
                        <td>{game.masks_hit ?? 0}</td>
                        <td>{game.total_rounds ?? '-'}</td>
                        <td>
                          {game.accuracy_percentage != null
                            ? `${Number(game.accuracy_percentage).toFixed(1)}%`
                            : '-'}
                        </td>
                        <td>{game.game_duration_seconds != null ? `${game.game_duration_seconds}s` : '-'}</td>
                        <td>{game.rank_at_time || '-'}</td>
                        <td>
                          <small>{game.played_at ? new Date(game.played_at).toLocaleString('vi-VN') : '-'}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {gamesTotalCount > 0 && renderPagination(gamesPage, gamesTotalCount, loadRecentGames)}
          </div>
        )}
      </div>

      {/* Shop Item Modal */}
      {showItemModal && (
        <ShopItemModal
          item={editingItem}
          categories={categories}
          onClose={handleCloseModal}
          onSave={handleSaveItem}
        />
      )}
    </div>
  )
}

export default GameManagement
