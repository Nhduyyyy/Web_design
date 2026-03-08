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
  Square
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { SeatType } from '@/types/seat.types';

const seatTypeInfo = {
  [SeatType.STANDARD]: { icon: Armchair, label: 'Standard', color: 'bg-theater-standard' },
  [SeatType.VIP]: { icon: Star, label: 'VIP', color: 'bg-theater-vip' },
  [SeatType.COUPLE]: { icon: Sofa, label: 'Couple', color: 'bg-theater-couple' },
  [SeatType.WHEELCHAIR]: { icon: Accessibility, label: 'Wheelchair', color: 'bg-theater-wheelchair' },
  [SeatType.AISLE]: { icon: Minus, label: 'Aisle', color: 'bg-gray-400' },
  [SeatType.STAGE]: { icon: Square, label: 'Stage', color: 'bg-theater-stage' },
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
      className="h-full overflow-y-auto p-4"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
    >
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grid">
            <Settings className="w-4 h-4 mr-2" />
            Grid
          </TabsTrigger>
          <TabsTrigger value="types">
            <Palette className="w-4 h-4 mr-2" />
            Types
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="w-4 h-4 mr-2" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* Grid Settings Tab */}
        <TabsContent value="grid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grid Settings</CardTitle>
              <CardDescription>Configure the layout grid</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Rows: {rows}</Label>
                <Slider
                  value={[rows]}
                  onValueChange={([value]) => setRows(value)}
                  min={1}
                  max={40}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Columns: {cols}</Label>
                <Slider
                  value={[cols]}
                  onValueChange={([value]) => setCols(value)}
                  min={1}
                  max={40}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Cell Size: {cellSize}px</Label>
                <Slider
                  value={[cellSize]}
                  onValueChange={([value]) => setCellSize(value)}
                  min={20}
                  max={80}
                  step={5}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Show Grid Lines</Label>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${showGrid ? 'bg-primary' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${showGrid ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seat Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seat Types</CardTitle>
              <CardDescription>Available seat types and counts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(seatTypeInfo).map(([type, info]) => {
                const Icon = info.icon;
                const count = stats.byType[type] || 0;
                
                return (
                  <div key={type} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${info.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{info.label}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Layout overview and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Seats</div>
              </div>

              <div className="space-y-4">
                {Object.entries(stats.byType).map(([type, count]) => {
                  const info = seatTypeInfo[type];
                  if (!info) return null;
                  
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{info.label}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grid Size</span>
                  <span className="font-medium">{rows} × {cols}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{rows * cols} cells</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className="font-medium">
                    {((stats.total / (rows * cols)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
