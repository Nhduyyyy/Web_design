import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Layers, Plus, Palette, DollarSign, MapPin } from 'lucide-react';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { createZone, updateZone, deleteZone } from '@/services/hallService';
import toast from 'react-hot-toast';

export default function ZoneManagerModal({ hallId, isOpen, onClose }) {
  const { zones, addZone, updateZone: updateStoreZone, removeZone } = useSeatLayoutStore();
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    price_multiplier: 1.0
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingZone) {
        // Update existing zone
        const updated = await updateZone(editingZone.id, formData);
        updateStoreZone(editingZone.id, updated);
        toast.success('Đã cập nhật khu vực');
      } else {
        // Create new zone
        const newZone = await createZone(hallId, formData);
        addZone(newZone);
        toast.success('Đã tạo khu vực mới');
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save zone:', error);
      toast.error('Không thể lưu khu vực');
    }
  };
  
  const handleDelete = async (zoneId) => {
    if (!confirm('Xóa khu vực này? Các ghế sẽ được bỏ gán khu vực.')) {
      return;
    }
    
    try {
      await deleteZone(zoneId);
      removeZone(zoneId);
      toast.success('Đã xóa khu vực');
    } catch (error) {
      console.error('Failed to delete zone:', error);
      toast.error('Không thể xóa khu vực');
    }
  };
  
  const resetForm = () => {
    setEditingZone(null);
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      price_multiplier: 1.0
    });
  };

  const predefinedColors = [
    '#D33131', '#3b82f6', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[85vh] overflow-hidden"
        style={{
          background: '#1A0F0F',
          border: '1px solid #432828',
          color: 'white'
        }}
      >
        <DialogHeader className="pb-4 border-b border-[#432828]">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold" style={{ color: '#D33131' }}>
            <Layers className="w-6 h-6" />
            Quản lý khu vực
          </DialogTitle>
          <p className="text-sm text-[#9CA3AF] mt-2">
            Tạo và quản lý các khu vực ghế với màu sắc và giá khác nhau
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {/* Zone Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div 
              className="zone-form p-6 rounded-lg"
              style={{
                background: '#2D1B1B',
                border: '1px solid #432828'
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-[#D33131]" />
                <h3 className="text-lg font-semibold text-white">
                  {editingZone ? 'Chỉnh sửa khu vực' : 'Tạo khu vực mới'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="zone-name" className="text-[#E5E7EB] font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Tên khu vực
                  </Label>
                  <Input
                    id="zone-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Khu VIP, Khu thường..."
                    required
                    className="mt-2"
                    style={{
                      background: '#1A0F0F',
                      border: '1px solid #432828',
                      color: 'white'
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="zone-description" className="text-[#E5E7EB] font-medium">
                    Mô tả (tùy chọn)
                  </Label>
                  <Input
                    id="zone-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả chi tiết về khu vực..."
                    className="mt-2"
                    style={{
                      background: '#1A0F0F',
                      border: '1px solid #432828',
                      color: 'white'
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zone-color" className="text-[#E5E7EB] font-medium flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Màu sắc
                    </Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex gap-2">
                        <Input
                          id="zone-color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-16 h-10 p-1 cursor-pointer"
                          style={{
                            background: '#1A0F0F',
                            border: '1px solid #432828'
                          }}
                        />
                        <Input
                          type="text"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          placeholder="#3b82f6"
                          className="flex-1"
                          style={{
                            background: '#1A0F0F',
                            border: '1px solid #432828',
                            color: 'white'
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                            style={{
                              backgroundColor: color,
                              borderColor: formData.color === color ? 'white' : '#432828'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="zone-multiplier" className="text-[#E5E7EB] font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Hệ số giá
                    </Label>
                    <Input
                      id="zone-multiplier"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.price_multiplier}
                      onChange={(e) => setFormData({ ...formData, price_multiplier: parseFloat(e.target.value) })}
                      className="mt-2"
                      style={{
                        background: '#1A0F0F',
                        border: '1px solid #432828',
                        color: 'white'
                      }}
                    />
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      1.0 = giá gốc, 1.5 = tăng 50%, 0.8 = giảm 20%
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit"
                    className="flex-1"
                    style={{
                      background: '#D33131',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {editingZone ? 'Cập nhật khu vực' : 'Tạo khu vực'}
                  </Button>
                  {editingZone && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm}
                      className="bg-transparent border-[#432828] text-white hover:bg-[#2D1B1B] hover:border-[#D33131]"
                    >
                      Hủy
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
          
          {/* Zone List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-[#D33131]" />
              <h3 className="text-lg font-semibold text-white">
                Khu vực hiện có ({zones.length})
              </h3>
            </div>
            
            {zones.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#2D1B1B',
                  border: '1px solid #432828',
                  borderRadius: '8px'
                }}
              >
                <div className="w-16 h-16 rounded-full bg-[#1A0F0F] border border-[#432828] flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-[#9CA3AF]" />
                </div>
                <h4 className="text-white font-medium mb-2">Chưa có khu vực</h4>
                <p className="text-[#9CA3AF] text-sm">
                  Tạo khu vực đầu tiên để phân loại ghế
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                <AnimatePresence>
                  {zones.map((zone, index) => (
                    <motion.div
                      key={zone.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="zone-item group"
                      style={{
                        background: '#2D1B1B',
                        border: '1px solid #432828',
                        borderRadius: '8px',
                        padding: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                      whileHover={{
                        backgroundColor: '#3D2525',
                        borderColor: '#D33131'
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div 
                            className="w-12 h-12 rounded-lg border-2 border-white/20 flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: zone.color }}
                          >
                            <Layers className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="zone-name text-white font-semibold text-base mb-1">
                              {zone.name}
                            </h4>
                            {zone.description && (
                              <p className="zone-description text-[#9CA3AF] text-sm mb-2 line-clamp-2">
                                {zone.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-[#9CA3AF]">
                                <DollarSign className="w-3 h-3" />
                                <span>Hệ số: {zone.price_multiplier}x</span>
                              </div>
                              <div className="flex items-center gap-1 text-[#9CA3AF]">
                                <Palette className="w-3 h-3" />
                                <span>{zone.color}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingZone(zone);
                              setFormData({
                                name: zone.name,
                                description: zone.description || '',
                                color: zone.color,
                                price_multiplier: zone.price_multiplier
                              });
                            }}
                            className="text-[#9CA3AF] hover:text-white hover:bg-[#432828] p-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(zone.id)}
                            className="text-[#9CA3AF] hover:text-red-400 hover:bg-[#432828] p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
