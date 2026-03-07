import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast, { Toaster } from 'react-hot-toast';

import SeatToolbar from './components/SeatToolbar';
import SeatCanvas from './components/SeatCanvas';
import SeatSidebar from './components/SeatSidebar';
import TemplateSelector from './components/TemplateSelector';
import { SidebarSkeleton, CanvasSkeleton, ToolbarSkeleton } from './components/LoadingSkeleton';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { 
  getHallById, 
  loadSeatLayout, 
  saveSeatLayout,
  exportLayoutToJSON,
  importLayoutFromJSON 
} from '@/services/hallService';
import './SeatLayoutEditor.css';

export default function SeatLayoutEditor() {
  const { hallId } = useParams();
  const navigate = useNavigate();
  
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { seats, rows, cols, cellSize, loadSeats, setRows, setCols, reset } = useSeatLayoutStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Load hall data
  useEffect(() => {
    loadHall();
    return () => reset(); // Cleanup on unmount
  }, [hallId]);

  const loadHall = async () => {
    try {
      setLoading(true);
      
      // Load hall details
      const hallData = await getHallById(hallId);
      setHall(hallData);
      
      // Load seat layout
      const layoutData = await loadSeatLayout(hallId);
      
      if (layoutData.seats && layoutData.seats.length > 0) {
        loadSeats(layoutData.seats);
        
        // Calculate grid size from seats
        const maxRow = Math.max(...layoutData.seats.map(s => s.row));
        const maxCol = Math.max(...layoutData.seats.map(s => s.col));
        setRows(maxRow + 1);
        setCols(maxCol + 1);
        
        toast.success(`Loaded ${layoutData.seats.length} seats`);
      } else {
        toast('No existing layout found. Start creating!', {
          icon: 'ℹ️',
        });
      }
    } catch (error) {
      console.error('Failed to load hall:', error);
      toast.error('Failed to load hall data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const layoutData = {
        seats,
        rows,
        cols,
        cellSize
      };
      
      const result = await saveSeatLayout(hallId, layoutData);
      
      toast.success(`Layout saved! ${result.count} seats created.`);
    } catch (error) {
      console.error('Failed to save layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    try {
      const layout = { seats, rows, cols, cellSize };
      exportLayoutToJSON(layout, hallId, hall?.name || 'Unknown Hall');
      toast.success('Layout exported successfully');
    } catch (error) {
      console.error('Failed to export layout:', error);
      toast.error('Failed to export layout');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const layout = await importLayoutFromJSON(file);
      
      if (layout.seats) {
        loadSeats(layout.seats);
        if (layout.rows) setRows(layout.rows);
        if (layout.cols) setCols(layout.cols);
        
        toast.success(`Imported ${layout.seats.length} seats`);
      } else {
        toast.error('Invalid layout file');
      }
    } catch (error) {
      console.error('Failed to import layout:', error);
      toast.error(error.message || 'Failed to import layout');
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
              <h1 className="text-2xl font-bold">{hall?.name || 'Seat Layout Editor'}</h1>
              <p className="text-sm text-muted-foreground">{hall?.venue_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
              Import
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Layout
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Toolbar */}
      <SeatToolbar />

      {/* Main Content */}
      <div className="seat-editor-main">
        <div className="seat-editor-canvas-container">
          <SeatCanvas />
        </div>
        <div className="seat-editor-sidebar">
          <SeatSidebar />
        </div>
      </div>
    </div>
  );
}
