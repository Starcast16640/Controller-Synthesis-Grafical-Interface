import { Download, Gauge, Eye, ListTodo, Link2, GitBranch, Layers } from 'lucide-react';

export type ViewType = 'sensors' | 'observers' | 'tasks' | 'incompatibility' | 'succession' | 'combined';

interface ToolbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onExport: () => void;
}

export function Toolbar({ currentView, onViewChange, onExport }: ToolbarProps) {
  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'sensors', label: 'Sensors', icon: <Gauge className="w-4 h-4" /> },
    { id: 'observers', label: 'Observers', icon: <Eye className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'incompatibility', label: 'Incompatibility', icon: <Link2 className="w-4 h-4" /> },
    { id: 'succession', label: 'Succession', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'combined', label: 'Combined', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentView === view.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-all shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Export DEPS/GRAFCET</span>
        </button>
      </div>
    </div>
  );
}
