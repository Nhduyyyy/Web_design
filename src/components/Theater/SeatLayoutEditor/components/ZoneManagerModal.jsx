import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2 } from 'lucide-react';
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
        toast.success('Zone updated');
      } else {
        // Create new zone
        const newZone = await createZone(hallId, formData);
        addZone(newZone);
        toast.success('Zone created');
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save zone:', error);
      toast.error('Failed to save zone');
    }
  };
  
  const handleDelete = async (zoneId) => {
    if (!confirm('Delete this zone? Seats will be unassigned.')) {
      return;
    }
    
    try {
      await deleteZone(zoneId);
      removeZone(zoneId);
      toast.success('Zone deleted');
    } catch (error) {
      console.error('Failed to delete zone:', error);
      toast.error('Failed to delete zone');
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Zone Manager</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Zone Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div>
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input
                id="zone-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., VIP Section"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="zone-description">Description</Label>
              <Input
                id="zone-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zone-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="zone-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="zone-multiplier">Price Multiplier</Label>
                <Input
                  id="zone-multiplier"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.price_multiplier}
                  onChange={(e) => setFormData({ ...formData, price_multiplier: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">
                {editingZone ? 'Update Zone' : 'Create Zone'}
              </Button>
              {editingZone && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
          
          {/* Zone List */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Existing Zones</h3>
            {zones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No zones created yet</p>
            ) : (
              zones.map((zone) => (
                <div 
                  key={zone.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      {zone.description && (
                        <p className="text-xs text-muted-foreground">{zone.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Multiplier: {zone.price_multiplier}x
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
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
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(zone.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
