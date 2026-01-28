import { useState } from 'react';
import { IncompatibilityView } from './IncompatibilityView';
import { SuccessionView } from './SuccessionView';

export function CombinedView() {
  const [activeTab, setActiveTab] = useState<'incompatibility' | 'succession'>('incompatibility');

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('incompatibility')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'incompatibility'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Incompatibility
          </button>
          <button
            onClick={() => setActiveTab('succession')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'succession'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Succession
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'incompatibility' && <IncompatibilityView />}
        {activeTab === 'succession' && <SuccessionView />}
      </div>
    </div>
  );
}
