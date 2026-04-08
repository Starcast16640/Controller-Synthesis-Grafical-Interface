import { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2 } from 'lucide-react';

export function IncompatibilityView() {
  const { tasks, incompatibilityLinks, addIncompatibilityLink, deleteIncompatibilityLink } = useData();
  const [task1Id, setTask1Id] = useState('');
  const [task2Id, setTask2Id] = useState('');

  const getTaskName = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    return task ? task.name : 'Deleted Task';
  };

  const handleCreateLink = () => {
    if (task1Id && task2Id && task1Id !== task2Id) {
      addIncompatibilityLink({
        task1_id: task1Id,
        task2_id: task2Id,
      });
      setTask1Id('');
      setTask2Id('');
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

      <div className="flex-1 relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full relative overflow-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            width={2000}
            height={2000}
            className="absolute top-0 left-0 pointer-events-none"
          />

          {positions.map((pos) => {
            const task = tasks.find((t) => t.id === pos.id);
            if (!task) return null;

            return (
              <div
                key={pos.id}
                className={`absolute cursor-move rounded-lg p-2 border-2 transition-all ${
                  selectedTasks.includes(pos.id)
                    ? 'border-blue-600 shadow-lg scale-105'
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
                onClick={() => handleTaskClick(pos.id)}
              >
                <div className="text-xs font-bold text-gray-900 truncate">{task.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {task.type.join(', ')}
                </div>
                <div className="text-xs text-gray-500 mt-2">Priority: {task.priority}</div>
              </div>
            );
          })}
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
