import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  BarChart3, 
  Palette,
  Armchair,
  Star,
  Sofa,
  Accessibility,
  Minus,
  Square,
  Grid3x3,
  Eye,
  EyeOff
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { SeatType } from '@/types/seat.types';

const seatTypeInfo = {
  [SeatType.STANDARD]: { icon: Armchair, label: 'Thường', color: '#4A90E2' },
  [SeatType.VIP]: { icon: Star, label: 'VIP', color: '#F5A623' },
  [SeatType.COUPLE]: { icon: Sofa, label: 'Đôi', color: '#E91E63' },
  [SeatType.WHEELCHAIR]: { icon: Accessibility, label: 'Xe lăn', color: '#50C878' },
  [SeatType.AISLE]: { icon: Minus, label: 'Lối đi', color: '#6B7280' },
  [SeatType.STAGE]: { icon: Square, label: 'Sân khấu', color: '#D33131' },
};

export default function SeatSidebar() {
  const { 
    rows, 
    cols, 
    cellSize, 
    showGrid,
    setRows, 
    setCols, 
    setCellSize,
    setShowGrid,
    getStatistics 
  } = useSeatLayoutStore();

  const stats = getStatistics();

  return (
    <motion.div
      className="h-full overflow-y-auto sidebar-container"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
    >
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="sidebar-tabs">
          <TabsTrigger value="grid" className="sidebar-tab">
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden lg:inline ml-2">Lưới</span>
          </TabsTrigger>
          <TabsTrigger value="types" className="sidebar-tab">
            <Palette className="w-4 h-4" />
            <span className="hidden lg:inline ml-2">Loại</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="sidebar-tab">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden lg:inline ml-2">Thống kê</span>
          </TabsTrigger>
        </TabsList>

        {/* Grid Settings Tab */}
        <TabsContent value="grid" className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              <Settings className="w-4 h-4" />
              Cài đặt lưới
            </h3>
            
            <div className="sidebar-control-group">
              <div className="sidebar-control">
                <div className="flex items-center justify-between mb-2">
                  <Label className="sidebar-label">Số hàng</Label>
                  <span className="sidebar-value">{rows}</span>
                </div>
                <Slider
                  value={[rows]}
                  onValueChange={([value]) => setRows(value)}
                  min={1}
                  max={40}
                  step={1}
                  className="sidebar-slider"
                />
              </div>

              <div className="sidebar-control">
                <div className="flex items-center justify-between mb-2">
                  <Label className="sidebar-label">Số cột</Label>
                  <span className="sidebar-value">{cols}</span>
                </div>
                <Slider
                  value={[cols]}
                  onValueChange={([value]) => setCols(value)}
                  min={1}
                  max={40}
                  step={1}
                  className="sidebar-slider"
                />
              </div>

              <div className="sidebar-control">
                <div className="flex items-center justify-between mb-2">
                  <Label className="sidebar-label">Kích thước ô</Label>
                  <span className="sidebar-value">{cellSize}px</span>
                </div>
                <Slider
                  value={[cellSize]}
                  onValueChange={([value]) => setCellSize(value)}
                  min={20}
                  max={80}
                  step={5}
                  className="sidebar-slider"
                />
              </div>

              <div className="sidebar-toggle">
                <div className="flex items-center gap-2">
                  {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <Label className="sidebar-label">Hiển thị lưới</Label>
                </div>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`toggle-switch ${showGrid ? 'active' : ''}`}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Seat Types Tab */}
        <TabsContent value="types" className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              <Palette className="w-4 h-4" />
              Loại ghế
            </h3>
            
            <div className="seat-type-list">
              {Object.entries(seatTypeInfo).map(([type, info]) => {
                const Icon = info.icon;
                const count = stats.byType[type] || 0;
                
                return (
                  <div key={type} className="seat-type-item">
                    <div className="flex items-center gap-3">
                      <div 
                        className="seat-type-icon"
                        style={{ backgroundColor: info.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="seat-type-label">{info.label}</span>
                    </div>
                    <Badge className="seat-type-badge">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              <BarChart3 className="w-4 h-4" />
              Thống kê
            </h3>
            
            <div className="stats-summary">
              <div className="stats-total">
                <div className="stats-number">{stats.total}</div>
                <div className="stats-label">Tổng số ghế</div>
              </div>
            </div>

            <div className="stats-breakdown">
              {Object.entries(stats.byType).map(([type, count]) => {
                const info = seatTypeInfo[type];
                if (!info || count === 0) return null;
                
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                
                return (
                  <div key={type} className="stats-item">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: info.color }}
                        />
                        <span className="stats-item-label">{info.label}</span>
                      </div>
                      <span className="stats-item-value">
                        {count} <span className="text-muted-foreground">({percentage.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="stats-progress"
                      style={{ 
                        '--progress-color': info.color 
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="stats-info">
              <div className="stats-info-item">
                <span className="stats-info-label">Kích thước lưới</span>
                <span className="stats-info-value">{rows} × {cols}</span>
              </div>
              <div className="stats-info-item">
                <span className="stats-info-label">Sức chứa</span>
                <span className="stats-info-value">{rows * cols} ô</span>
              </div>
              <div className="stats-info-item">
                <span className="stats-info-label">Tỷ lệ sử dụng</span>
                <span className="stats-info-value">
                  {((stats.total / (rows * cols)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
