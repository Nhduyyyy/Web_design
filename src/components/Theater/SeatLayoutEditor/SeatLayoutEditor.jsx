import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Download, Upload, Loader2, History, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast, { Toaster } from 'react-hot-toast';

import SeatToolbar from './components/SeatToolbar';
import SeatCanvas from './components/SeatCanvas';
import SeatSidebar from './components/SeatSidebar';
import TemplateSelector from './components/TemplateSelector';
import VersionHistoryModal from './components/VersionHistoryModal';
import ZoneManagerModal from './components/ZoneManagerModal';
import { SidebarSkeleton, CanvasSkeleton, ToolbarSkeleton } from './components/LoadingSkeleton';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { 
  getHallById, 
  loadSeatLayoutComplete,
  saveSeatLayoutComplete,
  exportLayoutToJSON,
  importLayoutFromJSON,
  invalidateLayoutCache
} from '@/services/hallService';
import './SeatLayoutEditor.css';

export default function SeatLayoutEditor() {
  const { hallId } = useParams();
  const navigate = useNavigate();
  const hasLoadedRef = useRef(false);
  
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showZoneManager, setShowZoneManager] = useState(false);
  const [bookedSeatIds, setBookedSeatIds] = useState([]); // Track booking status
  const [bookingDetails, setBookingDetails] = useState({}); // Track booking details
  
  const { 
    isDirty,
    autoSaveEnabled,
    loadSeats, 
    setConfig,
    addZone,
    validateLayout,
    getLayoutData,
    markClean,
    markDirty,
    regenerateAllLabels,
    reset 
  } = useSeatLayoutStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Load hall data
  useEffect(() => {
    if (hallId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadHall();
    }
    return () => {
      reset(); // Cleanup on unmount
      hasLoadedRef.current = false;
    };
  }, [hallId]);
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty) return;
    
    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoSaveEnabled, isDirty]);

  const loadHall = async () => {
    try {
      setLoading(true);
      console.log('🏛️ Loading hall with ID:', hallId);
      
      // Load hall details
      const hallData = await getHallById(hallId);
      console.log('🎭 Hall data loaded:', hallData);
      console.log('🏢 Theater ID from hall:', hallData?.theater_id);
      
      setHall(hallData);
      
      // Load complete seat layout with config and zones
      const layoutData = await loadSeatLayoutComplete(hallId);
      
      if (layoutData.config) {
        setConfig(layoutData.config);
      }
      
      if (layoutData.seats && layoutData.seats.length > 0) {
        loadSeats(layoutData.seats);
        // Regenerate all labels to use sequential numbering
        setTimeout(() => {
          regenerateAllLabels();
        }, 100);
        toast.success(`Đã tải ${layoutData.seats.length} ghế`);
      } else {
        // Only show message once per session
        const toastId = 'no-layout-found';
        toast('Không tìm thấy sơ đồ ghế. Hãy bắt đầu tạo!', {
          id: toastId,
          icon: 'ℹ️',
        });
      }
      
      // Load zones
      if (layoutData.zones && layoutData.zones.length > 0) {
        layoutData.zones.forEach(zone => addZone(zone));
      }
    } catch (error) {
      console.error('Failed to load hall:', error);
      toast.error('Không thể tải dữ liệu phòng');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAutoSave = async () => {
    if (!isDirty) return;
    
    try {
      const validation = validateLayout();
      if (!validation.isValid) {
        console.warn('Layout validation failed:', validation.errors);
        return;
      }
      
      const layoutData = getLayoutData();
      await saveSeatLayoutComplete(hallId, layoutData);
      markClean();
      invalidateLayoutCache(hallId);
      
      toast.success('Đã tự động lưu', { duration: 2000 });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate before save
      const validation = validateLayout();
      if (!validation.isValid) {
        toast.error('Xác thực thất bại');
        validation.errors.forEach(err => toast.error(err, { duration: 4000 }));
        return;
      }
      
      const layoutData = getLayoutData();
      
      // Save with version creation
      const result = await saveSeatLayoutComplete(hallId, layoutData, {
        createVersion: true,
        description: 'Lưu thủ công'
      });
      
      markClean();
      invalidateLayoutCache(hallId);
      toast.success(`Đã lưu sơ đồ! Tạo ${result.count} ghế.`);
    } catch (error) {
      console.error('Failed to save layout:', error);
      toast.error('Không thể lưu sơ đồ');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    try {
      const layoutData = getLayoutData();
      exportLayoutToJSON(layoutData, hallId, hall?.name || 'Phòng không xác định');
      toast.success('Xuất sơ đồ thành công');
    } catch (error) {
      console.error('Failed to export layout:', error);
      toast.error('Không thể xuất sơ đồ');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const layout = await importLayoutFromJSON(file);
      
      if (layout.seats) {
        loadSeats(layout.seats);
        if (layout.config) setConfig(layout.config);
        
        toast.success(`Đã nhập ${layout.seats.length} ghế`);
        markDirty();
      } else {
        toast.error('File sơ đồ không hợp lệ');
      }
    } catch (error) {
      console.error('Failed to import layout:', error);
      toast.error(error.message || 'Không thể nhập sơ đồ');
    }
    
    // Reset file input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="seat-layout-editor">
        <Toaster position="top-right" />
        
        {/* Header Skeleton */}
        <motion.header 
          className="seat-editor-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-muted animate-pulse rounded-md" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        </motion.header>

        {/* Toolbar Skeleton */}
        <ToolbarSkeleton />

        {/* Main Content Skeleton */}
        <div className="seat-editor-main">
          <div className="seat-editor-canvas-container">
            <CanvasSkeleton />
          </div>
          <div className="seat-editor-sidebar">
            <SidebarSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seat-layout-editor">
      <Toaster position="top-right" />
      
      {/* Header */}
      <motion.header 
        className="seat-editor-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{hall?.name || 'Trình chỉnh sửa sơ đồ ghế'}</h1>
              <p className="text-sm text-muted-foreground">{hall?.venue_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionHistory(true)}
            >
              <History className="w-4 h-4 mr-2" />
              Lịch sử
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowZoneManager(true)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Khu vực
            </Button>
            
            <TemplateSelector />
            
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-layout"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-layout')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Nhập
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="relative save-button"
              style={{ 
                backgroundColor: '#D33131',
                borderColor: '#D33131',
                color: 'white'
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu sơ đồ
                  {isDirty && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Toolbar */}
      <SeatToolbar 
        bookedSeatIds={bookedSeatIds}
        bookingDetails={bookingDetails}
      />

      {/* Main Content */}
      <div className="seat-editor-main ml-80">
        <div className="seat-editor-canvas-container">
          <SeatCanvas 
            hall={hall} 
            onBookingStatusChange={(seatIds, bookingMap) => {
              setBookedSeatIds(seatIds);
              setBookingDetails(bookingMap);
            }}
          />
        </div>
        <div className="seat-editor-sidebar">
          <SeatSidebar />
        </div>
      </div>
      
      {/* Modals */}
      <VersionHistoryModal
        hallId={hallId}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={loadHall}
      />
      
      <ZoneManagerModal
        hallId={hallId}
        isOpen={showZoneManager}
        onClose={() => setShowZoneManager(false)}
      />
    </div>
  );
}
