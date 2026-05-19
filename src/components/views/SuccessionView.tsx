import { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Edit } from 'lucide-react';
import { analyzeExpression } from '../../lib/expressionParser';

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
    counters,
    updateTask,
    successionArrows,
    successionNodes,
    addSuccessionArrow,
    deleteSuccessionArrow,
    addSuccessionNode,
    updateSuccessionNode,
    deleteSuccessionNode,
    successionModules, 
    addSuccessionModule, 
    updateSuccessionModule, 
    deleteSuccessionModule,
    showNotify
  } = useData();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clickStartPos = useRef({ x: 0, y: 0 });
  const [taskPositions, setTaskPositions] = useState<TaskPosition[]>([]);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [selectedElements, setSelectedElements] = useState<{ type: 'task' | 'node'; id: string } | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [nodeForm, setNodeForm] = useState({ name: '', expression: '', split_type: 'none', is_initial: false, out_expressions: {} });
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ type: 'task' | 'node'; id: string; x: number; y: number } | null>(
    null
  );
  const [selectedForLink, setSelectedForLink] = useState<{ id: string; type: 'task' | 'node' }[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [hoveredArrowId, setHoveredArrowId] = useState<string | null>(null);
  const [diag, setDiag] = useState({ isValid: true, errorMessage: "", errorPos: 0 });
  const [newModuleName, setModuleName] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [editingModuleId, setEditingIdModule] = useState<string | null>(null);
  const [sourceTasks, setSourceTasks] = useState<string[]>([]);
  const [targetTasks, setTargetTasks] = useState<string[]>([]);
  const [activeModalField, setActiveModalField] = useState<string>('main');
  const modalExprRef = useRef<HTMLTextAreaElement>(null);

  const insertInModal = (value: string) => {
    if (activeModalField === 'main') {
      const el = modalExprRef.current;
      if (!el) return;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const currentText = nodeForm.expression || '';
      const newText = currentText.substring(0, start) + value + currentText.substring(end);
      setNodeForm({ ...nodeForm, expression: newText });
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + value.length, start + value.length);
      }, 0);
    }
    else {
      const currentText = (nodeForm.out_expressions as any)?.[activeModalField] || '';
      setNodeForm({
        ...nodeForm,
        out_expressions: { ...(nodeForm.out_expressions as any), [activeModalField]: currentText + value }
      });
    }
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
    const currentModule = successionModules.find(m => m.id === activeModuleId);
    
    let isSource = false;
    let isTarget = false;
    if (type === 'task' && currentModule) {
      isSource = currentModule.source_ids?.includes(id) || false;
      isTarget = currentModule.target_ids?.includes(id) || false;
    }
    const isBoth = isSource && isTarget;
    setSelectedForLink((prev) => {
      if (prev.find((p) => p.id === id)) {
        return prev.filter((p) => p.id !== id);
      }
      if (prev.length === 0) {
        if (isTarget && !isBoth) {
          showNotify("Une Target pure ne peut pas émettre de flèche.", "error");
          return prev;
        }
        return [{ id, type }];
      }
      if (prev.length === 1) {
        if (isSource && !isBoth) {
          showNotify("Une Source pure ne peut pas recevoir de flèche.", "error");
          return prev;
        }
        return [prev[0], { id, type }];
      }
      return [prev[0], { id, type }];
    });
  };

  useEffect(() => {
    setSourceTasks(prev => prev.filter(id => tasks.some(t => t.id === id)));
    setTargetTasks(prev => prev.filter(id => tasks.some(t => t.id === id)));
  }, [tasks]);

  useEffect(() => {
    if (!activeModuleId) return;

    const currentModule = successionModules.find(m => m.id === activeModuleId);
    if (!currentModule) return;

    const savedPositions = JSON.parse(localStorage.getItem('local_task_positions') || '{}');

    setTaskPositions((prev) => {
      const newPos = [...prev];
      const containerWidth = containerRef.current?.clientWidth || 800;
      const maxCols = Math.max(1, Math.floor(containerWidth / (TASK_BLOCK_WIDTH + 40)));
      const sources = currentModule.source_ids || [];
      sources.forEach((taskId, idx) => {
        const localId = `${activeModuleId}_${taskId}`;
        if (!newPos.find(p => p.id === localId)) {
          if (savedPositions[localId]) {
            newPos.push({ id: localId, x: savedPositions[localId].x, y: savedPositions[localId].y });
          } else {
            newPos.push({
              id: localId,
              x: (idx % maxCols) * (TASK_BLOCK_WIDTH + 40) + 40,
              y: Math.floor(idx / maxCols) * (TASK_BLOCK_HEIGHT + 40) + 40,
            });
          }
        }
      });
      const targets = currentModule.target_ids || [];
      targets.forEach((taskId, idx) => {
        const localId = `${activeModuleId}_${taskId}`;
        if (!newPos.find(p => p.id === localId)) {
          if (savedPositions[localId]) {
            newPos.push({ id: localId, x: savedPositions[localId].x, y: savedPositions[localId].y });
          } else {
            const sourceRows = Math.ceil(sources.length / maxCols);
            const startY = 40 + (sourceRows * (TASK_BLOCK_HEIGHT + 40)) + 300; 

            newPos.push({
              id: localId,
              x: (idx % maxCols) * (TASK_BLOCK_WIDTH + 40) + 40,
              y: startY + Math.floor(idx / maxCols) * (TASK_BLOCK_HEIGHT + 40),
            });
          }
        }
      });

      return newPos;
    });
    setNodePositions((prev) => {
      const newPos = [...prev];
      const moduleNodes = successionNodes.filter(n => n.module_id === activeModuleId);
      
      moduleNodes.forEach((node) => {
        if (!newPos.some(p => p.id === node.id)) {
           newPos.push({ id: node.id, x: node.position_x, y: node.position_y });
        }
      });
      return newPos;
    });
  }, [activeModuleId, successionModules, successionNodes]);

  useEffect(() => {
    const allValidNames = [
      ...sensors.map(s => s.name),
      ...observers.map(o => o.name),
      ...tasks.map(t => t.name),
      ...counters.map(c => c.name),
      'TRUE', 'FALSE', 'AUTO'
    ];
    const onlyCounterNames = counters.map(c => c.name);
    const result = analyzeExpression(nodeForm.expression || '', allValidNames, onlyCounterNames);

    setDiag({
      isValid: result.isValid,
      errorMessage: result.errorMessage || "",
      errorPos: result.errorPos || 0
    });
  }, [nodeForm.expression, sensors, observers, tasks, counters]);

  const getArrowCoords = (arrow: any) => {
    if (arrow.module_id !== activeModuleId) return { fromX: null, fromY: null, toX: null, toY: null, angle: null };

    const fromPos = arrow.from_type === 'task' 
      ? taskPositions.find(p => p.id === `${activeModuleId}_${arrow.from_id}`)
      : nodePositions.find(p => p.id === arrow.from_id);
      
    const toPos = arrow.to_type === 'task'
      ? taskPositions.find(p => p.id === `${activeModuleId}_${arrow.to_id}`)
      : nodePositions.find(p => p.id === arrow.to_id);

    if (!fromPos || !toPos) return { fromX: null, fromY: null, toX: null, toY: null, angle: null };
    const startX = arrow.from_type === 'task' ? fromPos.x + TASK_BLOCK_WIDTH / 2 : fromPos.x;
    const startY = arrow.from_type === 'task' ? fromPos.y + TASK_BLOCK_HEIGHT / 2 : fromPos.y;
    const endX = arrow.to_type === 'task' ? toPos.x + TASK_BLOCK_WIDTH / 2 : toPos.x;
    const endY = arrow.to_type === 'task' ? toPos.y + TASK_BLOCK_HEIGHT / 2 : toPos.y;

    const angle = Math.atan2(endY - startY, endX - startX);
    const isBidirectional = successionArrows.some(a => 
      a.module_id === arrow.module_id && a.from_id === arrow.to_id && a.to_id === arrow.from_id
    );
    const gap = isBidirectional ? 12 : 0;
    const getIntersection = (cx: number, cy: number, isTask: boolean, isForward: boolean) => {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const ox = gap * nx;
      const oy = gap * ny;
      let t = 0;
      if (!isTask) {
        const dist = Math.sqrt(Math.max(0, NODE_RADIUS * NODE_RADIUS - gap * gap));
        t = isForward ? dist : -dist;
      } else {
        const halfW = TASK_BLOCK_WIDTH / 2;
        const halfH = TASK_BLOCK_HEIGHT / 2;
        
        let tx = Infinity;
        if (Math.abs(ux) > 0.0001) {
          const targetX = isForward ? Math.sign(ux) * halfW : -Math.sign(ux) * halfW;
          tx = (targetX - ox) / ux;
        }
        let ty = Infinity;
        if (Math.abs(uy) > 0.0001) {
          const targetY = isForward ? Math.sign(uy) * halfH : -Math.sign(uy) * halfH;
          ty = (targetY - oy) / uy;
        }
        
        t = isForward ? Math.min(tx > 0 ? tx : Infinity, ty > 0 ? ty : Infinity) 
                      : Math.max(tx < 0 ? tx : -Infinity, ty < 0 ? ty : -Infinity);
      }

      return { x: cx + ox + t * ux, y: cy + oy + t * uy };
    };

    const from = getIntersection(startX, startY, arrow.from_type === 'task', true);
    const to = getIntersection(endX, endY, arrow.to_type === 'task', false);

    return { fromX: from.x, fromY: from.y, toX: to.x, toY: to.y, angle };
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
        const tipAngle = Math.atan2(toY - fromY, toX - fromX);
        const arrowSize = 15;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - arrowSize * Math.cos(tipAngle - Math.PI / 6), toY - arrowSize * Math.sin(tipAngle - Math.PI / 6));
        ctx.lineTo(toX - arrowSize * Math.cos(tipAngle + Math.PI / 6), toY - arrowSize * Math.sin(tipAngle + Math.PI / 6));
        ctx.fill();
      }
    });
  }, [successionArrows, taskPositions, nodePositions, isDeleteMode, hoveredArrowId]);

  const handleTaskMouseDown = (localId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    
    const originalTaskId = localId.split('_')[1];
    clickStartPos.current = { x: e.clientX, y: e.clientY };
    const pos = taskPositions.find((p) => p.id === localId);
    if (!pos) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setDraggingTaskId(localId); 
    setDragOffset({
      x: e.clientX - rect.left + container.scrollLeft - pos.x,
      y: e.clientY - rect.top + container.scrollTop - pos.y,
    });
  };

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
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
      if (draggingTaskId) {
        const originalTaskId = draggingTaskId.split('_')[1];
        handleElementSelect(originalTaskId, 'task');
      }
      if (draggingNodeId) handleElementSelect(draggingNodeId, 'node');
    }
    try {
      if (draggingTaskId) {
        const pos = taskPositions.find((p) => p.id === draggingTaskId);
        if (pos) {
          const savedPositions = JSON.parse(localStorage.getItem('local_task_positions') || '{}');
          savedPositions[draggingTaskId] = { x: Math.round(pos.x), y: Math.round(pos.y) };
          localStorage.setItem('local_task_positions', JSON.stringify(savedPositions));
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
      split_type: 'none', 
      position_x: 100, 
      position_y: 100,
      module_id: activeModuleId
    });
  };

  const handleCreateModule = () => {
    if (!newModuleName.trim()) {
      showNotify("Please enter a module name.", "error");
      return;
    }
    if (sourceTasks.length === 0 || targetTasks.length === 0) {
      showNotify("Select at least 1 Source and 1 Target task.", "error");
      return;
    }
    const nameExists = successionModules.some(m => m.name.toLowerCase() === newModuleName.trim().toLowerCase());
    if (nameExists) {
      showNotify(`The name "${newModuleName}" is already used for a module.`, "error");
      return;
    }
    const sortedSrc = [...sourceTasks].sort();
    const sortedTgt = [...targetTasks].sort();
    
    const groupExists = successionModules.some(m => 
      JSON.stringify([...(m.source_ids || [])].sort()) === JSON.stringify(sortedSrc) &&
      JSON.stringify([...(m.target_ids || [])].sort()) === JSON.stringify(sortedTgt)
    );

    if (groupExists) {
      showNotify("A module with this exact set of Sources and Targets already exists.", "error");
      return;
    }
    addSuccessionModule({
      name: newModuleName.trim(),
      source_ids: sourceTasks,
      target_ids: targetTasks
    });
    
    setModuleName('');
    setSourceTasks([]);
    setTargetTasks([]);
  };

  const handleUpdateModule = () => {
    if (!newModuleName.trim() || sourceTasks.length === 0 || targetTasks.length === 0) return;
    
    updateSuccessionModule(editingModuleId, { 
      name: newModuleName.trim(), 
      source_ids: sourceTasks, 
      target_ids: targetTasks 
    });
    
    setEditingIdModule(null);
    setModuleName('');
    setSourceTasks([]);
    setTargetTasks([]);
  };

  const handleOpenModule = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setIsDeleteMode(false);
  };

  const handleCloseModule = () => {
    setActiveModuleId(null);
    setSelectedForLink([]);
  };

  const getTaskTypeColor = (type: string[]) => {
    if (type.includes('reactivable')) return '#dcfce7';
    if (type.includes('pausable')) return '#fef3c7';
    if (type.includes('interruptible')) return '#fecaca';
    return '#dbeafe';
  };

  const outgoingArrows = editingNode 
    ? successionArrows.filter(a => a.from_id === editingNode)
    : [];

