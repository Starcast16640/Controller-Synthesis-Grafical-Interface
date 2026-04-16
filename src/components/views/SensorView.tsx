import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { Sensor } from '../../lib/database.types';

export function SensorView() {
  const { sensors, addSensor, updateSensor, deleteSensor } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Sensor>>({
    name: '',
    type: 'Boolean',
    machine: '',
    factory_io_address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.machine) return;

    if (editingId) {
      await updateSensor(editingId, formData);
      setEditingId(null);
    } else {
      await addSensor(formData as Omit<Sensor, 'id' | 'created_at'>);
    }

    setFormData({ name: '', type: 'Boolean', machine: '', factory_io_address: '' });
  };

  const handleEdit = (sensor: Sensor) => {
    setEditingId(sensor.id);
    setFormData({
      name: sensor.name,
      type: sensor.type,
      machine: sensor.machine,
      factory_io_address: sensor.factory_io_address || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', type: 'Boolean', machine: '', factory_io_address: '' });
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sensors</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Sensor' : 'Add New Sensor'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sensor Name</label>
              <input
                type="text"
                placeholder="Ex : AtEntry1"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sensor Type</label>
              <select
                value={formData.type || 'Boolean'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Sensor['type'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Boolean">Boolean</option>
                <option value="Integer">Integer</option>
                <option value="Real">Real</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Machine Name"
              value={formData.machine || ''}
              onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Address Mapping"
              value={formData.factory_io_address || ''}
              onChange={(e) => setFormData({ ...formData, factory_io_address: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  Machine
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
              {sensors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No sensors defined yet. Add your first sensor above.
                  </td>
                </tr>
              ) : (
                sensors.map((sensor) => (
                  <tr key={sensor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sensor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {sensor.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sensor.machine}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {sensor.factory_io_address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(sensor)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSensor(sensor.id)}
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
