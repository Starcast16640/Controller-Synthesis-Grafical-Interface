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
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ type: 'task' | 'node'; id: string; x: number; y: number } | null>(
    null
  );

  const getElementName = (type: 'task' | 'node', id: string) => {
    if (type === 'task') {
      const task = tasks.find((t) => t.id === id);
      return task ? task.name : 'Task deleted';
    } else {
      const nodeIndex = successionNodes.findIndex((n) => n.id === id);
      
      if (nodeIndex === -1) return 'Node deleted';
      
      const node = successionNodes[nodeIndex];
      if (node.name && node.name.trim() !== '') {
        return `${node.name} type : ${node.split_type === 'both' ? 'Both' : 'Only One'}`;
      }
      const nodeNumber = nodeIndex + 1;
      return node.split_type === 'both' 
        ? `N${nodeNumber} type : Both` 
        : `N${nodeNumber} type : Only One`;
    }
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
    if (nodePositions.length === 0 && successionNodes.length > 0) {
      const newPositions = successionNodes.map((node) => ({
        id: node.id,
        x: node.position_x,
        y: node.position_y,
      }));
      setNodePositions(newPositions);
    }
  }, [successionNodes, nodePositions.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    successionArrows.forEach((arrow) => {
      let fromX = 0,
        fromY = 0,
        toX = 0,
        toY = 0;

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

      if (fromX && fromY && toX && toY) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowSize = 15;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - arrowSize * Math.cos(angle - Math.PI / 6), toY - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - arrowSize * Math.cos(angle + Math.PI / 6), toY - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.fill();
      }
    });

    if (isDrawingArrow && arrowStart) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(arrowStart.x, arrowStart.y);
      ctx.lineTo(containerRef.current?.scrollLeft ?? 0, containerRef.current?.scrollTop ?? 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [successionArrows, taskPositions, nodePositions, isDrawingArrow, arrowStart]);

  const handleTaskMouseDown = (taskId: string, e: React.MouseEvent) => {
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

      updateSuccessionNode(draggingNodeId, { position_x: newX, position_y: newY });
    }
  };

  const handleMouseUp = () => {
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
    addSuccessionNode({ expression: '', split_type: 'both', position_x: 100, position_y: 100 });
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
              setIsDrawingArrow(false);
              setArrowStart(null);
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDrawingArrow
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {isDrawingArrow ? 'Cancel Arrow' : 'Draw Arrow'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full relative overflow-auto"
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
                className="absolute rounded-lg p-2 border-2 border-gray-400 hover:border-gray-600 cursor-move"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${TASK_BLOCK_WIDTH}px`,
                  height: `${TASK_BLOCK_HEIGHT}px`,
                  backgroundColor: getTaskTypeColor(task.type),
                  userSelect: 'none',
                }}
                onMouseDown={(e) => handleTaskMouseDown(pos.id, e)}
                onDoubleClick={() => handleTaskDoubleClick(pos.id)}
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
                className="absolute flex items-center justify-center cursor-move"
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
                  className="w-full h-full rounded-full bg-yellow-300 border-2 border-yellow-600 flex items-center justify-center cursor-pointer hover:bg-yellow-400 relative shadow-sm"
                  onContextMenu={(e) => {
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
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateSuccessionNode(pos.id, { name: editingNameValue });
                          setEditingNameId(null);
                        }
                        if (e.key === 'Escape') setEditingNameId(null);
                      }}
                    />
                  ) : (
                    <span
                      className="text-xs font-bold text-gray-700 bg-white/80 px-1 rounded cursor-text hover:bg-blue-100 transition-colors whitespace-nowrap"
                      onMouseDown={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingNameId(pos.id);
                        setEditingNameValue(node.name || `N${nodeIndex + 1}`);
                      }}
                    >
                      {node.name || `N${nodeIndex + 1}`}
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
      {successionArrows.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-md p-4 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Succession Table</h3>
          <div className="overflow-x-auto max-h-48 overflow-y-auto border border-gray-200 rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {successionArrows.map((arrow) => (
                  <tr key={arrow.id} className="hover:bg-red-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getElementName(arrow.from_type, arrow.from_id)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      → {getElementName(arrow.to_type, arrow.to_id)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => deleteSuccessionArrow(arrow.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer la flèche"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
    </div>
  );
}
