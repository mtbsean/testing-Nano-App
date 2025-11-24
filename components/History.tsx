import React from 'react';
import { HistoryItem } from '../types';

interface HistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  // New props for GIF selection mode
  selectionMode: boolean;
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onEnterSelectionMode: () => void;
  onExitSelectionMode: () => void;
  onCreateGif: () => void;
  onTrainModel?: () => void;
}

export const History: React.FC<HistoryProps> = ({ 
  history, 
  onSelect, 
  selectionMode, 
  selectedIds, 
  onToggleSelection,
  onEnterSelectionMode,
  onExitSelectionMode,
  onCreateGif,
  onTrainModel
}) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Creations
        </h3>
        
        {/* GIF Creation & Training Controls */}
        <div className="flex items-center gap-2">
           {selectionMode ? (
              <>
                 <span className="text-sm text-slate-400 hidden sm:inline">
                   {selectedIds.length} selected
                 </span>
                 <button
                    onClick={onTrainModel}
                    disabled={selectedIds.length === 0}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      selectedIds.length > 0 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Train LoRA
                 </button>
                 <button
                    onClick={onCreateGif}
                    disabled={selectedIds.length < 2}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedIds.length >= 2 
                        ? 'bg-pink-600 text-white hover:bg-pink-500 shadow-lg shadow-pink-500/20' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                 >
                    Create GIF
                 </button>
                 <button 
                    onClick={onExitSelectionMode}
                    className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-xs hover:text-white hover:bg-slate-700"
                 >
                    Cancel
                 </button>
              </>
           ) : (
              <button
                onClick={onEnterSelectionMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs hover:text-white hover:border-slate-500 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Select Items
              </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {history.slice().reverse().map((item) => {
          const isSelected = selectedIds.includes(item.id);
          
          return (
            <div 
              key={item.id} 
              className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border transition-all bg-slate-800 ${
                selectionMode 
                  ? isSelected 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30' 
                    : 'border-slate-700 opacity-60 hover:opacity-100'
                  : 'border-slate-700 hover:border-yellow-500'
              }`}
              onClick={() => {
                if (selectionMode) {
                  onToggleSelection(item.id);
                } else {
                  onSelect(item);
                }
              }}
            >
              <img 
                src={item.imageUrl} 
                alt={item.prompt} 
                className={`w-full h-full object-cover transition-transform duration-300 ${!selectionMode && 'group-hover:scale-110'}`} 
              />
              
              {/* Selection Checkbox Overlay */}
              {selectionMode && (
                <div className={`absolute top-2 left-2 h-5 w-5 rounded border flex items-center justify-center ${
                  isSelected ? 'bg-indigo-500 border-indigo-500' : 'bg-black/50 border-white/50'
                }`}>
                   {isSelected && (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                   )}
                </div>
              )}

              {/* Normal Hover Info (Hidden in Selection Mode) */}
              {!selectionMode && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-xs text-white truncate font-medium">{item.style}</p>
                    <p className="text-[10px] text-slate-300 truncate">{new Date(item.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <a 
                      href={item.imageUrl} 
                      download={`history-${item.id}.png`}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-yellow-500 hover:text-black transition-all"
                      title="Download"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};