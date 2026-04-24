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

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleCreateGroup = () => {
    if (selectedTasks.length < 2) return;
    btnRef.current?.setCustomValidity("");
    
    const sortedIds = [...selectedTasks].sort();
    const alreadyExists = incompatibilityLinks.some(link => 
      JSON.stringify([...link.task_ids].sort()) === JSON.stringify(sortedIds)
    );

    if (alreadyExists) {
      btnRef.current?.setCustomValidity("Ce groupe d'incompatibilité existe déjà.");
      btnRef.current?.reportValidity();
      return;
    }

    addIncompatibilityLink({ task_ids: sortedIds });
    setSelectedTasks([]);
  };

  const formatGroupNames = (ids: string[]) => {
    return ids.map(id => {
      const task = tasks.find(t => t.id === id);
      return task ? task.name : '?';
    }).join(' - ');
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
          <h3 className="text-sm font-black text-gray-400 uppercase mb-4 tracking-widest">Select Group Members</h3>
          <p className="text-[10px] text-gray-400 mb-4 italic">Click tasks that cannot run at the same time.</p>
          
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
          
          <div className="flex items-center justify-center px-4 text-blue-500 font-black text-2xl">
            ✕
          </div>

          <div className="flex-1 bg-white p-4 rounded-lg border border-gray-300 min-h-[100px] h-auto transition-all shadow-sm">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 text-center underline">Group 2</label>
            <div className="flex flex-wrap gap-1"> 
              {tasks.map(t => (
                <button 
                  key={t.id} 
                  type="button"
                  onClick={() => group2.includes(t.id) ? setGroup2(group2.filter(id => id !== t.id)) : setGroup2([...group2, t.id])}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${group2.includes(t.id) ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <button
            ref={btnRef}
            onClick={handleCreateLinks} 
            disabled={group1.length === 0 || group2.length === 0}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-30 w-32 text-[10px] uppercase text-center shadow-md               transition-all"
          >
            Create Link
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex-1 border border-blue-200">
        <table className="min-w-full divide-y divide-blue-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-500 uppercase">First Group</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-500 uppercase">Linked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-500 uppercase">Second Group</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-500 uppercase">Delete</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {incompatibilityLinks.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No incompatibilities defined yet.</td></tr>
            ) : (
              incompatibilityLinks.map((link) => (
                <tr key={link.id} className="hover:bg-blue-50/50">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {formatGroupNames(link.task1_ids)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-blue-500 font-black">✕</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {formatGroupNames(link.task2_ids)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteIncompatibilityLink(link.id)} className="text-red-500 hover:text-red-700 p-2">
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
