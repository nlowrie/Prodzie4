import React from 'react';
import { Hand, MousePointer2, Plus, Minus, Save, Undo2, Redo2, Link } from 'lucide-react';

interface CanvasTopToolbarProps {
  disabled: boolean;
  cursorMode: 'select' | 'pan';
  zoom: number;
  onCursorModeChange: (mode: 'select' | 'pan') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  onLinkToBacklog: () => void;
  canLinkToBacklog: boolean;
  brushColor: string;
  brushWidth: number;
  onBrushColorChange: (color: string) => void;
  onBrushWidthChange: (width: number) => void;
  showBrushControls: boolean;
  highlighterColor: string;
  highlighterOpacity: number;
  onHighlighterColorChange: (color: string) => void;
  onHighlighterOpacityChange: (opacity: number) => void;
  showHighlighterControls: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function CanvasTopToolbar({
  disabled,
  cursorMode,
  zoom,
  onCursorModeChange,
  onZoomIn,
  onZoomOut,
  onSave,
  onLinkToBacklog,
  canLinkToBacklog,
  brushColor,
  brushWidth,
  onBrushColorChange,
  onBrushWidthChange,
  showBrushControls,
  highlighterColor,
  highlighterOpacity,
  onHighlighterColorChange,
  onHighlighterOpacityChange,
  showHighlighterControls,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: CanvasTopToolbarProps) {
  return (
    <div className="border-b border-gray-200 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCursorModeChange('select')}
            className={`rounded p-1.5 ${
              cursorMode === 'select'
                ? 'bg-indigo-100 text-indigo-600'
                : 'hover:bg-gray-100'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Select Mode"
            disabled={disabled}
          >
            <MousePointer2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => onCursorModeChange('pan')}
            className={`rounded p-1.5 ${
              cursorMode === 'pan'
                ? 'bg-indigo-100 text-indigo-600'
                : 'hover:bg-gray-100'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Pan Mode"
            disabled={disabled}
          >
            <Hand className="h-5 w-5" />
          </button>
          <div className="h-4 w-px bg-gray-300 mx-2" />
          <button
            onClick={onUndo}
            className={`rounded p-1.5 hover:bg-gray-100 ${
              !canUndo || disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Undo (Ctrl+Z)"
            disabled={!canUndo || disabled}
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            onClick={onRedo}
            className={`rounded p-1.5 hover:bg-gray-100 ${
              !canRedo || disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Redo (Ctrl+Y)"
            disabled={!canRedo || disabled}
          >
            <Redo2 className="h-5 w-5" />
          </button>
          <div className="h-4 w-px bg-gray-300 mx-2" />
          <button
            onClick={onZoomIn}
            className={`rounded p-1.5 hover:bg-gray-100 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Zoom In"
            disabled={disabled}
          >
            <Plus className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomOut}
            className={`rounded p-1.5 hover:bg-gray-100 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Zoom Out"
            disabled={disabled}
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="h-4 w-px bg-gray-300 mx-2" />
          {showBrushControls && (
            <>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => onBrushColorChange(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-gray-300"
                title="Brush Color"
                disabled={disabled}
              />
              <input
                type="range"
                min="1"
                max="50"
                value={brushWidth}
                onChange={(e) => onBrushWidthChange(parseInt(e.target.value))}
                className="w-32"
                title="Brush Width"
                disabled={disabled}
              />
              <div className="h-4 w-px bg-gray-300 mx-2" />
            </>
          )}
          {showHighlighterControls && (
            <>
              <input
                type="color"
                value={highlighterColor}
                onChange={(e) => onHighlighterColorChange(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-gray-300"
                title="Highlighter Color"
                disabled={disabled}
              />
              <input
                type="range"
                min="10"
                max="50"
                value={highlighterOpacity}
                onChange={(e) => onHighlighterOpacityChange(parseInt(e.target.value))}
                className="w-32"
                title="Highlighter Opacity"
                disabled={disabled}
              />
              <div className="h-4 w-px bg-gray-300 mx-2" />
            </>
          )}
          <button
            onClick={onLinkToBacklog}
            className={`rounded p-1.5 hover:bg-gray-100 ${
              !canLinkToBacklog || disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Link to Backlog"
            disabled={!canLinkToBacklog || disabled}
          >
            <Link className="h-5 w-5" />
          </button>
          <button
            onClick={onSave}
            className={`rounded p-1.5 hover:bg-gray-100 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Save Canvas"
            disabled={disabled}
          >
            <Save className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}