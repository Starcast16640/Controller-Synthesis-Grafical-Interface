import { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2 } from 'lucide-react';

const TASK_BLOCK_WIDTH = 150;
const TASK_BLOCK_HEIGHT = 80;

interface TaskPosition {
  id: string;
  x: number;
  y: number;
}

export function IncompatibilityView() {
  const { tasks, incompatibilityLinks, addIncompatibilityLink, deleteIncompatibilityLink } = useData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<TaskPosition[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [task1Id, setTask1Id] = useState('');
  const [task2Id, setTask2Id] = useState('');

  const getTaskName = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    return task ? task.name : 'Deleted Task';
  };

  useEffect(() => {
    if (positions.length === 0 && tasks.length > 0) {
      const cols = Math.ceil(Math.sqrt(tasks.length));
      const newPositions = tasks.map((task, idx) => ({
        id: task.id,
        x: (idx % cols) * (TASK_BLOCK_WIDTH + 40) + 20,
        y: Math.floor(idx / cols) * (TASK_BLOCK_HEIGHT + 40) + 20,
      }));
      setPositions(newPositions);
    }
  }, [tasks, positions.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    incompatibilityLinks.forEach((link) => {
      const from = positions.find((p) => p.id === link.task1_id);
      const to = positions.find((p) => p.id === link.task2_id);

      if (from && to) {
        const fromX = from.x + TASK_BLOCK_WIDTH / 2;
        const fromY = from.y + TASK_BLOCK_HEIGHT / 2;
        const toX = to.x + TASK_BLOCK_WIDTH / 2;
        const toY = to.y + TASK_BLOCK_HEIGHT / 2;

        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        ctx.fillText('✕', midX, midY);
      }
    });
  }, [incompatibilityLinks, positions]);

  const handleTaskMouseDown = (taskId: string, e: React.MouseEvent) => {
    const pos = positions.find((p) => p.id === taskId);
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTaskId) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    setPositions((prev) =>
      prev.map((p) => (p.id === draggingTaskId ? { ...p, x: Math.max(0, newX), y: Math.max(0, newY) } : p))
    );
  };

  const handleMouseUp = () => {
    setDraggingTaskId(null);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((t) => t !== taskId) : [...prev, taskId]
    );
  };

  const handleCreateLink = () => {
    if (selectedTasks.length === 2) {
      addIncompatibilityLink({
        task1_id: selectedTasks[0],
        task2_id: selectedTasks[1],
      });
      setSelectedTasks([]);
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Incompatibility View</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCreateLink}
            disabled={selectedTasks.length !== 2}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Link ({selectedTasks.length}/2)
          </button>
          <button
            onClick={() => setSelectedTasks([])}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 shadow-sm">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Create New Incompatibility</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="">
            <label className="">First Task : </label>
            <select
              value={task1Id}
              onChange={(e) => setTask1Id(e.target.value)}
              className=""
            >
              <option value=""> Select Task </option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === task2Id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {incompatibilityLinks.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Incompatibility Links</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {incompatibilityLinks.map((link) => {
              const task1 = tasks.find((t) => t.id === link.task1_id);
              const task2 = tasks.find((t) => t.id === link.task2_id);
              return (
                <div key={link.id} className="flex items-center justify-between bg-red-50 p-2 rounded">
                  <span className="text-sm text-gray-700">
                    {task1?.name} ✕ {task2?.name}
                  </span>
                  <button
                    onClick={() => deleteIncompatibilityLink(link.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
