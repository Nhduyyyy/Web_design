import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Armchair, 
  Sofa, 
  Star, 
  Accessibility, 
  DoorOpen, 
  Square,
  Trash2,
  MousePointer,
  Hand,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { ToolType } from '@/types/seat.types';

const tools = [
  { id: ToolType.SELECT, icon: MousePointer, label: 'Chọn (V)', color: 'text-gray-300' },
  { id: ToolType.PAN, icon: Hand, label: 'Di chuyển', color: 'text-gray-300' },
  { id: ToolType.STANDARD, icon: Armchair, label: 'Ghế thường (1)', color: 'text-gray-400' },
  { id: ToolType.VIP, icon: Star, label: 'Ghế VIP (2)', color: 'text-yellow-300' },
  { id: ToolType.COUPLE, icon: Sofa, label: 'Ghế đôi (3)', color: 'text-pink-300' },
  { id: ToolType.WHEELCHAIR, icon: Accessibility, label: 'Ghế xe lăn (4)', color: 'text-cyan-300' },
  { id: ToolType.AISLE, icon: DoorOpen, label: 'Lối đi (5)', color: 'text-gray-400' },
  { id: ToolType.STAGE, icon: Square, label: 'Khu vực sân khấu (6)', color: 'text-red-300' },
  { id: ToolType.DELETE, icon: Trash2, label: 'Xóa (D)', color: 'text-red-400' },
];

export default function SeatToolbar() {
  const { selectedTool, setSelectedTool } = useSeatLayoutStore();
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);

  // Group tools by category
  const toolCategories = [
    {
      name: "Điều hướng",
      tools: [
        { id: ToolType.SELECT, icon: MousePointer, label: 'Chọn', shortcut: 'V', color: 'text-gray-300' },
        { id: ToolType.PAN, icon: Hand, label: 'Di chuyển', shortcut: 'H', color: 'text-gray-300' },
      ]
    },
    {
      name: "Loại ghế",
      tools: [
        { id: ToolType.STANDARD, icon: Armchair, label: 'Ghế thường', shortcut: '1', color: 'text-gray-400' },
        { id: ToolType.VIP, icon: Star, label: 'Ghế VIP', shortcut: '2', color: 'text-yellow-300' },
        { id: ToolType.COUPLE, icon: Sofa, label: 'Ghế đôi', shortcut: '3', color: 'text-pink-300' },
        { id: ToolType.WHEELCHAIR, icon: Accessibility, label: 'Ghế xe lăn', shortcut: '4', color: 'text-cyan-300' },
      ]
    },
    {
      name: "Khu vực",
      tools: [
        { id: ToolType.AISLE, icon: DoorOpen, label: 'Lối đi', shortcut: '5', color: 'text-gray-400' },
        { id: ToolType.STAGE, icon: Square, label: 'Sân khấu', shortcut: '6', color: 'text-red-300' },
      ]
    },
    {
      name: "Hành động",
      tools: [
        { id: ToolType.DELETE, icon: Trash2, label: 'Xóa', shortcut: 'D', color: 'text-red-400' },
      ]
    }
  ];

  return (
    <motion.div 
      className="seat-toolbar fixed left-0 top-20 h-[calc(100vh-5rem)] w-80 shadow-2xl z-10 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #1A0505, #2B0707)'
      }}
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
    >
      <TooltipProvider>
        <div className="flex flex-col h-full w-full">
          {/* Tools Section */}
          <div className="flex-1 w-full overflow-y-auto">
            {/* Tools Header */}
            <div 
              className="sticky top-0 p-4 border-b cursor-pointer hover:bg-white hover:bg-opacity-5 transition-colors duration-200"
              style={{ 
                borderColor: '#7F1D1D',
                background: 'linear-gradient(180deg, #1A0505, #2B0707)'
              }}
              onClick={() => setIsToolsExpanded(!isToolsExpanded)}
            >
              <div className="flex items-center gap-3">
                {isToolsExpanded ? (
                  <ChevronDown className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                )}
                <span className="font-semibold text-base" style={{ color: '#6B8DB5' }}>
                  Công cụ
                </span>
                <div className="text-xs px-2 py-1 rounded ml-auto" style={{ 
                  background: '#7F1D1D', 
                  color: '#E5E7EB' 
                }}>
                  {toolCategories.reduce((total, cat) => total + cat.tools.length, 0)}
                </div>
              </div>
            </div>

            {/* Tools Content */}
            {isToolsExpanded && (
              <motion.div 
                className="px-4 pb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {toolCategories.map((category, categoryIndex) => (
                  <div key={category.name} className="mb-6">
                    {/* Category Header */}
                    <div className="mb-3 mt-4">
                      <h3 className="text-xs font-medium uppercase tracking-wider" 
                          style={{ color: '#9CA3AF' }}>
                        {category.name}
                      </h3>
                    </div>
                    
                    {/* Category Tools */}
                    <div className="space-y-2">
                      {category.tools.map((tool) => {
                        const Icon = tool.icon;
                        const isActive = selectedTool === tool.id;
                        
                        return (
                          <Tooltip key={tool.id}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => setSelectedTool(tool.id)}
                                className={`w-full h-12 flex items-center justify-between px-3 rounded-lg transition-all duration-200 group ${
                                  isActive 
                                    ? 'shadow-md transform scale-[1.01]' 
                                    : 'hover:transform hover:scale-[1.005]'
                                }`}
                                style={{
                                  background: isActive ? '#7F1D1D' : 'transparent',
                                  border: `1px solid ${isActive ? '#991B1B' : 'transparent'}`,
                                  color: isActive ? '#F3F4F6' : '#E5E7EB'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) {
                                    e.target.style.background = '#3B0A0A';
                                    e.target.style.borderColor = '#7F1D1D';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive) {
                                    e.target.style.background = 'transparent';
                                    e.target.style.borderColor = 'transparent';
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : tool.color}`} />
                                  <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-200'}`}>
                                    {tool.label}
                                  </span>
                                </div>
                                <div className={`text-xs px-2 py-1 rounded font-mono ${
                                  isActive ? 'bg-white bg-opacity-20 text-white' : 'bg-gray-700 text-gray-300'
                                }`}>
                                  {tool.shortcut}
                                </div>
                                {isActive && (
                                  <motion.div
                                    className="absolute inset-0 rounded-lg"
                                    style={{ 
                                      border: '1px solid #991B1B',
                                      boxShadow: '0 0 15px rgba(159, 27, 27, 0.2)'
                                    }}
                                    layoutId="activeToolBorder"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                  />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="right" 
                              className="ml-2"
                              style={{ 
                                background: '#2B0707', 
                                border: '1px solid #7F1D1D',
                                color: '#E5E7EB'
                              }}
                            >
                              <div className="text-center">
                                <p className="font-medium">{tool.label}</p>
                                <p className="text-xs opacity-75">Phím tắt: {tool.shortcut}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </motion.div>
  );
}
