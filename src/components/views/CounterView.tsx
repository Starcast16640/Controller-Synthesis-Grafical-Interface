import { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, Edit, Binary } from 'lucide-react';
import { analyzeExpression } from '../../lib/expressionParser';

export function CounterView() {
  const { counters, sensors, observers, tasks, addCounter, updateCounter, deleteCounter } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<string>('increase');
  const [diag, setDiag] = useState({ isValid: true, errorMessage: "", errorPos: 0 });
  const [formData, setFormData] = useState({
    name: '',
    initial_value: 0,
    max_value: 10,
    factory_io_address: '',
    expressions: { increase: '', decrease: '', reset: '' }
  });

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
                placeholder="e.g. Cpt_Cycle"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full px-4 py-2 h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Initial Value</label>
              <input 
                type="number" 
                value={formData.initial_value} 
                onChange={(e) => setFormData({...formData, initial_value: parseInt(e.target.value) || 0})} 
                className="w-full px-4 py-2 h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Address Mapping</label>
              <input 
                type="text" 
                placeholder="100"
                value={formData.factory_io_address} 
                onChange={(e) => setFormData({...formData, factory_io_address: e.target.value})} 
                className="w-full px-4 py-2 h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}