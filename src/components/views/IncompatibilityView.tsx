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
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 shadow-sm">
        <h3 className="text-lg font-semibold text-black-900 mb-4">Create New Incompatibility</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-black-700 mb-2">First Task :</label>
            <select
              value={task1Id}
              onChange={(e) => setTask1Id(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex-1 border border-blue-200">
        <table className="min-w-full divide-y divide-blue-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-500 uppercase">First Task</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-500 uppercase">Linked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-500 uppercase">Second Task</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-500 uppercase">Delete</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {incompatibilityLinks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No incompatibilities defined yet.
                </td>
              </tr>
            ) : (
              incompatibilityLinks.map((link) => (
                <tr key={link.id} className="hover:bg-blue-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black-600">
                    {getTaskName(link.task1_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-500 font-bold">
                    ✕
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black-600">
                    {getTaskName(link.task2_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => deleteIncompatibilityLink(link.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
