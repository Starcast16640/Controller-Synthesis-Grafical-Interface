import { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import type { Task } from '../../lib/database.types';
import { analyzeExpression } from '../../lib/expressionParser';

interface TaskFormData {
  name: string;
  type: string[];
  authorization_expression: string;
  final_condition: string;
  max_simultaneous_executions: number;
  priority: number;
  factory_io_address: string;
}

const TASK_TYPES = ['simple', 'reactivable', 'pausable', 'interruptible'];

export function TaskView() {
  const { tasks, sensors, observers, addTask, updateTask, deleteTask } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<'auth' | 'final' | null>(null);
  const getNextPriority = () => {
  if (tasks.length === 0) return 0;
  return Math.max(...tasks.map(t => t.priority)) + 1;
  };
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    type: ['simple'],
    authorization_expression: '',
    final_condition: '',
    max_simultaneous_executions: 1,
    priority: getNextPriority(),
    factory_io_address: '',
  });
  const [diag, setDiag] = useState({ isValid: true, errorMessage: "", errorPos: 0 });
  

  const authRef = useRef<HTMLTextAreaElement>(null);
  const finalRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const priorityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingId) {
      setFormData(prev => ({ ...prev, priority: getNextPriority() }));
    }
  }, [tasks, editingId]);

  const insertAtCursor = (value: string) => {
    if (!activeField) return;
    const targetRef = activeField === 'auth' ? authRef : finalRef;
    const fieldName = activeField === 'auth' ? 'authorization_expression' : 'final_condition';
    
    const textarea = targetRef.current;
    if (!textarea || document.activeElement !== textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentText = formData[fieldName];
    const newText = currentText.substring(0, start) + value + currentText.substring(end);
    
    setFormData({ ...formData, [fieldName]: newText });
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + value.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  useEffect(() => {
    const allValidNames = [
      ...sensors.map(s => s.name),
      ...observers.map(o => o.name),
      ...tasks.map(t => t.name),
      'TRUE', 'FALSE', 'AUTO'
    ];
    const target = activeField === 'auth' ? formData.authorization_expression : formData.final_condition;
    const result = analyzeExpression(target, allValidNames);
    
    setDiag({ 
      isValid: result.isValid, 
      errorMessage: result.errorMessage || "", 
      errorPos: result.errorPos || 0 
    });
  }, [formData.authorization_expression, formData.final_condition, activeField, sensors, observers, tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const nameUsedInTasks = tasks.some(t => t.name.toLowerCase() === formData.name.toLowerCase() && t.id !== editingId);
    const nameUsedInSensors = sensors.some(s => s.name.toLowerCase() === formData.name.toLowerCase());
    const nameUsedInObservers = observers.some(o => o.name.toLowerCase() === formData.name.toLowerCase());

    if (nameUsedInTasks || nameUsedInSensors || nameUsedInObservers) {
      nameInputRef.current?.setCustomValidity("Ce nom est déjà utilisé par un autre élément (Tâche, Capteur ou Observer).");
      nameInputRef.current?.reportValidity();
      return;
    }

    if (formData.factory_io_address) {
      const addrUsedInTasks = tasks.some(t => t.factory_io_address === formData.factory_io_address && t.id !== editingId);
      const addrUsedInSensors = sensors.some(s => s.factory_io_address === formData.factory_io_address);

      if (addrUsedInTasks || addrUsedInSensors) {
        addressInputRef.current?.setCustomValidity("Cette adresse mapping est déjà assignée à un autre élément.");
        addressInputRef.current?.reportValidity();
        return;
      }
    }

    const priorityExists = tasks.some(t => t.priority === formData.priority && t.id !== editingId);
    if (priorityExists) {
      priorityInputRef.current?.setCustomValidity(`La priorité ${formData.priority} est déjà utilisée par une autre tâche.`);
      priorityInputRef.current?.reportValidity();
      return;
    }

    const finalExpression = formData.authorization_expression.trim() === '' 
      ? 'TRUE' 
      : formData.authorization_expression.trim();

    const dataToSubmit = {
      ...formData,
      authorization_expression: finalExpression
    };

    if (editingId) {
      await updateTask(editingId, dataToSubmit);
      setEditingId(null);
    } else {
      await addTask(dataToSubmit as Omit<Task, 'id' | 'created_at'>);
    }

    setFormData({
      name: '',
      type: ['simple'],
      authorization_expression: '',
      final_condition: '',
      max_simultaneous_executions: 1,
      priority: getNextPriority(),
      factory_io_address: '',
    });
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setFormData({
      name: task.name,
      type: task.type,
      authorization_expression: task.authorization_expression,
      final_condition: task.final_condition,
      max_simultaneous_executions: task.max_simultaneous_executions,
      priority: task.priority,
      factory_io_address: task.factory_io_address || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: ['simple'],
      authorization_expression: '',
      final_condition: '',
      max_simultaneous_executions: 1,
      priority: getNextPriority(),
      factory_io_address: ''
    });
  };

  const toggleTaskType = (typeToToggle: string) => {
    let newTypes = [...formData.type];

    if (typeToToggle === 'simple') {
      newTypes = ['simple'];
    } else {
      if (newTypes.includes(typeToToggle)) {
        newTypes = newTypes.filter((t) => t !== typeToToggle);
        if (newTypes.length === 0) {
          newTypes = ['simple'];
        }
      } else {
        newTypes = newTypes.filter((t) => t !== 'simple');
        newTypes.push(typeToToggle);
      }
    }
    setFormData({ ...formData, type: newTypes });
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tasks</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Task' : 'Add New Task'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Task Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="MoveRobot"
                  value={formData.name}
                  onChange={(e) => {
                    e.target.setCustomValidity("");
                    setFormData({ ...formData, name: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                <input
                  ref={priorityInputRef}
                  type="number"
                  placeholder="0"
                  value={formData.priority}
                  onChange={(e) => {
                    e.target.setCustomValidity("");
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 0 });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {formData.type.includes('reactivable') ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-blue-600">
                    Max Simultaneous Executions (Reactivable)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_simultaneous_executions}
                    onChange={(e) => setFormData({ ...formData, max_simultaneous_executions: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                ) : (
                <div className="opacity-40 cursor-not-allowed">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Max Exec. (Locked)</label>
                  <input type="text" disabled value="1" className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address Mapping</label>
                <input
                  ref={addressInputRef}
                  type="text"
                  placeholder="100"
                  value={formData.factory_io_address}
                  onChange={(e) => {
                    e.target.setCustomValidity("");
                    setFormData({ ...formData, factory_io_address: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Task Types</label>
              <div className="flex gap-3 flex-wrap">
                {TASK_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.type.includes(type)}
                      onChange={() => toggleTaskType(type)}
                      className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Authorization Logic</label>
            <textarea
              ref={authRef}
              onFocus={() => setActiveField('auth')}
              placeholder="Authorization Expression"
              value={formData.authorization_expression}
              onChange={(e) => setFormData({ ...formData, authorization_expression: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={2}
            />

            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 mt-4">Final Condition</label>
              <div className="flex gap-2">
                <textarea
                  ref={finalRef}
                  onFocus={() => setActiveField('final')}
                  placeholder="Final Condition (or 'AUTO')"
                  value={formData.final_condition}
                  onChange={(e) => setFormData({ ...formData, final_condition: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={2}
                />
                <button 
                  type="button" 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setFormData({ ...formData, final_condition: 'AUTO' })}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold border border-orange-200 hover:bg-orange-200 h-fit"
                >
                  SET AUTO
                </button>
              </div>
            
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Helper Tools</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['AND', 'OR', 'NOT', 'XOR'].map(op => (
                  <button 
                    key={op} 
                    type="button" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertAtCursor(` ${op} `)}
                    className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-500 hover:bg-gray-100">
                    {op}
                  </button>
                ))}
                {['(', ')', '↑', '↓', '>', '<', '[', ']'].map(op => (
                  <button 
                    key={op} 
                    type="button" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertAtCursor(op)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100">
                    {op}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {sensors.map(s => (
                  <button 
                    key={s.id} 
                    type="button" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertAtCursor(s.name)}
                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                    {s.name}
                  </button>
                ))}
                {observers.map(o => (
                  <button 
                    key={o.id} 
                    type="button" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertAtCursor(o.name)}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                    {o.name}
                  </button>
                ))}
              </div>
            </div>

            {!diag.isValid && (
                <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-[11px] flex items-center gap-2">
                  <span className="font-black underline">DIAGNOSTIC :</span>
                  <span>{diag.errorMessage} (Position: {diag.errorPos})</span>
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
                  Types
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authorization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Final Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No tasks defined yet. Add your first task above.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1 flex-wrap">
                        {task.type.map((t) => (
                          <span key={t} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.priority}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate block max-w-xs">
                        {(task.authorization_expression || 'TRUE').toUpperCase()}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {task.final_condition}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {task.factory_io_address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(task)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
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
