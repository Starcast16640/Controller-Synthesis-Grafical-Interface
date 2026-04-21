import { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Edit } from 'lucide-react';

const TASK_BLOCK_WIDTH = 150;
const TASK_BLOCK_HEIGHT = 80;
const NODE_RADIUS = 25;

interface TaskPosition {
  id: string;
  x: number;
  y: number;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

const getDistanceToSegment = (p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) => {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2);
};

export function SuccessionView() {
  const {
    tasks,
    sensors,
    observers,
    updateTask,
    successionArrows,
    successionNodes,
    addSuccessionArrow,
    deleteSuccessionArrow,
    addSuccessionNode,
    updateSuccessionNode,
    deleteSuccessionNode,
  } = useData();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialErrorRef = useRef<HTMLInputElement>(null);
  const clickStartPos = useRef({ x: 0, y: 0 });
  const initialBtnRef = useRef<HTMLInputElement>(null);
  const [taskPositions, setTaskPositions] = useState<TaskPosition[]>([]);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [selectedElements, setSelectedElements] = useState<{ type: 'task' | 'node'; id: string } | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [nodeForm, setNodeForm] = useState({ name: '', expression: '', split_type: 'both' });
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ type: 'task' | 'node'; id: string; x: number; y: number } | null>(
    null
  );
  const [selectedForLink, setSelectedForLink] = useState<{ id: string; type: 'task' | 'node' }[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [hoveredArrowId, setHoveredArrowId] = useState<string | null>(null);
  const modalExprRef = useRef<HTMLTextAreaElement>(null);

  const insertInModal = (value: string) => {
    const el = modalExprRef.current;
    if (!el) return;

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const currentText = nodeForm.expression || '';
    const newText = currentText.substring(0, start) + value + currentText.substring(end);
    setNodeForm({ ...nodeForm, expression: newText });
    setTimeout(() => {
      el.focus();
      const newPos = start + value.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const getElementName = (type: 'task' | 'node', id: string) => {
    if (type === 'task') {
      const task = tasks.find((t) => t.id === id);
      return task ? task.name : 'Task deleted';
    } else {
      const node = successionNodes.find((n) => n.id === id);
      if (!node) return 'Node deleted';
      return `${node.name || 'Unnamed'} type : ${node.split_type === 'both' ? 'Both' : 'Only One'}`;
    }
  };

  const handleElementSelect = (id: string, type: 'task' | 'node') => {
    setSelectedForLink((prev) => {
      if (prev.find((p) => p.id === id)) {
        return prev.filter((p) => p.id !== id);
      }
      if (prev.length >= 2) {
        return [prev[0], { id, type }];
      }
      return [...prev, { id, type }];
    });
  };

  useEffect(() => {
    setTaskPositions((prevPositions) => {
      const validPositions = prevPositions.filter(pos => 
        tasks.some(task => task.id === pos.id)
      );
      
      const newPositions = [...validPositions];
      let hasChanges = validPositions.length !== prevPositions.length;

      tasks.forEach((task, idx) => {
        if (!newPositions.some((p) => p.id === task.id)) {
          const hasDBPos = task.position_x !== null && task.position_x !== undefined && task.position_x !== 0;
          
          if (hasDBPos) {
            newPositions.push({ id: task.id, x: task.position_x!, y: task.position_y! });
          } else {
            const cols = Math.ceil(Math.sqrt(tasks.length)) || 5;
            newPositions.push({
              id: task.id,
              x: (idx % cols) * (TASK_BLOCK_WIDTH + 40) + 20,
              y: Math.floor(idx / cols) * (TASK_BLOCK_HEIGHT + 40) + 20,
            });
          }
          hasChanges = true;
        }
      });

      return hasChanges ? newPositions : prevPositions;
    });
  }, [tasks]);

  useEffect(() => {
    setNodePositions((prevPositions) => {
      const validPositions = prevPositions.filter(pos => 
        successionNodes.some(node => node.id === pos.id)
      );
      const newPositions = [...validPositions];
      let hasChanges = validPositions.length !== prevPositions.length;

      successionNodes.forEach((node) => {
        if (!newPositions.some((p) => p.id === node.id)) {
          newPositions.push({ id: node.id, x: node.position_x, y: node.position_y });
          hasChanges = true;
        }
      });
      return hasChanges ? newPositions : prevPositions;
    });
  }, [successionNodes]);

  const getArrowCoords = (arrow: any) => {
  const fromPos = arrow.from_type === 'task' 
    ? taskPositions.find(p => p.id === arrow.from_id)
    : nodePositions.find(p => p.id === arrow.from_id);
    
  const toPos = arrow.to_type === 'task'
    ? taskPositions.find(p => p.id === arrow.to_id)
    : nodePositions.find(p => p.id === arrow.to_id);

  if (!fromPos || !toPos) return { fromX: null, fromY: null, toX: null, toY: null };

  const startX = arrow.from_type === 'task' ? fromPos.x + TASK_BLOCK_WIDTH / 2 : fromPos.x;
  const startY = arrow.from_type === 'task' ? fromPos.y + TASK_BLOCK_HEIGHT / 2 : fromPos.y;
  const endX = arrow.to_type === 'task' ? toPos.x + TASK_BLOCK_WIDTH / 2 : toPos.x;
  const endY = arrow.to_type === 'task' ? toPos.y + TASK_BLOCK_HEIGHT / 2 : toPos.y;

  const angle = Math.atan2(endY - startY, endX - startX);

  const getBoxIntersection = (cx: number, cy: number, isForward: boolean) => {
    const ang = isForward ? angle : angle + Math.PI;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const scale = Math.min(
      Math.abs((TASK_BLOCK_WIDTH / 2) / cos),
      Math.abs((TASK_BLOCK_HEIGHT / 2) / sin)
    );
    return { x: cx + cos * scale, y: cy + sin * scale };
  };
    
  const from = arrow.from_type === 'node' 
    ? { x: startX + Math.cos(angle) * NODE_RADIUS, y: startY + Math.sin(angle) * NODE_RADIUS }
    : getBoxIntersection(startX, startY, true);

  const to = arrow.to_type === 'node'
    ? { x: endX - Math.cos(angle) * NODE_RADIUS, y: endY - Math.sin(angle) * NODE_RADIUS }
    : getBoxIntersection(endX, endY, false);

  return { fromX: from.x, fromY: from.y, toX: to.x, toY: to.y };
};
  
 useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    successionArrows.forEach((arrow) => {
      const { fromX, fromY, toX, toY } = getArrowCoords(arrow);
      
      if (fromX !== null && fromY !== null && toX !== null && toY !== null) {
        const isHovered = isDeleteMode && arrow.id === hoveredArrowId;
        const color = isHovered ? '#ef4444' : '#3b82f6';
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 4 : 2;

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowSize = 15;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - arrowSize * Math.cos(angle - Math.PI / 6), toY - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - arrowSize * Math.cos(angle + Math.PI / 6), toY - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.fill();
      }
    });
  }, [successionArrows, taskPositions, nodePositions, isDeleteMode, hoveredArrowId]);

  const handleTaskMouseDown = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    clickStartPos.current = { x: e.clientX, y: e.clientY };
    const pos = taskPositions.find((p) => p.id === taskId);
    if (!pos) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setDraggingTaskId(taskId);
    setDragOffset({
      x: e.clientX - rect.left + container.scrollLeft - pos.x,
      y: e.clientY - rect.top + container.scrollTop - pos.y,
    });
  };

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleteMode) {
      deleteSuccessionNode(nodeId);
      return;
    }
    clickStartPos.current = { x: e.clientX, y: e.clientY };
    const pos = nodePositions.find((p) => p.id === nodeId);
    if (!pos) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX - rect.left + container.scrollLeft - pos.x,
      y: e.clientY - rect.top + container.scrollTop - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (isDeleteMode && container && !draggingTaskId && !draggingNodeId) {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + container.scrollLeft;
      const mouseY = e.clientY - rect.top + container.scrollTop;

      let foundArrowId = null;
      for (const arrow of successionArrows) {
        const { fromX, fromY, toX, toY } = getArrowCoords(arrow);
        if (fromX && fromY && toX && toY) {
          const dist = getDistanceToSegment(
            { x: mouseX, y: mouseY }, { x: fromX, y: fromY }, { x: toX, y: toY }
          );
          if (dist < 10) {
            foundArrowId = arrow.id;
            break;
          }
        }
      }
      setHoveredArrowId(foundArrowId);
    } else if (hoveredArrowId !== null) {
      setHoveredArrowId(null);
    }
    if (draggingTaskId) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newX = e.clientX - rect.left + container.scrollLeft - dragOffset.x;
      const newY = e.clientY - rect.top + container.scrollTop - dragOffset.y;

      setTaskPositions((prev) =>
        prev.map((p) => (p.id === draggingTaskId ? { ...p, x: Math.max(0, newX), y: Math.max(0, newY) } : p))
      );
    }
    
    if (draggingNodeId) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newX = e.clientX - rect.left + container.scrollLeft - dragOffset.x;
      const newY = e.clientY - rect.top + container.scrollTop - dragOffset.y;

      setNodePositions((prev) =>
        prev.map((p) => (p.id === draggingNodeId ? { ...p, x: Math.max(0, newX), y: Math.max(0, newY) } : p))
      );
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (!isDeleteMode) {
      setSelectedForLink([]);
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left + container.scrollLeft;
    const clickY = e.clientY - rect.top + container.scrollTop;

    for (const arrow of successionArrows) {
      const { fromX, fromY, toX, toY } = getArrowCoords(arrow);

      if (fromX && fromY && toX && toY) {
        const dist = getDistanceToSegment(
          { x: clickX, y: clickY },
          { x: fromX, y: fromY },
          { x: toX, y: toY }
        );
        
        if (dist < 10) {
          deleteSuccessionArrow(arrow.id);
          break;
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const distance = Math.sqrt(
      Math.pow(e.clientX - clickStartPos.current.x, 2) + 
      Math.pow(e.clientY - clickStartPos.current.y, 2)
    );
    if (distance < 5) {
      if (draggingTaskId) handleElementSelect(draggingTaskId, 'task');
      if (draggingNodeId) handleElementSelect(draggingNodeId, 'node');
    }
    try {
      if (draggingTaskId) {
        const pos = taskPositions.find((p) => p.id === draggingTaskId);
        if (pos) {
          updateTask(draggingTaskId, { 
            position_x: Math.round(pos.x), 
            position_y: Math.round(pos.y) 
          });
        }
      }
      if (draggingNodeId) {
        const finalPos = nodePositions.find((p) => p.id === draggingNodeId);
        if (finalPos) {
          updateSuccessionNode(draggingNodeId, { 
            position_x: Math.round(finalPos.x), 
            position_y: Math.round(finalPos.y) 
          });
        }
      }
    } finally {
      setDraggingTaskId(null);
      setDraggingNodeId(null);
    }
  };
  
  const handleCreateNode = () => {
    let maxNumber = 0;
    successionNodes.forEach((node) => {
      if (node.name) {
        const match = node.name.match(/^N(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) maxNumber = num;
        }
      }
    });
    const nextNumber = maxNumber + 1;
    addSuccessionNode({ 
      name: `N${nextNumber}`, 
      expression: '', 
      split_type: 'both', 
      position_x: 100, 
      position_y: 100 
    });
  };

  const handleCreateInitialState = () => {
    const hasInit = successionNodes.some(n => n.name === 'INIT');
    
    if (hasInit) {
      initialBtnRef.current?.setCustomValidity("Il ne peut y avoir qu'un seul état initial.");
      initialBtnRef.current?.reportValidity();
      return;
    }

    addSuccessionNode({ 
      name: 'INIT', expression: 'TRUE', split_type: 'both', 
      position_x: 50, position_y: 50 
    });
  };

  const getTaskTypeColor = (type: string[]) => {
    if (type.includes('reactivable')) return '#dcfce7';
    if (type.includes('pausable')) return '#fef3c7';
    if (type.includes('interruptible')) return '#fecaca';
    return '#dbeafe';
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Succession View</h2>
        <div className="flex gap-2">
          <div className="relative inline-block">
            <input 
              ref={initialBtnRef} 
              type="text" 
              className="absolute inset-0 opacity-0 pointer-events-none" 
              required
              onInvalid={(e) => e.preventDefault()}
              onChange={() => initialBtnRef.current?.setCustomValidity("")} 
            />
            <button
              onClick={handleCreateInitialState}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold shadow-md"
            >
              Add Initial State
            </button>
          </div>
          <button
            onClick={handleCreateNode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Node
          </button>
          <button
            onClick={() => {
              if (selectedForLink.length === 2) {
                addSuccessionArrow({
                  from_type: selectedForLink[0].type,
                  from_id: selectedForLink[0].id,
                  to_type: selectedForLink[1].type,
                  to_id: selectedForLink[1].id,
                });
                setSelectedForLink([]);
              }
            }}
            disabled={selectedForLink.length !== 2}
            className={`px-4 py-2 rounded-lg transition-colors font-bold ${
              selectedForLink.length === 2
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Draw Arrow {selectedForLink.length > 0 ? `(${selectedForLink.length}/2)` : ''}
          </button>
          <button
            onClick={() => {
              setIsDeleteMode(!isDeleteMode);
              if (!isDeleteMode) setIsDrawingArrow(false);
            }}
            className={`px-4 py-2 rounded-lg transition-colors font-bold flex items-center gap-2 border-2 ${
              isDeleteMode
                ? 'bg-red-100 text-red-700 border-red-600 shadow-inner'
                : 'bg-white text-red-500 border-red-200 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Delete Mode
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div
          ref={containerRef}
          className={`w-full h-full relative overflow-auto ${isDeleteMode ? 'cursor-crosshair' : ''}`}
          onMouseDown={handleContainerMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas ref={canvasRef} width={2000} height={2000} className="absolute top-0 left-0 pointer-events-none" />

          {taskPositions.map((pos) => {
            const task = tasks.find((t) => t.id === pos.id);
            if (!task) return null;
            return (
              <div
                key={pos.id}
                className={`absolute rounded-lg p-2 border-2 cursor-move transition duration-200 ${
                  selectedForLink.find((s) => s.id === pos.id)
                    ? 'border-blue-500 ring-4 ring-blue-300 shadow-lg scale-105'
                    : 'border-gray-400 hover:border-gray-600'
                }`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${TASK_BLOCK_WIDTH}px`,
                  height: `${TASK_BLOCK_HEIGHT}px`,
                  backgroundColor: getTaskTypeColor(task.type),
                  userSelect: 'none',
                }}
                onMouseDown={(e) => handleTaskMouseDown(pos.id, e)}
              >
                <div className="text-xs font-bold text-gray-900 truncate">{task.name}</div>
                <div className="text-xs text-gray-600 mt-1">{task.type.join(', ')}</div>
                <div className="text-xs text-gray-500 mt-2">Priority: {task.priority}</div>
              </div>
            );
          })}

          {nodePositions.map((pos) => {
            const node = successionNodes.find((n) => n.id === pos.id);
            if (!node) return null;
            const isSelected = selectedForLink.some((s) => s.id === pos.id);
            const isInit = node.name === 'INIT';
            return (
              <div
                key={pos.id}
                className={`absolute rounded-full flex items-center justify-center shadow-md transition z-10 ${
                  isDeleteMode 
                    ? 'bg-red-200 border-2 border-red-500 cursor-crosshair' 
                    : isSelected
                      ? 'bg-blue-200 border-4 border-blue-600 scale-110 shadow-lg' 
                      : isInit 
                        ? 'bg-emerald-400 border-double border-4 border-emerald-700'
                        : 'bg-yellow-300 border-2 border-yellow-600 cursor-pointer hover:bg-yellow-400'
                }`}
                style={{
                  left: `${pos.x - NODE_RADIUS}px`,
                  top: `${pos.y - NODE_RADIUS}px`,
                  width: `${NODE_RADIUS * 2}px`,
                  height: `${NODE_RADIUS * 2}px`,
                  userSelect: 'none',
                }}
                onMouseDown={(e) => handleNodeMouseDown(pos.id, e)}
                onContextMenu={(e) => {
                  if (isDeleteMode) return;
                  e.preventDefault();
                  setEditingNode(pos.id);
                  setNodeForm({ 
                    name: node.name || 'N', 
                    expression: node.expression, 
                    split_type: node.split_type 
                  });
                }}
              >
                <span className={`font-bold pointer-events-none ${isInit ? 'text-[9px] text-emerald-900' : 'text-sm text-yellow-900'}`}>
                  {isInit ? 'INIT' : (node.split_type === 'both' ? '⊕' : '|')}
                </span>
                <div 
                  className="absolute top-full mt-1 left-1/2 -translate-x-1/2"
                  onMouseDown={(e) => e.stopPropagation()}
                  >
                  {editingNameId === pos.id ? (
                    <input
                      autoFocus
                      className="text-xs border border-blue-400 rounded px-1 w-16 text-center"
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onBlur={() => {
                        updateSuccessionNode(pos.id, { name: editingNameValue });
                        setEditingNameId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateSuccessionNode(pos.id, { name: editingNameValue });
                          setEditingNameId(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingNameId(null);
                        }
                      }}
                    />
                  ) : (
                    <span 
                      className="text-[10px] font-bold text-gray-600 bg-white/80 px-1 rounded whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingNameId(pos.id);
                        setEditingNameValue(node.name || '');
                      }}
                    >
                      {node.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>

      {editingNode && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Node</h3>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Node Name</label>
            <input
              type="text"
              placeholder="Node Name"
              value={nodeForm.name}
              onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Authorization Logic</label>
            <textarea
              ref={modalExprRef}
              placeholder="Node Expression"
              value={nodeForm.expression}
              onChange={(e) => setNodeForm({ ...nodeForm, expression: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm mb-4 resize-none"
              rows={3}
            />
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Helper Tools</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['AND', 'OR', 'NOT', 'XOR'].map(op => (
                  <button key={op} type="button" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertInModal(` ${op} `)}
                    className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-500 hover:bg-gray-100">
                    {op}
                  </button>
                ))}
                
                {['(', ')', '↑', '↓', '>', '<', '=', '!=', '[', ']'].map(op => (
                  <button key={op} type="button" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertInModal(op)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100">
                    {op}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {sensors.map(s => (
                  <button key={s.id} type="button" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertInModal(s.name)}
                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                    {s.name}
                  </button>
                ))}
                
                {observers.filter(o => o.id !== editingNode).map(o => (
                  <button key={o.id} type="button" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertInModal(o.name)}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                    {o.name}
                  </button>
                ))}
                {tasks.map(t => (
                  <button key={t.id} type="button" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertInModal(t.name)}
                    className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] border border-purple-200 hover:bg-purple-100">
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Split Type (Execution Mode)</label>
            <select
              value={nodeForm.split_type}
              onChange={(e) => setNodeForm({ ...nodeForm, split_type: e.target.value as 'both' | 'only_one' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            >
              <option value="both">Both (⊕)</option>
              <option value="only_one">Only One (|)</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateSuccessionNode(editingNode, nodeForm);
                  setEditingNode(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  deleteSuccessionNode(editingNode);
                  setEditingNode(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setEditingNode(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}      
    </div>
  );
}