return (
  <div className="p-6 h-full flex flex-col overflow-hidden">
    {!activeModuleId ? (
      <div className="flex flex-col h-full animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Succession Modules</h2>
        
        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="w-1/3 bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">New Module Name</label>
            <input 
              type="text" 
              placeholder="ex : MainCycle" 
              value={newModuleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex-1 flex gap-5 overflow-hidden mb-4">
              <div className="flex-1 flex flex-col overflow-hidden">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center border-b border-gray-100 pb-1">
                  Sources
                </label>
                <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-2 pl-1">
                  {tasks.map(t => {
                    const isTarget = targetTasks.includes(t.id);
                  
                    return (
                      <button key={`src_${t.id}`} 
                        onClick={() => sourceTasks.includes(t.id) ? setSourceTasks(sourceTasks.filter(id => id !== t.id)) : setSourceTasks([...sourceTasks, t.id])}
                        className={`w-full text-left px-3 py-2 rounded text-[16px] font-bold transition border ${
                          sourceTasks.includes(t.id) 
                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-md -translate-x-1' 
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50'
                        }`}>
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center border-b border-gray-100 pb-1">
                  Targets
                </label>
                <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-2 pl-1">
                  {tasks.map(t => {
                    const isSource = sourceTasks.includes(t.id);
                  
                    return (
                      <button key={`tgt_${t.id}`}
                        onClick={() => targetTasks.includes(t.id) ? setTargetTasks(targetTasks.filter(id => id !== t.id)) : setTargetTasks([...targetTasks, t.id])}
                        className={`w-full text-left px-3 py-2 rounded text-[16px] font-bold transition border ${
                          targetTasks.includes(t.id) 
                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-md -translate-x-1' 
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50'
                        }`}>
                        {t.name}
                      </button> 
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <button 
                onClick={editingModuleId ? handleUpdateModule : handleCreateModule} 
                disabled={!newModuleName || sourceTasks.length === 0 || targetTasks.length === 0}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-30 uppercase text-[10px] shadow-sm transition-colors"
              >
                {editingModuleId ? `Update Module` : `Create Module`}
              </button>
              {editingModuleId && (
                <button 
                  onClick={() => { 
                    setEditingIdModule(null); 
                    setModuleName(''); 
                    setSourceTasks([]);
                    setTargetTasks([]);
                  }} 
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 uppercase text-[10px] shadow-sm transition-colors"
                >
                  Cancel
                </button>
              )}
              
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Existing Modules</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-gray-100">
                  {successionModules.map((mod) => (
                    <tr key={mod.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-1000 text-sm mb-1">{mod.name}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap gap-1">
                            {mod.source_ids?.map(id => (
                              <span key={`s_${id}`} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black border border-blue-100 uppercase">
                                {tasks.find(t => t.id === id)?.name || '?'}
                              </span>
                            ))}
                          </div>
                          <span className="text-indigo-500 text-xs font-black">➔</span> 
                          <div className="flex flex-wrap gap-1">
                            {mod.target_ids?.map(id => (
                              <span key={`t_${id}`} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-black border border-indigo-100 uppercase">
                                {tasks.find(t => t.id === id)?.name || '?'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenModule(mod.id)} className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 shadow-sm uppercase">Open Graph</button>
                          <button
                            onClick={() => {
                              setEditingIdModule(mod.id);
                              setModuleName(mod.name);
                              setSourceTasks([...(mod.source_ids || [])]);
                              setTargetTasks([...(mod.target_ids || [])]);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4 ml-4"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteSuccessionModule(mod.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Succession View</h2>
          <button 
            onClick={() => setActiveModuleId(null)}
            className="mt-2 text-[10px] font-black text-blue-600 hover:underline uppercase"
          >
            ← Back to modules list
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">
          💡 Tip: Right-click on a node to edit its properties.
        </p>
        </div>
        <div className="flex gap-4 mb-3">
          <button
            onClick={handleCreateNode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Node
          </button>
          <button
            onClick={() => {
              if (selectedForLink.length === 2) {
                const currentModule = successionModules.find(m => m.id === activeModuleId);
                const fromId = selectedForLink[0].id;
                const toId = selectedForLink[1].id;
                if (currentModule) {
                  if (selectedForLink[0].type === 'task') {
                    const isSource = currentModule.source_ids?.includes(fromId);
                    const isTarget = currentModule.target_ids?.includes(fromId);
                    if (isTarget && !isSource) {
                      showNotify("Action bloquée : Une Target pure ne peut pas émettre.", "error");
                      setSelectedForLink([]);
                      return;
                    }
                  }
                  if (selectedForLink[1].type === 'task') {
                    const isSource = currentModule.source_ids?.includes(toId);
                    const isTarget = currentModule.target_ids?.includes(toId);
                    if (isSource && !isTarget) {
                      showNotify("Action bloquée : Une Source pure ne peut pas recevoir.", "error");
                      setSelectedForLink([]);
                      return;
                    }
                  }
                }
                addSuccessionArrow({
                  from_type: selectedForLink[0].type,
                  from_id: fromId,
                  to_type: selectedForLink[1].type,
                  to_id: toId,
                  module_id: activeModuleId,
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

         {taskPositions
            .filter(pos => pos.id.startsWith(`${activeModuleId}_`)).map((pos) => {
            const originalTaskId = pos.id.split('_')[1];
            const task = tasks.find((t) => t.id === originalTaskId);
            if (!task) return null;
            const isSelected = selectedForLink.some((s) => s.id === originalTaskId && s.type === 'task'); 

            return (
              <div
                key={pos.id}
                className={`absolute rounded-lg p-2 border-2 cursor-move transition duration-200 ${
                  isSelected ? 'border-blue-500 ring-4 ring-blue-300 shadow-lg scale-105' : 'border-gray-400 hover:border-gray-600'
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

          {nodePositions
            .filter(pos => {
              const node = successionNodes.find(n => n.id === pos.id);
              return node?.module_id === activeModuleId;
            }).map((pos) => {
            const node = successionNodes.find((n) => n.id === pos.id);
            if (!node) return null;
            const isSelected = selectedForLink.some((s) => s.id === pos.id);
            const isInit = node.is_initial === true;
            return (
              <div
                key={pos.id}
                className={`absolute rounded-full flex items-center justify-center shadow-md transition z-10 ${
                  isDeleteMode 
                    ? 'bg-red-200 border-2 border-red-500 cursor-crosshair' 
                    : isSelected
                      ? 'bg-blue-200 border-4 border-blue-600 scale-110 shadow-lg' 
                      : isInit 
                        ? 'bg-emerald-400 border-double border-[6px] border-emerald-700'
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
                    split_type: node.split_type,
                    is_initial: node.is_initial || false
                  });
                }}
              >
                <span className={`font-black pointer-events-none ${isInit ? 'text-emerald-900' : 'text-yellow-900'} text-lg`}>
                  {node.split_type === 'sync_and' && (
                    <span className="text-sm">&</span>
                  )}
                  {node.split_type === 'cond_and' && (
                    <span className="text-sm">∀</span>
                  )}
                  {node.split_type === 'only_one' && (
                    <span className="text-sm">⊕</span>
                  )}
                  {node.split_type === 'selection' && (
                    <span className="text-sm">?</span>
                  )}
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
        </div>
      </>
    )}
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
            {nodeForm.split_type === 'selection' && outgoingArrows.length > 0 && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg shadow-inner">
                <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-2 tracking-wider">
                  Conditions per Outgoing Path
                </label>
                
                <div className="space-y-2 mb-4">
                  {outgoingArrows.map((arrow) => {
                    let targetName = "Unknown";
                    if (arrow.to_type === 'task') {
                      const tId = arrow.to_id.split('_')[1] || arrow.to_id;
                      targetName = tasks.find(t => t.id === tId)?.name || 'Task';
                    } else {
                      targetName = successionNodes.find(n => n.id === arrow.to_id)?.name || 'Node';
                    }
                    
                    return (
                      <div key={arrow.id}>
                        <label className="block text-[9px] font-bold text-indigo-500 uppercase mb-0.5">Condition to reach ➔ {targetName}</label>
                        <input
                          type="text"
                          onFocus={() => setActiveModalField(arrow.id)}
                          placeholder={`Expression to allow ${targetName}`}
                          value={(nodeForm.out_expressions as any)?.[arrow.id] || ''}
                          onChange={(e) => setNodeForm({
                            ...nodeForm,
                            out_expressions: { ...(nodeForm.out_expressions as any), [arrow.id]: e.target.value }
                          })}
                          className="w-full px-2 py-1.5 text-xs font-mono border border-indigo-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 border-t border-indigo-200/50">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {['AND', 'OR', 'NOT', 'XOR', '(', ')', '↑', '↓', '>', '<', '=', '!=', '[', ']'].map(op => (
                      <button key={op} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertInModal(op.length > 1 ? ` ${op} ` : op)}
                        className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[9px] font-bold text-gray-600 hover:bg-gray-100 shadow-sm">
                        {op}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar">
                    {sensors.map(s => (
                      <button key={s.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertInModal(s.name)}
                        className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[9px] border border-green-200 hover:bg-green-100">
                        {s.name}
                      </button>
                    ))}
                    {observers.map(o => (
                      <button key={o.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertInModal(o.name)}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] border border-blue-200 hover:bg-blue-100">
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
               {!diag.isValid && (
              <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-[11px] flex items-start gap-2">
                <span className="font-bold underline uppercase tracking-tighter whitespace-nowrap flex-shrink-0">Diagnostic :</span>
                <span className="leading-tight break-words">{diag.errorMessage} (Pos: {diag.errorPos})</span>
              </div>
            )}
            <label className="flex items-center gap-3 mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors">
              <input
                type="checkbox"
                checked={nodeForm.is_initial}
                onChange={(e) => setNodeForm({ ...nodeForm, is_initial: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <div>
                <span className="block text-sm font-bold text-emerald-900">Initial State</span>
                <span className="block text-[10px] text-emerald-700">Mark this node as a starting point of the graph.</span>
              </div>
            </label>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Split Type (Execution Mode)</label>
            <select
              value={nodeForm.split_type}
              onChange={(e) => setNodeForm({ ...nodeForm, split_type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="none">None (Simple Junction)</option>
              <option value="sync_and">Synchronous AND (& - All start together)</option>
              <option value="cond_and">Conditional AND (∀ - Each has a condition)</option>
              <option value="only_one">Exclusive OR (⊕ - Only one starts)</option>
              <option value="selection">Selection (? - Global Condition)</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (nodeForm.split_type === 'selection' && !diag.isValid) {
                    alert("Veuillez corriger l'expression avant de sauvegarder.");
                    return;
                  }
                  updateSuccessionNode(editingNode, nodeForm);
                  setEditingNode(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                Save
              </button>
              <button
                onClick={() => {
                  deleteSuccessionNode(editingNode);
                  setEditingNode(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold"
              >
                Delete
              </button>
              <button
                onClick={() => setEditingNode(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-bold"
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