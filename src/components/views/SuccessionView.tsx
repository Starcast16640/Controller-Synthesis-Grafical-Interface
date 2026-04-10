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
  const [selectedForLink, setSelectedForLink] = useState<{ id: string; type: 'task' | 'node' }[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [hoveredArrowId, setHoveredArrowId] = useState<string | null>(null);

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
    if (taskPositions.length === 0 && tasks.length > 0) {
      const cols = Math.ceil(Math.sqrt(tasks.length));
      const newPositions = tasks.map((task, idx) => ({
        id: task.id,
        x: (idx % cols) * (TASK_BLOCK_WIDTH + 40) + 20,
        y: Math.floor(idx / cols) * (TASK_BLOCK_HEIGHT + 40) + 20,
      }));
      setTaskPositions(newPositions);
    }
  }, [tasks, taskPositions.length]);

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
    let fromX = 0, fromY = 0, toX = 0, toY = 0;

    if (arrow.from_type === 'task') {
      const from = taskPositions.find((p) => p.id === arrow.from_id);
      if (from) {
        fromX = from.x + TASK_BLOCK_WIDTH / 2;
        fromY = from.y + TASK_BLOCK_HEIGHT;
      }
    } else {
      const from = nodePositions.find((p) => p.id === arrow.from_id);
      if (from) {
        fromX = from.x;
        fromY = from.y;
      }
    }

    if (arrow.to_type === 'task') {
      const to = taskPositions.find((p) => p.id === arrow.to_id);
      if (to) {
        toX = to.x + TASK_BLOCK_WIDTH / 2;
        toY = to.y;
      }
    } else {
      const to = nodePositions.find((p) => p.id === arrow.to_id);
      if (to) {
        toX = to.x;
        toY = to.y;
      }
    }
    return { fromX, fromY, toX, toY };
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    successionArrows.forEach((arrow) => {
      const { fromX, fromY, toX, toY } = getArrowCoords(arrow);
      if (fromX && fromY && toX && toY) {
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
  }, [successionArrows, taskPositions, nodePositions, isDrawingArrow, arrowStart, isDeleteMode, hoveredArrowId]);

  const handleTaskMouseDown = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDeleteMode) {
      handleElementSelect(taskId, 'task');
    }
    const pos = taskPositions.find((p) => p.id === taskId);
    if (!pos) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setDraggingTaskId(taskId);
    setDragOffset({
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y,
    });
  };

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleteMode) {
      deleteSuccessionNode(nodeId);
      return;
    }
    handleElementSelect(nodeId, 'node');
    const pos = nodePositions.find((p) => p.id === nodeId);
    if (!pos) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y,
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
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      setTaskPositions((prev) =>
        prev.map((p) => (p.id === draggingTaskId ? { ...p, x: Math.max(0, newX), y: Math.max(0, newY) } : p))
      );
    }
    
    if (draggingNodeId) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

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

  const handleMouseUp = () => {
    if (draggingNodeId) {
      const finalPos = nodePositions.find((p) => p.id === draggingNodeId);
      if (finalPos) {
        updateSuccessionNode(draggingNodeId, { position_x: finalPos.x, position_y: finalPos.y });
      }
    }
    setDraggingTaskId(null);
    setDraggingNodeId(null);
  };

  const handleTaskDoubleClick = (taskId: string) => {
    if (!arrowStart) {
      setArrowStart({ type: 'task', id: taskId, x: 0, y: 0 });
      setIsDrawingArrow(true);
    } else {
      addSuccessionArrow({
        from_type: arrowStart.type,
        from_id: arrowStart.id,
        to_type: 'task',
        to_id: taskId,
      });
      setIsDrawingArrow(false);
      setArrowStart(null);
    }
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    if (!arrowStart) {
      setArrowStart({ type: 'node', id: nodeId, x: 0, y: 0 });
      setIsDrawingArrow(true);
    } else {
      addSuccessionArrow({
        from_type: arrowStart.type,
        from_id: arrowStart.id,
        to_type: 'node',
        to_id: nodeId,
      });
      setIsDrawingArrow(false);
      setArrowStart(null);
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
                className={`absolute rounded-lg p-2 border-2 cursor-move transition-all duration-200 ${
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
            const nodeIndex = successionNodes.findIndex((n) => n.id === pos.id);
            const nodeNumber = nodeIndex + 1;
            return (
              <div
                key={pos.id}
                className={`w-full h-full rounded-full flex items-center justify-center relative shadow-sm transition-all duration-200 ${
                    isDeleteMode 
                      ? 'bg-red-200 border-2 border-red-500 cursor-crosshair hover:bg-red-400 hover:scale-110' 
                      : selectedForLink.find((s) => s.id === pos.id)
                        ? 'bg-blue-200 border-4 border-blue-600 scale-110 shadow-lg'
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
              >
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center relative shadow-sm transition-colors ${
                    isDeleteMode 
                      ? 'bg-red-200 border-2 border-red-500 cursor-crosshair hover:bg-red-400 hover:scale-110' 
                      : 'bg-yellow-300 border-2 border-yellow-600 cursor-pointer hover:bg-yellow-400'
                  }`}
                  onContextMenu={(e) => {
                    if (isDeleteMode) return;
                    e.preventDefault();
                    setEditingNode(pos.id);
                    const defaultName = node.name || `N${nodeIndex + 1}`;
                    setNodeForm({ name: defaultName, expression: node.expression, split_type: node.split_type });
                  }}
                  onDoubleClick={() => handleNodeDoubleClick(pos.id)}
                >
                  <span className="text-xs font-bold text-yellow-900">{node.split_type === 'both' ? '⊕' : '|'}</span>
                </div>
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2">
                  {editingNameId === pos.id ? (
                    <input
                      autoFocus
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
                        if (e.key === 'Escape') setEditingNameId(null);
                      }}
                      className="text-xs border border-blue-400 rounded px-1 w-20 text-center shadow-sm outline-none"
                    />
                  ) : (
                    <span
                      className="text-xs font-bold text-gray-700 bg-white/80 px-1 rounded cursor-text hover:bg-blue-100 transition-colors whitespace-nowrap"
                      onMouseDown={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingNameId(pos.id);
                        setEditingNameValue(node.name || `Unamed`);
                      }}
                    >
                      {node.name || 'Unamed'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingNode && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Node</h3>
            <input
              type="text"
              placeholder="Node Name"
              value={nodeForm.name}
              onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <textarea
              placeholder="Node Expression"
              value={nodeForm.expression}
              onChange={(e) => setNodeForm({ ...nodeForm, expression: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              rows={3}
            />
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
