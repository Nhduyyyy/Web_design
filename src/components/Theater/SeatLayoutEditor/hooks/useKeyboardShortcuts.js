import { useEffect } from 'react';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { ToolType } from '@/types/seat.types';

export function useKeyboardShortcuts() {
  const {
    setSelectedTool,
    undo,
    redo,
    canUndo,
    canRedo,
    copySelected,
    pasteClipboard,
    deleteSelected,
    rotateSelected,
    clearSelection,
    selectAll,
    zoomIn,
    zoomOut,
    resetZoom,
    selectedCells
  } = useSeatLayoutStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Tool selection shortcuts (1-6, D, V)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setSelectedTool(ToolType.STANDARD);
            break;
          case '2':
            e.preventDefault();
            setSelectedTool(ToolType.VIP);
            break;
          case '3':
            e.preventDefault();
            setSelectedTool(ToolType.COUPLE);
            break;
          case '4':
            e.preventDefault();
            setSelectedTool(ToolType.WHEELCHAIR);
            break;
          case '5':
            e.preventDefault();
            setSelectedTool(ToolType.AISLE);
            break;
          case '6':
            e.preventDefault();
            setSelectedTool(ToolType.STAGE);
            break;
          case 'd':
          case 'D':
            e.preventDefault();
            setSelectedTool(ToolType.DELETE);
            break;
          case 'v':
          case 'V':
            e.preventDefault();
            setSelectedTool(ToolType.SELECT);
            break;
          case 'Delete':
          case 'Backspace':
            if (selectedCells.length > 0) {
              e.preventDefault();
              deleteSelected();
            }
            break;
          case 'r':
          case 'R':
            if (selectedCells.length > 0) {
              e.preventDefault();
              rotateSelected();
            }
            break;
          case 'Escape':
            e.preventDefault();
            clearSelection();
            break;
          case '+':
          case '=':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
          case '_':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            resetZoom();
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
          case 'Z':
            e.preventDefault();
            if (e.shiftKey) {
              if (canRedo()) redo();
            } else {
              if (canUndo()) undo();
            }
            break;
          case 'y':
          case 'Y':
            e.preventDefault();
            if (canRedo()) redo();
            break;
          case 'c':
          case 'C':
            if (selectedCells.length > 0) {
              e.preventDefault();
              copySelected();
            }
            break;
          case 'v':
          case 'V':
            e.preventDefault();
            pasteClipboard();
            break;
          case 'a':
          case 'A':
            e.preventDefault();
            selectAll();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setSelectedTool,
    undo,
    redo,
    canUndo,
    canRedo,
    copySelected,
    pasteClipboard,
    deleteSelected,
    rotateSelected,
    clearSelection,
    selectAll,
    zoomIn,
    zoomOut,
    resetZoom,
    selectedCells
  ]);
}
