import { useState, useRef, useEffect } from 'react';
import { Download, Gauge, Eye, ListTodo, Link2, GitBranch, Layers, Save, Upload, CheckCircle2, Hash, Binary } from 'lucide-react';

export type ViewType = 'sensors' | 'observers' | 'tasks' | 'counters' | 'incompatibility' | 'succession' | 'combined';

interface ToolbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onExport: () => void;
  onJsonExport: () => void;
  onJsonImport: (file: File) => void;
}

export function Toolbar({ currentView, onViewChange, onExport, onJsonExport, onJsonImport }: ToolbarProps) {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'sensors', label: 'Sensors', icon: <Gauge className="w-4 h-4" /> },
    { id: 'observers', label: 'Observers', icon: <Eye className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'counters', label: 'Counters', icon: <Binary className="w-4 h-4" /> },
    { id: 'incompatibility', label: 'Incompatibility', icon: <Link2 className="w-4 h-4" /> },
    { id: 'succession', label: 'Succession', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'combined', label: 'Combined', icon: <Layers className="w-4 h-4" /> },
  ];
  const sideBtnClass = "flex items-center justify-center w-44 gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all shadow-md h-10 uppercase whitespace-nowrap";

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
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${sideBtnClass} bg-gray-800 text-white hover:bg-gray-900 justify-between px-4`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Project File</span>
              </div>
              <span className="text-[10px]">▼</span>
            </button>

            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => { onJsonExport(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors border-b border-gray-100 uppercase"
                >
                  <Save className="w-4 h-4" />
                  Download Save
                </button>
                
                <label className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer uppercase">
                  <Upload className="w-4 h-4" />
                  Upload Save
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) onJsonImport(e.target.files[0]);
                      setIsMenuOpen(false);
                    }} 
                  />
                </label>
              </div>
            )}
          </div>
          <button
            onClick={onExport}
            className={`${sideBtnClass} bg-green-600 text-white hover:bg-green-700`}
          >
            <Download className="w-4 h-4" />
            <span>Generate DEPS/GRAFCET</span>
          </button>
        </div>
      </div>
    </div>
  );
}
