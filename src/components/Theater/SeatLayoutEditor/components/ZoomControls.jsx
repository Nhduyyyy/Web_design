import React from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';

export default function ZoomControls() {
  const { zoom, zoomIn, zoomOut, resetZoom } = useSeatLayoutStore();

  return (
    <motion.div 
      className="absolute bottom-6 right-6 flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-3xl px-4 py-3 border border-red-900/30 shadow-2xl pointer-events-auto z-50"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
    >
      <TooltipProvider>
        {/* Zoom In Button - Square Red Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 disabled:bg-red-800/50 disabled:cursor-not-allowed rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              onClick={zoomIn}
              disabled={zoom >= 3}
            >
              <div className="relative">
                <ZoomIn className="w-6 h-6 text-white" strokeWidth={2.5} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xs font-bold">+</span>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Phóng to (+)</p>
          </TooltipContent>
        </Tooltip>

        {/* Zoom Out Button - Round Gray Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex items-center justify-center w-12 h-12 bg-transparent hover:bg-gray-700/30 disabled:bg-gray-800/20 disabled:cursor-not-allowed rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 border border-gray-500/40"
              onClick={zoomOut}
              disabled={zoom <= 0.1}
            >
              <div className="relative">
                <ZoomOut className="w-5 h-5 text-gray-300 hover:text-white" strokeWidth={2} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-xs font-bold">-</span>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Thu nhỏ (-)</p>
          </TooltipContent>
        </Tooltip>

        {/* Fit to Screen Button - Square Gray Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex items-center justify-center w-12 h-12 bg-transparent hover:bg-gray-700/30 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 border border-gray-500/40"
              onClick={resetZoom}
            >
              <Maximize className="w-5 h-5 text-gray-300 hover:text-white" strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Vừa màn hình</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}
