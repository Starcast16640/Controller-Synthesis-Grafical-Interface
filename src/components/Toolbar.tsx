import { Download, Gauge, Eye, ListTodo, Link2, GitBranch, Layers, Save, Upload } from 'lucide-react';

export type ViewType = 'sensors' | 'observers' | 'tasks' | 'incompatibility' | 'succession' | 'combined';

interface ToolbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onExport: () => void;
  onJsonExport: () => void;
  onJsonImport: (file: File) => void;
}

export function Toolbar({ currentView, onViewChange, onExport, onJsonExport, onJsonImport }: ToolbarProps) {
  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'sensors', label: 'Sensors', icon: <Gauge className="w-4 h-4" /> },
    { id: 'observers', label: 'Observers', icon: <Eye className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'incompatibility', label: 'Incompatibility', icon: <Link2 className="w-4 h-4" /> },
    { id: 'succession', label: 'Succession', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'combined', label: 'Combined', icon: <Layers className="w-4 h-4" /> },
  ];
  const sideBtnClass = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all shadow-md w-50 h-10 uppercase";

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
        <div className="flex items-center gap-2">
          <button
            onClick={onJsonExport}
            className={`${sideBtnClass} bg-gray-800 text-white hover:bg-gray-900`}
            >
            <Save className="w-4 h-4" />
            <span>Download Save</span>
          </button>
          <label className={`${sideBtnClass} bg-blue-600 text-white hover:bg-blue-700 cursor-pointer`}>
            <Upload className="w-4 h-4" />
            <span>Upload Save</span>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && onJsonImport(e.target.files[0])} 
            />
          </label>
          <button
            onClick={onExport}
            className={`${sideBtnClass} bg-green-600 text-white hover:bg-green-700`}
          >
            <Download className="w-4 h-4" />
            <span>Export DEPS/GRAFECET</span>
          </button>
        </div>
      </div>
    </div>
  );
}
