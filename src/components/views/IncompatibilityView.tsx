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

  const [group1, setGroup1] = useState<string[]>([]);
  const [group2, setGroup2] = useState<string[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleCreateLinks = async () => {
    btnRef.current?.setCustomValidity("");

    let totalCreated = 0;
    let totalDuplicates = 0;
    for (const id1 of group1) {
      for (const id2 of group2) {
        if (id1 === id2) continue;
        const alreadyExists = incompatibilityLinks.some(link => 
          (link.task1_id === id1 && link.task2_id === id2) || 
          (link.task1_id === id2 && link.task2_id === id1)
        );

        if (!alreadyExists) {
          await addIncompatibilityLink({ task1_id: id1, task2_id: id2 });
          totalCreated++;
        } else {
          totalDuplicates++;
        }
      }
    }
    if (totalCreated === 0 && totalDuplicates > 0) {
      btnRef.current?.setCustomValidity("Ces liens d'incompatibilité existent déjà (même intervertis).");
      btnRef.current?.reportValidity();
    } else {
      setGroup1([]);
      setGroup2([]);
    }
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 shadow-sm">
        <h3 className="text-lg font-semibold text-black-900 mb-4">Create New Incompatibility</h3>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 bg-white p-4 rounded-lg border border-gray-300 min-h-[100px] h-auto transition-all shadow-sm">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 text-center underline">Group 1</label>
            <div className="flex flex-wrap gap-1">
              {tasks.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => group1.includes(t.id) ? setGroup1(group1.filter(id => id !== t.id)) : setGroup1([...group1, t.id])}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${group1.includes(t.id) ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
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
            {group1.length * group2.length > 0 
              ? `Create ${group1.length * group2.length} Links` 
              : 'Select Tasks'}
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
