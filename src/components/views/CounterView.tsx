import { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, Edit, Binary } from 'lucide-react';
import { analyzeExpression } from '../../lib/expressionParser';

export function CounterView() {
  const { counters, sensors, observers, tasks, addCounter, updateCounter, deleteCounter, showNotify } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<string>('increase');
  const [diag, setDiag] = useState({ isValid: true, errorMessage: "", errorPos: 0 });
  const [formData, setFormData] = useState({
    name: '',
    initial_value: 0,
    factory_io_address: '',
    expressions: { increase: '', decrease: '', reset: '' }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const nameExists = [...tasks, ...sensors, ...observers, ...counters].some(
      item => item.name.toLowerCase() === formData.name.toLowerCase() && item.id !== editingId
    );

    if (nameExists) {
      showNotify(`The name "${formData.name}" is already used.`, "error");
      return;
    }

    if (editingId) {
      updateCounter(editingId, formData);
      setEditingId(null);
    } else {
      addCounter(formData);
    }
    setFormData({ 
      name: '', initial_value: 0, factory_io_address: '', 
      expressions: { increase: '', decrease: '', reset: '' } 
    });
  };
  const handleCancel = () => {
    setEditingId(null);
    setFormData({ 
      name: '', initial_value: 0, factory_io_address: '', 
      expressions: { increase: '', decrease: '', reset: '' } 
    });
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">Counters</h2>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 mb-4">
          {editingId ? 'Edit Counter' : 'Add New Counter'} 
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Counter Name</label>
              <input 
                type="text" 
                placeholder="ex : Cpt_Cycle"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Initial Value</label>
              <input 
                type="number" 
                value={formData.initial_value} 
                onChange={(e) => setFormData({...formData, initial_value: parseInt(e.target.value) || 0})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Address Mapping</label>
              <input 
                type="text" 
                placeholder="100"
                value={formData.factory_io_address} 
                onChange={(e) => setFormData({...formData, factory_io_address: e.target.value})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button 
              type="submit" 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md h-10"
            >
              {editingId ? 'Update' : '+ Add Counter'}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={handleCancel} 
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold h-10"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}