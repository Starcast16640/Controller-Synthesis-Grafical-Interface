import { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { Toolbar, type ViewType } from './components/Toolbar';
import { SensorView } from './components/views/SensorView';
import { ObserverView } from './components/views/ObserverView';
import { TaskView } from './components/views/TaskView';
import { IncompatibilityView } from './components/views/IncompatibilityView';
import { SuccessionView } from './components/views/SuccessionView';
import { CombinedView } from './components/views/CombinedView';
import { useData } from './contexts/DataContext';
import { generateDEPS, generateGRAFCET, downloadFile } from './lib/exporters';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('sensors');
  const { sensors, observers, tasks, incompatibilityLinks, successionArrows, successionNodes, onJsonExport, onJsonImport } = useData();

  const handleExport = () => {
    const deps = generateDEPS(sensors, observers, tasks, incompatibilityLinks, successionArrows, successionNodes);
    const grafcet = generateGRAFCET(tasks, successionArrows);

    downloadFile(deps, 'model.deps');
    downloadFile(grafcet, 'model.dot');

    alert('Files exported:\n- model.deps (DEPS format)\n- model.dot (GRAFCET format)\n\nYou can use these files with external synthesis tools.');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Toolbar currentView={currentView} onViewChange={setCurrentView} onExport={handleExport} onJsonExport={exportProject} onJsonImport={importProject} />

      <div className="flex-1 overflow-hidden">
        {currentView === 'sensors' && <SensorView />}
        {currentView === 'observers' && <ObserverView />}
        {currentView === 'tasks' && <TaskView />}
        {currentView === 'incompatibility' && <IncompatibilityView />}
        {currentView === 'succession' && <SuccessionView />}
        {currentView === 'combined' && <CombinedView />}
      </div>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
