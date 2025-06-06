import React, { useState } from 'react';
import { Square, Circle as CircleIcon, Type, StickyNote, Shapes, Triangle, Hexagon, ArrowRight, Pencil, Eraser, Highlighter } from 'lucide-react';

interface CanvasLeftToolbarProps {
  disabled: boolean;
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddTriangle: () => void;
  onAddHexagon: () => void;
  onAddText: () => void;
  onAddStickyNote: () => void;
  onAddConnector: () => void;
  onSelectPen: () => void;
  onSelectEraser: () => void;
  onSelectHighlighter: () => void;
  activeTool: string;
}

export default function CanvasLeftToolbar({
  disabled,
  onAddRectangle,
  onAddCircle,
  onAddTriangle,
  onAddHexagon,
  onAddText,
  onAddStickyNote,
  onAddConnector,
  onSelectPen,
  onSelectEraser,
  onSelectHighlighter,
  activeTool,
}: CanvasLeftToolbarProps) {
  const [showShapesSubmenu, setShowShapesSubmenu] = useState(false);

  const shapes = [
    { icon: Square, label: 'Rectangle', onClick: onAddRectangle },
    { icon: CircleIcon, label: 'Circle', onClick: onAddCircle },
    { icon: Triangle, label: 'Triangle', onClick: onAddTriangle },
    { icon: Hexagon, label: 'Hexagon', onClick: onAddHexagon },
  ];

  const tools = [
    { 
      icon: Pencil, 
      label: 'Drawing Pen', 
      onClick: onSelectPen,
      isActive: activeTool === 'pen'
    },
    { 
      icon: Eraser, 
      label: 'Eraser', 
      onClick: onSelectEraser,
      isActive: activeTool === 'eraser'
    },
    {
      icon: Highlighter,
      label: 'Highlighter',
      onClick: onSelectHighlighter,
      isActive: activeTool === 'highlighter'
    },
    { icon: Type, label: 'Add Text', onClick: onAddText },
    { icon: StickyNote, label: 'Add Sticky Note', onClick: onAddStickyNote },
    { icon: ArrowRight, label: 'Add Connector', onClick: onAddConnector },
  ];

  return (
    <div className="relative flex flex-col gap-2 border-r border-gray-200 bg-white p-2">
      <button
        onClick={() => setShowShapesSubmenu(!showShapesSubmenu)}
        className={`rounded p-2 ${
          showShapesSubmenu ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        title="Shapes"
        disabled={disabled}
      >
        <Shapes className="h-5 w-5" />
      </button>

      {/* Shapes Submenu */}
      <div
        className={`absolute left-full top-0 z-10 ml-2 w-40 transform rounded-lg border border-gray-200 bg-white p-2 shadow-lg transition-all duration-200 ${
          showShapesSubmenu ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="space-y-1">
          {shapes.map((shape) => {
            const Icon = shape.icon;
            return (
              <button
                key={shape.label}
                onClick={() => {
                  shape.onClick();
                  setShowShapesSubmenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                disabled={disabled}
              >
                <Icon className="h-4 w-4" />
                <span>{shape.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Other Tools */}
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.label}
            onClick={tool.onClick}
            className={`rounded p-2 hover:bg-gray-100 ${
              tool.isActive ? 'bg-indigo-50 text-indigo-600' : ''
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            title={tool.label}
            disabled={disabled}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}