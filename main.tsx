import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import TradingPlatformArchitecture from './TradingPlan'
import SystemArchitecture from './SystemArchitecture'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'benchmarking' | 'architecture'>('architecture');

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-blue-500 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Trading Platform Documentation</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentPage('architecture')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  currentPage === 'architecture'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                System Architecture
              </button>
              <button
                onClick={() => setCurrentPage('benchmarking')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  currentPage === 'benchmarking'
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Benchmarking Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      {currentPage === 'architecture' ? <SystemArchitecture /> : <TradingPlatformArchitecture />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
