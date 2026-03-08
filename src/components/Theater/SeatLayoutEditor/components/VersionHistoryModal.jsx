import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, RotateCcw, Trash2, Loader2 } from 'lucide-react';
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
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRestore = async (versionNumber) => {
    if (!confirm(`Restore version ${versionNumber}? Current layout will be saved as a new version.`)) {
      return;
    }
    
    try {
      setRestoring(versionNumber);
      await restoreLayoutVersion(hallId, versionNumber);
      toast.success('Version restored successfully');
      onRestore();
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };
  
  const handleDelete = async (versionNumber) => {
    if (!confirm(`Delete version ${versionNumber}? This cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteLayoutVersion(hallId, versionNumber);
      toast.success('Version deleted');
      loadVersions();
    } catch (error) {
      console.error('Failed to delete version:', error);
      toast.error('Failed to delete version');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No version history available
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div 
                key={version.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Version {version.version_number}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {version.description || 'No description'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(version.created_at).toLocaleString()} by {version.creator?.full_name || 'Unknown'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(version.version_number)}
                    disabled={restoring === version.version_number}
                  >
                    {restoring === version.version_number ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restore
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(version.version_number)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
