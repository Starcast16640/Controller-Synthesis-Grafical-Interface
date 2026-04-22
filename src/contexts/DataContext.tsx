import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Sensor,
  Observer,
  Task,
  IncompatibilityLink,
  SuccessionArrow,
  SuccessionNode,
} from '../lib/database.types';

interface DataContextType {
  sensors: Sensor[];
  observers: Observer[];
  tasks: Task[];
  incompatibilityLinks: IncompatibilityLink[];
  successionArrows: SuccessionArrow[];
  successionNodes: SuccessionNode[];
  addSensor: (sensor: Omit<Sensor, 'id' | 'created_at'>) => Promise<void>;
  updateSensor: (id: string, sensor: Partial<Omit<Sensor, 'id' | 'created_at'>>) => Promise<void>;
  deleteSensor: (id: string) => Promise<void>;
  addObserver: (observer: Omit<Observer, 'id' | 'created_at'>) => Promise<void>;
  updateObserver: (id: string, observer: Partial<Omit<Observer, 'id' | 'created_at'>>) => Promise<void>;
  deleteObserver: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Omit<Task, 'id' | 'created_at'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addIncompatibilityLink: (link: Omit<IncompatibilityLink, 'id' | 'created_at'>) => Promise<void>;
  deleteIncompatibilityLink: (id: string) => Promise<void>;
  addSuccessionArrow: (arrow: Omit<SuccessionArrow, 'id' | 'created_at'>) => Promise<void>;
  deleteSuccessionArrow: (id: string) => Promise<void>;
  addSuccessionNode: (node: Omit<SuccessionNode, 'id' | 'created_at'>) => Promise<void>;
  updateSuccessionNode: (id: string, node: Partial<Omit<SuccessionNode, 'id' | 'created_at'>>) => Promise<void>;
  deleteSuccessionNode: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [incompatibilityLinks, setIncompatibilityLinks] = useState<IncompatibilityLink[]>([]);
  const [successionArrows, setSuccessionArrows] = useState<SuccessionArrow[]>([]);
  const [successionNodes, setSuccessionNodes] = useState<SuccessionNode[]>([]);

  const fetchSensors = async () => {
    const { data, error } = await supabase.from('sensors').select('*').order('created_at');
    if (!error && data) setSensors(data);
  };

  const fetchObservers = async () => {
    const { data, error } = await supabase.from('observers').select('*').order('created_at');
    if (!error && data) setObservers(data);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at');
    if (!error && data) setTasks(data);
  };

  const fetchIncompatibilityLinks = async () => {
    const { data, error } = await supabase.from('incompatibility_links').select('*');
    if (!error && data) setIncompatibilityLinks(data);
  };

  const fetchSuccessionArrows = async () => {
    const { data, error } = await supabase.from('succession_arrows').select('*');
    if (!error && data) setSuccessionArrows(data);
  };

  const fetchSuccessionNodes = async () => {
    const { data, error } = await supabase.from('succession_nodes').select('*');
    if (!error && data) setSuccessionNodes(data);
  };

  const refreshData = async () => {
    await Promise.all([
      fetchSensors(),
      fetchObservers(),
      fetchTasks(),
      fetchIncompatibilityLinks(),
      fetchSuccessionArrows(),
      fetchSuccessionNodes(),
    ]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addSensor = async (sensor: Omit<Sensor, 'id' | 'created_at'>) => {
    await supabase.from('sensors').insert([sensor]);
    await fetchSensors();
  };

  const updateSensor = async (id: string, sensor: Partial<Omit<Sensor, 'id' | 'created_at'>>) => {
    await supabase.from('sensors').update(sensor).eq('id', id);
    await fetchSensors();
  };

  const deleteSensor = async (id: string) => {
    await supabase.from('sensors').delete().eq('id', id);
    await fetchSensors();
  };

  const addObserver = async (observer: Omit<Observer, 'id' | 'created_at'>) => {
    await supabase.from('observers').insert([observer]);
    await fetchObservers();
  };

  const updateObserver = async (id: string, observer: Partial<Omit<Observer, 'id' | 'created_at'>>) => {
    await supabase.from('observers').update(observer).eq('id', id);
    await fetchObservers();
  }; 

  const deleteObserver = async (id: string) => {
    await supabase.from('observers').delete().eq('id', id);
    await fetchObservers();
  };

  const addTask = async (task: Omit<Task, 'id' | 'created_at'>) => {
    await supabase.from('tasks').insert([task]);
    await fetchTasks();
  };

  const updateTask = async (id: string, task: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    await supabase.from('tasks').update(task).eq('id', id);
    await fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    await fetchTasks();
  };

  const addIncompatibilityLink = async (link: Omit<IncompatibilityLink, 'id' | 'created_at'>) => {
    await supabase.from('incompatibility_links').insert([link]);
    await fetchIncompatibilityLinks();
  };

  const deleteIncompatibilityLink = async (id: string) => {
    await supabase.from('incompatibility_links').delete().eq('id', id);
    await fetchIncompatibilityLinks();
  };

  const addSuccessionArrow = async (arrow: Omit<SuccessionArrow, 'id' | 'created_at'>) => {
    await supabase.from('succession_arrows').insert([arrow]);
    await fetchSuccessionArrows();
  };

  const deleteSuccessionArrow = async (id: string) => {
    await supabase.from('succession_arrows').delete().eq('id', id);
    await fetchSuccessionArrows();
  };

  const addSuccessionNode = async (node: Omit<SuccessionNode, 'id' | 'created_at'>) => {
    await supabase.from('succession_nodes').insert([node]);
    await fetchSuccessionNodes();
  };

  const updateSuccessionNode = async (id: string, node: Partial<Omit<SuccessionNode, 'id' | 'created_at'>>) => {
    await supabase.from('succession_nodes').update(node).eq('id', id);
    await fetchSuccessionNodes();
  };

  const deleteSuccessionNode = async (id: string) => {
    await supabase.from('succession_nodes').delete().eq('id', id);
    await fetchSuccessionNodes();
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
      }}
    >
      {children}
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
