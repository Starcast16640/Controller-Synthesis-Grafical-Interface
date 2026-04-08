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

  const [task1Id, setTask1Id] = useState('');
  const [task2Id, setTask2Id] = useState('');

  const getTaskName = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    return task ? task.name : 'Deleted Task';
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 shadow-sm">
        <h3 className="text-lg font-semibold text-black-900 mb-4">Create New Incompatibility</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-black-700 mb-2">First Task :</label>
            <select
              value={task1Id}
              onChange={(e) => setTask1Id(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select Task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === task2Id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-center pb-2 px-2 text-blue-500 font-bold text-xl">
            ✕
          </div>

          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-black-700 mb-2">Second Task :</label>
            <select
              value={task2Id}
              onChange={(e) => setTask2Id(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select Task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === task1Id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              addIncompatibilityLink({ task1_id: task1Id, task2_id: task2Id });
              setTask1Id(''); setTask2Id('');
            }}
            disabled={!task1Id || !task2Id || task1Id === task2Id}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 h-[42px]"
          >
            Create Link
          </button>
        </div>
      </div>
      
    </div>
  );
}
