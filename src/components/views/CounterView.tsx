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
  const increaseRef = useRef<HTMLInputElement>(null);
  const decreaseRef = useRef<HTMLInputElement>(null);
  const resetRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    if (!diag.isValid) {
      const refs: any = { increase: increaseRef, decrease: decreaseRef, reset: resetRef };
      const activeInput = refs[activeField]?.current;
      if (activeInput) {
        activeInput.setCustomValidity(diag.errorMessage || "Expression invalide");
        activeInput.reportValidity();
      }
      return;
    }
    const nameExists = [...tasks, ...sensors, ...observers, ...counters].some(
      item => item.name.toLowerCase() === formData.name.toLowerCase() && item.id !== editingId
    );
    if (nameExists) {
      nameInputRef.current?.setCustomValidity("Ce nom est déjà utilisé dans le modèle.");
      nameInputRef.current?.reportValidity();
      return;
    }
    if (formData.factory_io_address) {
      const addrExists = [...tasks, ...sensors, ...counters].some(
        item => item.factory_io_address === formData.factory_io_address && item.id !== editingId
      );
      if (addrExists) {
        addressInputRef.current?.setCustomValidity("Cette adresse mapping est déjà utilisée.");
        addressInputRef.current?.reportValidity();
        return;
      }
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

  const handleEdit = (counter: any) => {
    setEditingId(counter.id);
    setFormData({
      name: counter.name,
      initial_value: counter.initial_value,
      factory_io_address: counter.factory_io_address || '',
      expressions: counter.expressions || { increase: '', decrease: '', reset: '' }
    });
  };

  const insertVariable = (value: string) => {
    if (!activeField) return;
    const refs: Record<string, React.RefObject<HTMLInputElement>> = {
      increase: increaseRef,
      decrease: decreaseRef,
      reset: resetRef
    };

    const input = refs[activeField]?.current;
    if (!input || document.activeElement !== input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentText = (formData.expressions?.[activeField as keyof typeof formData.expressions]) || '';
    const newText = currentText.substring(0, start) + value + currentText.substring(end);

    setFormData({
      ...formData,
      expressions: { ...formData.expressions, [activeField]: newText }
    });
    setTimeout(() => {
      input.focus();
      const newPos = start + value.length;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  useEffect(() => {
    const allNames = [
      ...sensors.map(s => s.name), 
      ...observers.map(o => o.name), 
      ...tasks.map(t => t.name), 
      ...counters.map(c => c.name),
      'TRUE', 'FALSE'
    ];
    const currentExpr = (formData.expressions?.[activeField as keyof typeof formData.expressions]) || '';
    const result = analyzeExpression(currentExpr, allNames);

    setDiag({
      isValid: result.isValid,
      errorMessage: result.errorMessage || "",
      errorPos: result.errorPos || 0
    });
  }, [formData.expressions, activeField, sensors, observers, tasks, counters]);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">Counters</h2>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {editingId ? 'Edit Counter' : 'Add New Counter'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Counter Name</label>
              <input 
                ref={nameInputRef}
                type="text" 
                placeholder="ex : CptCycle"
                value={formData.name} 
                onChange={(e) => {
                  e.target.setCustomValidity("");
                  setFormData({...formData, name: e.target.value});
                }}
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
                ref={addressInputRef}
                type="text" 
                placeholder="100"
                value={formData.factory_io_address} 
                onChange={(e) => {
                  e.target.setCustomValidity("");
                  setFormData({...formData, factory_io_address: e.target.value});
                }} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
          </div>
          <div className="space-y-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-green-500 uppercase mb-1">Increase Condition (+1)</label>
                <input 
                  ref={increaseRef}
                  type="text" 
                  onFocus={() => setActiveField('increase')} 
                  value={formData.expressions.increase}
                  onChange={(e) => setFormData({...formData, expressions: {...formData.expressions, increase: e.target.value}})}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 font-mono text-sm transition-colors ${
                    activeField === 'increase' && !diag.isValid 
                      ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900 shadow-sm' 
                      : 'border-gray-300 focus:ring-blue-500 shadow-none'
                  }`} 
                  placeholder="Increase Expression" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-red-500 uppercase mb-1">Decrease Condition (-1)</label>
                <input 
                  ref={decreaseRef}
                  type="text" 
                  onFocus={() => setActiveField('decrease')} 
                  value={formData.expressions.decrease}
                  onChange={(e) => setFormData({...formData, expressions: {...formData.expressions, decrease: e.target.value}})}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 font-mono text-sm transition-colors ${
                    activeField === 'decrease' && !diag.isValid 
                      ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900 shadow-sm' 
                      : 'border-gray-300 focus:ring-blue-500 shadow-none'
                  }`} 
                  placeholder="Decrease Expression" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-500 uppercase mb-1">Reset Condition (Force to Initial Value)</label>
              <input 
                ref={resetRef}
                type="text" 
                onFocus={() => setActiveField('reset')} 
                value={formData.expressions.reset}
                onChange={(e) => setFormData({...formData, expressions: {...formData.expressions, reset: e.target.value}})}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 font-mono text-sm transition-colors ${
                  activeField === 'reset' && !diag.isValid 
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900 shadow-sm' 
                    : 'border-gray-300 focus:ring-blue-500 shadow-none'
                }`} 
                placeholder="Reset Expression" 
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Helper Tools</label>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {['AND', 'OR', 'XOR'].map(op => (
                <button key={op} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVariable(` ${op} `)}
                  className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-500 hover:bg-gray-100">
                  {op}
                </button>
              ))}
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVariable('NOT ')}
                className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-500 hover:bg-gray-100">
                NOT
              </button>
              {['(', ')', '↑', '↓', '>', '<', '=', '!=', '[', ']'].map(op => (
                <button key={op} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVariable(op)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100">
                  {op}
                </button>
              ))}
            </div>
          
            <div className="flex flex-wrap gap-2">
              {sensors.map(s => (
                <button key={s.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVariable(s.name)}
                  className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                  {s.name}
                </button>
              ))}
              {observers.map(o => (
                <button key={o.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVariable(o.name)}
                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                  {o.name}
                </button>
              ))}
              {tasks.map(t => (
                <button key={t.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVariable(t.name)}
                  className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] border border-purple-200 hover:bg-purple-100">
                  {t.name}
                </button>
              ))}
            </div>
          </div>        
          {!diag.isValid && (
            <div className="mt-4 p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-[11px] flex items-center gap-2">
              <span className="font-black underline uppercase tracking-tighter">Diagnostic :</span>
              <span>{diag.errorMessage} (Pos: {diag.errorPos})</span>
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
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mt-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200">
              <th className="px-6 py-3 text-left">Counter Name</th>
              <th className="px-6 py-3 text-left">Mapping & Range</th>
              <th className="px-6 py-3 text-left">Logic</th>
              <th className="px-6 py-3 text-right pr-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {counters.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">No counters defined yet.</td></tr>
            ) : (
              counters.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-mono text-gray-400">Address : {c.factory_io_address || '-'}</div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase">Init : {c.initial_value}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 text-[9px] font-black">
                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">Inc : {c.expressions?.increase || ''}</span>
                      <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">Dec : {c.expressions?.decrease || ''}</span>
                      <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100">Res : {c.expressions?.reset || ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 pr-2">
                      <button onClick={() => { setEditingId(c.id); setFormData(c); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCounter(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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