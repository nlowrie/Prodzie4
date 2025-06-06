import React, { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database, Tables } from '../types/supabase';
import CanvasTopToolbar from './CanvasTopToolbar';
import CanvasLeftToolbar from './CanvasLeftToolbar';
import BacklogItemFormDialog from './BacklogItemFormDialog';
import '../lib/fabric-extensions';

interface CanvasEditorProps {
  canvasData: Tables<'project_canvases'>;
  onClose: () => void;
}

const GRID_SIZE = 20;
const GRID_COLOR = '#e5e7eb';

export default function CanvasEditor({ canvasData, onClose }: CanvasEditorProps) {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [cursorMode, setCursorMode] = useState<'select' | 'pan'>('select');
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState('select');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [canLinkToBacklog, setCanLinkToBacklog] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(5);
  const [highlighterColor, setHighlighterColor] = useState('#ffeb3b');
  const [highlighterOpacity, setHighlighterOpacity] = useState(30);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = useSupabaseClient<Database>();
  const isDragging = useRef(false);
  const lastPosX = useRef<number>(0);
  const lastPosY = useRef<number>(0);
  const gridLines = useRef<fabric.Line[]>([]);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth - 64,
        height: window.innerHeight - 120,
        backgroundColor: '#ffffff',
      });

      setCanvas(fabricCanvas);
      loadCanvasContent(fabricCanvas);
      renderGrid(fabricCanvas);

      const handleResize = () => {
        fabricCanvas.setWidth(window.innerWidth - 64);
        fabricCanvas.setHeight(window.innerHeight - 120);
        renderGrid(fabricCanvas);
        fabricCanvas.renderAll();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (fabricCanvas) {
          fabricCanvas.dispose();
          setCanvas(null);
        }
      };
    }
  }, [canvasRef]);

  useEffect(() => {
    if (!canvas) return;

    canvas.defaultCursor = cursorMode === 'select' ? 'default' : 'grab';
    canvas.hoverCursor = cursorMode === 'select' ? 'move' : 'grab';
    
    const handleMouseDown = (opt: fabric.IEvent) => {
      if (cursorMode === 'pan') {
        isDragging.current = true;
        lastPosX.current = opt.e.clientX;
        lastPosY.current = opt.e.clientY;
        canvas.selection = false;
      }
    };

    const handleMouseMove = (opt: fabric.IEvent) => {
      if (isDragging.current && cursorMode === 'pan') {
        const e = opt.e;
        const vpt = canvas.viewportTransform!;
        vpt[4] += e.clientX - lastPosX.current;
        vpt[5] += e.clientY - lastPosY.current;
        updateGridPosition();
        canvas.requestRenderAll();
        lastPosX.current = e.clientX;
        lastPosY.current = e.clientY;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      canvas.selection = true;
    };

    const handleSelectionCreated = () => {
      setCanLinkToBacklog(true);
    };

    const handleSelectionCleared = () => {
      setCanLinkToBacklog(false);
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [canvas, cursorMode]);

  const renderGrid = (canvas: fabric.Canvas) => {
    gridLines.current.forEach(line => canvas.remove(line));
    gridLines.current = [];

    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const zoom = canvas.getZoom();
    const adjustedGridSize = GRID_SIZE * zoom;

    const startX = Math.floor((-canvas.viewportTransform![4] / zoom) / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor((-canvas.viewportTransform![5] / zoom) / GRID_SIZE) * GRID_SIZE;
    const endX = startX + (width / zoom);
    const endY = startY + (height / zoom);

    for (let x = startX; x <= endX; x += GRID_SIZE) {
      const line = new fabric.Line([x, startY, x, endY], {
        stroke: GRID_COLOR,
        selectable: false,
        evented: false,
        strokeWidth: 1 / zoom,
      });
      gridLines.current.push(line);
      canvas.add(line);
      line.sendToBack();
    }

    for (let y = startY; y <= endY; y += GRID_SIZE) {
      const line = new fabric.Line([startX, y, endX, y], {
        stroke: GRID_COLOR,
        selectable: false,
        evented: false,
        strokeWidth: 1 / zoom,
      });
      gridLines.current.push(line);
      canvas.add(line);
      line.sendToBack();
    }

    canvas.renderAll();
  };

  const updateGridPosition = () => {
    if (!canvas) return;
    renderGrid(canvas);
  };

  const loadCanvasContent = async (canvas: fabric.Canvas) => {
    try {
      if (canvasData?.content) {
        canvas.loadFromJSON(canvasData.content, () => {
          canvas.renderAll();
          renderGrid(canvas);
          saveToHistory();
        });
      }
    } catch (error) {
      console.error('Error loading canvas:', error);
    }
  };

  const handleSave = async () => {
    if (!canvas) return;

    try {
      const canvasJSON = canvas.toJSON(['id', 'selectable', 'evented']);
      const { error } = await supabase
        .from('project_canvases')
        .update({ 
          content: canvasJSON,
          last_modified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', canvasData.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  };

  const handleZoomIn = () => {
    if (!canvas) return;
    const newZoom = Math.min(zoom + 0.1, 5);
    canvas.setZoom(newZoom);
    setZoom(newZoom);
    renderGrid(canvas);
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const newZoom = Math.max(zoom - 0.1, 0.1);
    canvas.setZoom(newZoom);
    setZoom(newZoom);
    renderGrid(canvas);
  };

  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const addShape = (shape: fabric.Object) => {
    if (!canvas) return;

    const center = canvas.getCenter();
    const zoom = canvas.getZoom();
    
    const left = snapToGrid(
      (center.left - shape.getScaledWidth() / 2 - canvas.viewportTransform![4]) / zoom
    );
    const top = snapToGrid(
      (center.top - shape.getScaledHeight() / 2 - canvas.viewportTransform![5]) / zoom
    );

    shape.set({ left, top });
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveToHistory();
  };

  const addRectangle = () => {
    const rect = new fabric.Rect({
      width: 100,
      height: 100,
      fill: '#4F46E5',
      opacity: 0.7,
      strokeWidth: 2,
      stroke: '#4338CA',
    });
    addShape(rect);
  };

  const addCircle = () => {
    const circle = new fabric.Circle({
      radius: 50,
      fill: '#10B981',
      opacity: 0.7,
      strokeWidth: 2,
      stroke: '#059669',
    });
    addShape(circle);
  };

  const addTriangle = () => {
    const triangle = new fabric.Triangle({
      width: 100,
      height: 100,
      fill: '#F59E0B',
      opacity: 0.7,
      strokeWidth: 2,
      stroke: '#D97706',
    });
    addShape(triangle);
  };

  const addHexagon = () => {
    const points = [
      { x: 50, y: 0 },
      { x: 100, y: 25 },
      { x: 100, y: 75 },
      { x: 50, y: 100 },
      { x: 0, y: 75 },
      { x: 0, y: 25 },
    ];

    const hexagon = new fabric.Polygon(points, {
      fill: '#8B5CF6',
      opacity: 0.7,
      strokeWidth: 2,
      stroke: '#7C3AED',
    });
    addShape(hexagon);
  };

  const addText = () => {
    if (!canvas) return;

    const center = canvas.getCenter();
    const zoom = canvas.getZoom();
    
    const left = snapToGrid(
      (center.left - 75 - canvas.viewportTransform![4]) / zoom
    );
    const top = snapToGrid(
      (center.top - 15 - canvas.viewportTransform![5]) / zoom
    );

    const text = new fabric.IText('Double click to edit', {
      left,
      top,
      fontSize: 24,
      fill: '#1F2937',
      fontFamily: 'sans-serif',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveToHistory();
  };

  const addStickyNote = () => {
    if (!canvas) return;

    const center = canvas.getCenter();
    const zoom = canvas.getZoom();
    const width = 200;
    const height = 200;
    
    const left = snapToGrid(
      (center.left - width / 2 - canvas.viewportTransform![4]) / zoom
    );
    const top = snapToGrid(
      (center.top - height / 2 - canvas.viewportTransform![5]) / zoom
    );

    const background = new fabric.Rect({
      left: 0,
      top: 0,
      width,
      height,
      fill: '#FEF3C7',
      stroke: '#D97706',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
    });

    const text = new fabric.IText('Double click to edit note', {
      left: 10,
      top: 10,
      width: width - 20,
      fontSize: 16,
      fill: '#1F2937',
      fontFamily: 'sans-serif',
      textAlign: 'left',
    });

    const stickyNote = new fabric.Group([background, text], {
      left,
      top,
      selectable: true,
      hasControls: true,
    });

    canvas.add(stickyNote);
    canvas.setActiveObject(stickyNote);
    canvas.renderAll();
    saveToHistory();
  };

  const addConnector = () => {
    if (!canvas) return;

    const center = canvas.getCenter();
    const zoom = canvas.getZoom();
    
    const left = snapToGrid(
      (center.left - 100 - canvas.viewportTransform![4]) / zoom
    );
    const top = snapToGrid(
      (center.top - canvas.viewportTransform![5]) / zoom
    );

    const line = new fabric.Line([left, top, left + 200, top], {
      stroke: '#4B5563',
      strokeWidth: 2,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
    saveToHistory();
  };

  const saveToHistory = () => {
    if (!canvas) return;
    
    const currentState = JSON.stringify(canvas.toJSON(['id', 'selectable', 'evented']));
    
    if (historyIndex.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex.current + 1);
    }
    
    history.current.push(currentState);
    historyIndex.current++;
    
    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);
  };

  const undo = () => {
    if (!canvas || historyIndex.current <= 0) return;
    
    historyIndex.current--;
    const previousState = history.current[historyIndex.current];
    canvas.loadFromJSON(previousState, () => {
      canvas.renderAll();
      setCanUndo(historyIndex.current > 0);
      setCanRedo(true);
    });
  };

  const redo = () => {
    if (!canvas || historyIndex.current >= history.current.length - 1) return;
    
    historyIndex.current++;
    const nextState = history.current[historyIndex.current];
    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      setCanUndo(true);
      setCanRedo(historyIndex.current < history.current.length - 1);
    });
  };

  const handleLinkToBacklog = () => {
    setShowLinkDialog(true);
  };

  const handleLinkDialogSubmit = async (data: {
    title: string;
    type: string;
    description: string;
    acceptance_criteria: string;
    story_points: number;
    priority: string;
    labels: string[];
    assignee: string;
    due_date: string;
    estimated_hours: number;
    status: string;
    parent_id: string | null;
  }) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    try {
      const { data: taskData, error: taskError } = await supabase
        .from('project_tasks')
        .insert({
          project_id: canvasData.project_id,
          ...data,
          linked_canvas_object_id: activeObject.data?.id
        })
        .select()
        .single();

      if (taskError) throw taskError;

      activeObject.setBacklogLink?.(taskData.id);
      canvas.renderAll();
      saveToHistory();
      await handleSave();

      setShowLinkDialog(false);
    } catch (error) {
      console.error('Error linking to backlog:', error);
    }
  };

  return (
    <div className="flex h-full">
      <CanvasLeftToolbar
        disabled={!canvas}
        onAddRectangle={addRectangle}
        onAddCircle={addCircle}
        onAddTriangle={addTriangle}
        onAddHexagon={addHexagon}
        onAddText={addText}
        onAddStickyNote={addStickyNote}
        onAddConnector={addConnector}
        onSelectPen={() => setActiveTool('pen')}
        onSelectEraser={() => setActiveTool('eraser')}
        onSelectHighlighter={() => setActiveTool('highlighter')}
        activeTool={activeTool}
      />
      <div className="flex-1">
        <CanvasTopToolbar
          disabled={!canvas}
          cursorMode={cursorMode}
          zoom={zoom}
          onCursorModeChange={setCursorMode}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onSave={handleSave}
          onLinkToBacklog={handleLinkToBacklog}
          canLinkToBacklog={canLinkToBacklog}
          brushColor={brushColor}
          brushWidth={brushWidth}
          onBrushColorChange={setBrushColor}
          onBrushWidthChange={setBrushWidth}
          showBrushControls={activeTool === 'pen'}
          highlighterColor={highlighterColor}
          highlighterOpacity={highlighterOpacity}
          onHighlighterColorChange={setHighlighterColor}
          onHighlighterOpacityChange={setHighlighterOpacity}
          showHighlighterControls={activeTool === 'highlighter'}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />
        <div className="flex-1 overflow-hidden p-4">
          <canvas ref={canvasRef} />
        </div>
      </div>
      {showLinkDialog && (
        <BacklogItemFormDialog
          isOpen={showLinkDialog}
          onClose={() => setShowLinkDialog(false)}
          onSubmit={handleLinkDialogSubmit}
          initialContent={canvas?.getActiveObject() instanceof fabric.IText ? canvas.getActiveObject().text : ''}
        />
      )}
    </div>
  );
}