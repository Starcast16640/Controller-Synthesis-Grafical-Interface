import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import type { Task } from '../../lib/database.types';

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
  const { tasks, addTask, updateTask, deleteTask } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    type: ['simple'],
    authorization_expression: '',
    final_condition: 'AUTO',
    max_simultaneous_executions: 1,
    priority: 0,
    factory_io_address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
      await updateTask(editingId, formData);
      setEditingId(null);
    } else {
      await addTask(formData as Omit<Task, 'id' | 'created_at'>);
    }

    setFormData({
      name: '',
      type: ['simple'],
      authorization_expression: '',
      final_condition: 'AUTO',
      max_simultaneous_executions: 1,
      priority: 0,
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
      final_condition: 'AUTO',
      max_simultaneous_executions: 1,
      priority: 0,
      factory_io_address: ''
    });
  };

  const toggleTaskType = (typeToToggle: string) => {
    const newTypes = formData.type.includes(typeToToggle)
      ? formData.type.filter((t) => t !== typeToToggle)
      : [...formData.type, typeToToggle];
    setFormData({ ...formData, type: newTypes.length > 0 ? newTypes : ['simple'] });
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tasks</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Task' : 'Add New Task'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Task Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="number"
                placeholder="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max Simultaneous Executions"
                value={formData.max_simultaneous_executions}
                onChange={(e) =>
                  setFormData({ ...formData, max_simultaneous_executions: parseInt(e.target.value) || 1 })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Address Mapping"
                value={formData.factory_io_address}
                onChange={(e) => setFormData({ ...formData, factory_io_address: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Authorization Expression (e.g., sensor1 AND observer2)"
              value={formData.authorization_expression}
              onChange={(e) => setFormData({ ...formData, authorization_expression: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />

            <input
              type="text"
              placeholder="Final Condition (or 'AUTO')"
              value={formData.final_condition}
              onChange={(e) => setFormData({ ...formData, final_condition: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

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
                        {task.authorization_expression || '—'}
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
