import { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { Observer } from '../../lib/database.types';

type ObserverType = 'expression' | 'counter' | 'jk_flip_flop';

interface ObserverFormData {
  name: string;
  type: ObserverType;
  expressions: {
    main?: string;
    increase?: string;
    decrease?: string;
    set?: string;
    reset?: string;
  };
}

export function ObserverView() {
  const { observers, sensors, tasks, addObserver, updateObserver, deleteObserver } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ObserverFormData>({
    name: '',
    type: 'expression',
    expressions: { main: '' },
  });
  const [activeField, setActiveField] = useState<string>('main');

  const insertVariable = (value: string) => {
    setFormData({
      ...formData,
      expressions: {
        ...formData.expressions,
        [activeField]: (formData.expressions[activeField as keyof typeof formData.expressions] || '') + value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const nameUsed = 
      observers.some(o => o.name.toLowerCase() === formData.name.toLowerCase() && o.id !== editingId) ||
      sensors.some(s => s.name.toLowerCase() === formData.name.toLowerCase()) ||
      tasks.some(t => t.name.toLowerCase() === formData.name.toLowerCase());
    
    if (nameUsed) {
      alert(`The name "${formData.name}" is already used in the model (Task, Sensor or Observer).`);
      return;
    }

    const observerData = {
      name: formData.name,
      type: formData.type,
      expressions: formData.expressions,
    };

    if (editingId) {
      await updateObserver(editingId, observerData);
      setEditingId(null);
    } else {
      await addObserver(observerData);
    }

    setFormData({ name: '', type: 'expression', expressions: { main: '' } });
  };

  const handleEdit = (observer: Observer) => {
    setEditingId(observer.id);
    setFormData({
      name: observer.name,
      type: observer.type,
      expressions: observer.expressions as ObserverFormData['expressions'],
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', type: 'expression', expressions: { main: '' } });
  };

  const handleTypeChange = (type: ObserverType) => {
    let expressions = {};
    if (type === 'expression') {
      expressions = { main: '' };
    } else if (type === 'counter') {
      expressions = { increase: '', decrease: '' };
    } else if (type === 'jk_flip_flop') {
      expressions = { set: '', reset: '' };
    }
    setFormData({ ...formData, type, expressions });
  };

  const getExpressionDisplay = (observer: Observer) => {
    const exprs = observer.expressions as ObserverFormData['expressions'];
    if (observer.type === 'expression') {
      return exprs.main || '';
    } else if (observer.type === 'counter') {
      return `+: ${exprs.increase || ''}, -: ${exprs.decrease || ''}`;
    } else if (observer.type === 'jk_flip_flop') {
      return `Set: ${exprs.set || ''}, Reset: ${exprs.reset || ''}`;
    }
    return '';
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Observers</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Observer' : 'Add New Observer'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observer Name</label>
              <input
                type="text"
                placeholder="Observer Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observer Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as ObserverType)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expression">Expression</option>
                <option value="counter">Counter</option>
                <option value="jk_flip_flop">JK Flip-Flop</option>
              </select>
            </div>

            {formData.type === 'expression' && (
              <input
                type="text"
                placeholder="Expression"
                onFocus={() => setActiveField('main')}
                value={formData.expressions.main || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expressions: { ...formData.expressions, main: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}

            {formData.type === 'counter' && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Increase Expression"
                  onFocus={() => setActiveField('increase')}
                  value={formData.expressions.increase || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expressions: { ...formData.expressions, increase: e.target.value },
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Decrease Expression"
                  onFocus={() => setActiveField('decrease')}
                  value={formData.expressions.decrease || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expressions: { ...formData.expressions, decrease: e.target.value },
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.type === 'jk_flip_flop' && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Set Expression"
                  onFocus={() => setActiveField('set')}
                  value={formData.expressions.set || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expressions: { ...formData.expressions, set: e.target.value },
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Reset Expression"
                  onFocus={() => setActiveField('reset')}
                  value={formData.expressions.reset || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expressions: { ...formData.expressions, reset: e.target.value },
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {editingId ? 'Update' : 'Add'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expressions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {observers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No observers defined yet. Add your first observer above.
                  </td>
                </tr>
              ) : (
                observers.map((observer) => (
                  <tr key={observer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {observer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {observer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {getExpressionDisplay(observer)}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(observer)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteObserver(observer.id)}
                        className="text-red-600 hover:text-red-900"
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
    </div>
  );
}
