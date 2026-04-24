import { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Edit } from 'lucide-react';

const TASK_BLOCK_WIDTH = 150;
const TASK_BLOCK_HEIGHT = 80;

interface TaskPosition {
  id: string;
  x: number;
  y: number;
}

export function IncompatibilityView() {
  const { tasks, incompatibilityLinks, addIncompatibilityLink, updateIncompatibilityLink, deleteIncompatibilityLink } = useData();

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleCreateGroup = () => {
    if (selectedTasks.length < 2) return;
    const sortedIds = [...selectedTasks].sort();

    if (editingId) {
      updateIncompatibilityLink(editingId, { task_ids: sortedIds });
      setEditingId(null);
    } else {
      const exists = incompatibilityLinks.some(link => 
        JSON.stringify([...link.task_ids].sort()) === JSON.stringify(sortedIds)
      );
      if (exists) {
        btnRef.current?.setCustomValidity("Ce groupe existe déjà.");
        btnRef.current?.reportValidity();
        return;
      }
      addIncompatibilityLink({ task_ids: sortedIds });
    }
    setSelectedTasks([]);
  };

  const getTaskName = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    return task ? task.name : 'Deleted Task';
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Incompatibility View</h2>
      </div>
      <div className="flex flex-1 gap-6 overflow-hidden mt-4">
        <div className="w-1/3 bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col">
          <h3 className="text-black-400 tracking-widest">Select Tasks</h3>
          <p className="text-[10px] text-Black-400 mb-4">Click tasks that cannot run at the same time.</p>
          
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
            {tasks.map(t => (
              <button
                key={t.id}
                onClick={() => selectedTasks.includes(t.id) 
                  ? setSelectedTasks(selectedTasks.filter(id => id !== t.id))
                  : setSelectedTasks([...selectedTasks, t.id])
                }
                className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all border-2 ${
                  selectedTasks.includes(t.id)
                    ? 'bg-blue-600 border-blue-700 text-white shadow-md translate-x-1'
                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full mt-4">
            <button
              ref={btnRef}
              onClick={handleCreateGroup}
              disabled={selectedTasks.length < 2}
              className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg transition-all text-xs hover:bg-blue-700 disabled:opacity-30"
            >
              {editingId ? `Update Group (${selectedTasks.length})` : `Create Group (${selectedTasks.length})`}
            </button>
            {editingId && (
              <button
                onClick={() => { setEditingId(null); setSelectedTasks([]); }}
                className="px-6 py-4 bg-gray-400 text-white font-black rounded-xl hover:bg-gray-500 transition-all text-xs shadow-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-black text-black-400 tracking-widest text-xs">Mutual Incompatibilities</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-gray-100">
                  {incompatibilityLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {tasks.map(task => {
                            const isActive = link.task_ids.includes(task.id);
                            return (
                              <span key={task.id} className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                isActive 
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : 'bg-gray-50 text-gray-300 border-transparent opacity-40'
                              }`}>
                                {task.name}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 pr-2">
                          <button 
                            onClick={() => { setEditingId(link.id); setSelectedTasks(link.task_ids); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteIncompatibilityLink(link.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
  );
}