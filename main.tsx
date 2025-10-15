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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white text-center sm:text-left">Trading Platform Documentation</h1>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setCurrentPage('architecture')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 py-2 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                  currentPage === 'architecture'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <span className="hidden sm:inline">System Architecture</span>
                <span className="sm:hidden">Architecture</span>
              </button>
              <button
                onClick={() => setCurrentPage('benchmarking')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 py-2 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                  currentPage === 'benchmarking'
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <span className="hidden sm:inline">Benchmarking Plan</span>
                <span className="sm:hidden">Benchmarking</span>
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
