import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { analyzeExpression, normalizeExpression } from '../lib/expressionParser';
import type {
  Sensor,
  Observer,
  Task,
  IncompatibilityLink,
  SuccessionArrow,
  SuccessionNode,
} from '../lib/database.types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface DataContextType {
  sensors: Sensor[];
  observers: Observer[];
  tasks: Task[];
  incompatibilityLinks: IncompatibilityLink[];
  successionArrows: SuccessionArrow[];
  successionNodes: SuccessionNode[];
  addSensor: (sensor: Omit<Sensor, 'id' | 'created_at'>) => void;
  updateSensor: (id: string, sensor: Partial<Omit<Sensor, 'id' | 'created_at'>>) => void;
  deleteSensor: (id: string) => void;
  addObserver: (observer: Omit<Observer, 'id' | 'created_at'>) => void;
  updateObserver: (id: string, observer: Partial<Omit<Observer, 'id' | 'created_at'>>) => void;
  deleteObserver: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => void;
  updateTask: (id: string, task: Partial<Omit<Task, 'id' | 'created_at'>>) => void;
  deleteTask: (id: string) => void;
  addIncompatibilityLink: (link: Omit<IncompatibilityLink, 'id' | 'created_at'>) => void;
  deleteIncompatibilityLink: (id: string) => void;
  addSuccessionArrow: (arrow: Omit<SuccessionArrow, 'id' | 'created_at'>) => void;
  deleteSuccessionArrow: (id: string) => void;
  addSuccessionNode: (node: Omit<SuccessionNode, 'id' | 'created_at'>) => void;
  updateSuccessionNode: (id: string, node: Partial<Omit<SuccessionNode, 'id' | 'created_at'>>) => void;
  deleteSuccessionNode: (id: string) => void;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [incompatibilityLinks, setIncompatibilityLinks] = useState<IncompatibilityLink[]>([]);
  const [successionArrows, setSuccessionArrows] = useState<SuccessionArrow[]>([]);
  const [successionNodes, setSuccessionNodes] = useState<SuccessionNode[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = () => {
    const saved = localStorage.getItem('current_project_backup');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.sensors) setSensors(data.sensors);
        if (data.observers) setObservers(data.observers);
        if (data.tasks) setTasks(data.tasks);
        if (data.incompatibilityLinks) setIncompatibilityLinks(data.incompatibilityLinks);
        if (data.successionNodes) setSuccessionNodes(data.successionNodes);
        if (data.successionArrows) setSuccessionArrows(data.successionArrows);
      } catch (e) {
        console.error("Erreur de lecture du backup");
      }
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const projectState = {
      sensors, observers, tasks, incompatibilityLinks, successionNodes, successionArrows
    };
    localStorage.setItem('current_project_backup', JSON.stringify(projectState));
  }, [sensors, observers, tasks, incompatibilityLinks, successionNodes, successionArrows]);

  const addSensor = (sensor: Omit<Sensor, 'id' | 'created_at'>) => {
    const newSensor = { ...sensor, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setSensors(prev => [...prev, newSensor]);
    showNotify("Sensor added locally", "success");
  };

  const updateSensor = (id: string, updates: Partial<Sensor>) => {
    setSensors(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSensor = (id: string) => {
    setSensors(prev => prev.filter(s => s.id !== id));
  };

  const addObserver = (observer: any) => {
    const newObj = { ...observer, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setObservers(prev => [...prev, newObj]);
    showNotify("Observer added", "success");
  };

  const updateObserver = (id: string, updates: any) => {
    setObservers(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteObserver = (id: string) => {
    setObservers(prev => prev.filter(o => o.id !== id));
  };

  const addTask = (task: any) => {
    const newObj = { ...task, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setTasks(prev => [...prev, newObj]);
    showNotify("Task added", "success");
  };

  const updateTask = (id: string, updates: any) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addIncompatibilityLink = (link: Omit<IncompatibilityLink, 'id' | 'created_at'>) => {
    const newLink = { ...link, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setIncompatibilityLinks(prev => [...prev, newLink]);
    showNotify("Incompatibility link created", "success");
  };

  const deleteIncompatibilityLink = (id: string) => {
    setIncompatibilityLinks(prev => prev.filter(l => l.id !== id));
    showNotify("Link deleted", "success");
  };

  const addSuccessionArrow = (arrow: Omit<SuccessionArrow, 'id' | 'created_at'>) => {
    const newArrow = { ...arrow, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setSuccessionArrows(prev => [...prev, newArrow]);
  };

  const deleteSuccessionArrow = (id: string) => {
    setSuccessionArrows(prev => prev.filter(a => a.id !== id));
  };

  const addSuccessionNode = (node: Omit<SuccessionNode, 'id' | 'created_at'>) => {
    const newNode = { ...node, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setSuccessionNodes(prev => [...prev, newNode]);
    showNotify("Node added", "success");
  };

  const updateSuccessionNode = (id: string, updates: Partial<SuccessionNode>) => {
    setSuccessionNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteSuccessionNode = (id: string) => {
    setSuccessionNodes(prev => prev.filter(n => n.id !== id));
    setSuccessionArrows(prev => prev.filter(a => a.from_id !== id && a.to_id !== id));
    showNotify("Node deleted", "success");
  };

  const exportProject = () => {
    const allNames = [
      ...sensors.map(s => s.name), 
      ...observers.map(o => o.name), 
      ...tasks.map(t => t.name), 
      'TRUE', 'FALSE', 'AUTO'
    ];
    const cleanTasks = tasks.map(t => {
      const authRes = analyzeExpression(t.authorization_expression, allNames);
      const finalRes = analyzeExpression(t.final_condition, allNames);
      return {
        ...t,
        authorization_expression: authRes.tokens.length > 0 ? normalizeExpression(authRes.tokens) : t.authorization_expression,
        final_condition: finalRes.tokens.length > 0 ? normalizeExpression(finalRes.tokens) : t.final_condition
      };
    });
    const cleanObservers = observers.map(o => {
      const newExprs = { ...o.expressions } as any;
      Object.keys(newExprs).forEach(key => {
        if (newExprs[key]) {
          const res = analyzeExpression(newExprs[key], allNames);
          if (res.tokens.length > 0) newExprs[key] = normalizeExpression(res.tokens);
        }
      });
      return { ...o, expressions: newExprs };
    });
    const cleanNodes = successionNodes.map(n => {
      const res = analyzeExpression(n.expression, allNames);
      return {
        ...n,
        expression: res.tokens.length > 0 ? normalizeExpression(res.tokens) : n.expression
      };
    });
    const projectData = {
      sensors,
      observers: cleanObservers,
      tasks: cleanTasks,
      incompatibilityLinks,
      successionNodes: cleanNodes,
      successionArrows
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projet_deps_final.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotify("Fichier JSON nettoyé et téléchargé !", "success");
  };

  const importProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.sensors) setSensors(data.sensors);
        if (data.observers) setObservers(data.observers);
        if (data.tasks) setTasks(data.tasks);
        if (data.incompatibilityLinks) setIncompatibilityLinks(data.incompatibilityLinks);
        if (data.successionNodes) setSuccessionNodes(data.successionNodes);
        if (data.successionArrows) setSuccessionArrows(data.successionArrows);
        showNotify("Project loaded successfully!", "success");
      } catch (err) {
        showNotify("Error: Invalid JSON file structure.", "error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <DataContext.Provider
      value={{
        sensors,
        observers,
        tasks,
        incompatibilityLinks,
        successionArrows,
        successionNodes,
        addSensor,
        updateSensor,
        deleteSensor,
        addObserver,
        updateObserver,
        deleteObserver,
        addTask,
        updateTask,
        deleteTask,
        addIncompatibilityLink,
        deleteIncompatibilityLink,
        addSuccessionArrow,
        deleteSuccessionArrow,
        addSuccessionNode,
        updateSuccessionNode,
        deleteSuccessionNode,
        refreshData,
        exportProject,
        importProject,
      }}
    >
      {children}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${
            notification.type === 'success' 
              ? 'bg-emerald-500 border-emerald-400 text-white' 
              : 'bg-red-500 border-red-400 text-white'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-bold text-sm uppercase tracking-wide">
              {notification.message}
            </span>
          </div>
        </div>
      )}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
