import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, RotateCcw, Trash2, Loader2, History, Calendar, User } from 'lucide-react';
import { getLayoutVersions, restoreLayoutVersion, deleteLayoutVersion } from '@/services/hallService';
import toast from 'react-hot-toast';

export default function VersionHistoryModal({ hallId, isOpen, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  
  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, hallId]);
  
  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getLayoutVersions(hallId);
      setVersions(data);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Không thể tải lịch sử phiên bản');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRestore = async (versionNumber) => {
    if (!confirm(`Khôi phục phiên bản ${versionNumber}? Bố trí hiện tại sẽ được lưu như một phiên bản mới.`)) {
      return;
    }
    
    try {
      setRestoring(versionNumber);
      await restoreLayoutVersion(hallId, versionNumber);
      toast.success('Đã khôi phục phiên bản thành công');
      onRestore();
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Không thể khôi phục phiên bản');
    } finally {
      setRestoring(null);
    }
  };
  
  const handleDelete = async (versionNumber) => {
    if (!confirm(`Xóa phiên bản ${versionNumber}? Hành động này không thể hoàn tác.`)) {
      return;
    }
    
    try {
      await deleteLayoutVersion(hallId, versionNumber);
      toast.success('Đã xóa phiên bản');
      loadVersions();
    } catch (error) {
      console.error('Failed to delete version:', error);
      toast.error('Không thể xóa phiên bản');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[85vh] overflow-hidden"
        style={{
          background: '#1A0F0F',
          border: '1px solid #432828',
          color: 'white'
        }}
      >
        <DialogHeader className="pb-4 border-b border-[#432828]">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold" style={{ color: '#D33131' }}>
            <History className="w-6 h-6" />
            Lịch sử phiên bản
          </DialogTitle>
          <p className="text-sm text-[#9CA3AF] mt-2">
            Quản lý và khôi phục các phiên bản sơ đồ ghế đã lưu
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {loading ? (
            <motion.div 
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="w-8 h-8 animate-spin text-[#D33131] mb-3" />
              <p className="text-[#9CA3AF]">Đang tải lịch sử phiên bản...</p>
            </motion.div>
          ) : versions.length === 0 ? (
            <motion.div 
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-[#2D1B1B] border border-[#432828] flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-[#9CA3AF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Chưa có lịch sử</h3>
              <p className="text-[#9CA3AF] text-center">
                Không có phiên bản nào được lưu trước đó.<br />
                Hãy lưu sơ đồ để tạo phiên bản đầu tiên.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3 p-1">
              <AnimatePresence>
                {versions.map((version, index) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="version-history-item group"
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-[#432828] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              v{version.version_number}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="version-title text-white font-semibold text-base">
                              Phiên bản {version.version_number}
                            </h4>
                            <p className="version-meta text-[#9CA3AF] text-sm mt-1 truncate">
                              {version.description || 'Không có mô tả'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-[#9CA3AF]">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              {new Date(version.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[#9CA3AF]">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              {version.creator?.full_name || 'Không xác định'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(version.version_number)}
                          disabled={restoring === version.version_number}
                          className="bg-transparent border-[#432828] text-white hover:bg-[#2D1B1B] hover:border-[#D33131] disabled:opacity-50"
                        >
                          {restoring === version.version_number ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Đang khôi phục...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Khôi phục
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(version.version_number)}
                          className="text-[#9CA3AF] hover:text-white hover:bg-[#2D1B1B] p-2"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
