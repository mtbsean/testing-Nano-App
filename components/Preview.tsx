
import React, { useState } from 'react';

interface PreviewProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onUpscale?: () => void;
  onVariation?: () => void;
  onEdit?: () => void;
  // New props for batch progress
  batchProgress?: {
    current: number;
    total: number;
  } | null;
  // Caption props
  onGenerateCaption?: () => void;
  isGeneratingCaption?: boolean;
  generatedCaption?: string | null;
}

export const Preview: React.FC<PreviewProps> = ({ 
  imageUrl, 
  isLoading, 
  error, 
  onUpscale, 
  onVariation, 
  onEdit, 
  batchProgress,
  onGenerateCaption,
  isGeneratingCaption,
  generatedCaption
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCaption = () => {
    if (generatedCaption) {
      navigator.clipboard.writeText(generatedCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full min-h-[500px] flex flex-col gap-4">
      <div className="flex-grow bg-slate-800/50 rounded-2xl border border-slate-700 p-6 flex items-center justify-center relative overflow-hidden shadow-xl min-h-[400px]">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-900 opacity-50 z-0"></div>

        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {isLoading ? (
            <div className="text-center space-y-4">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                <div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin"></div>
              </div>
              
              {batchProgress ? (
                 <div>
                   <p className="text-slate-200 font-bold text-lg animate-pulse">Generating Batch...</p>
                   <p className="text-yellow-500 font-medium text-xl mt-1">{batchProgress.current} / {batchProgress.total}</p>
                   <p className="text-xs text-slate-500 mt-2">Mixing outfits, poses, and environments</p>
                 </div>
              ) : (
                <>
                  <p className="text-slate-400 font-medium animate-pulse">Creating your masterpiece...</p>
                  <p className="text-xs text-slate-600">This usually takes about 5-10 seconds</p>
                </>
              )}
            </div>
          ) : error ? (
            <div className="text-center max-w-md mx-auto p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-white mb-2">Generation Failed</h3>
              <p className="text-red-200/80">{error}</p>
            </div>
          ) : imageUrl ? (
            <div className="relative group w-full h-full flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Generated Art" 
                className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain"
              />
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a 
                    href={imageUrl} 
                    download={`nanobanana-${Date.now()}.png`}
                    className="bg-slate-900/90 text-white p-2 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors"
                    title="Download Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-50">
              <div className="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
              </div>
              <p className="text-lg font-medium text-slate-400">Ready to create</p>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Enter a prompt and click generate to see the magic happen with Nano Banana.
              </p>
            </div>
          )}
        </div>
      </div>

      {imageUrl && !isLoading && (
        <div className="flex flex-col gap-4">
           {/* Actions Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-green-500/50 hover:bg-slate-700 transition-all text-xs sm:text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit & Filters
            </button>
            <button
              onClick={onUpscale}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-yellow-500/50 hover:bg-slate-700 transition-all text-xs sm:text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upscale (4K)
            </button>
            <button
              onClick={onVariation}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-700 transition-all text-xs sm:text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Variations
            </button>
            <button
               onClick={onGenerateCaption}
               disabled={isGeneratingCaption}
               className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-700 transition-all text-xs sm:text-sm font-medium disabled:opacity-50"
            >
               {isGeneratingCaption ? (
                 <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                 </svg>
               )}
               {isGeneratingCaption ? 'Writing...' : 'Caption'}
            </button>
          </div>
          
          {/* Generated Caption Display */}
          {generatedCaption && (
            <div className="bg-slate-900/80 border border-purple-500/30 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">Social Media Caption</span>
                  <button 
                    onClick={handleCopyCaption}
                    className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <span className="text-green-500 font-bold">Copied!</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
               </div>
               <p className="text-sm text-slate-200 leading-relaxed font-medium">{generatedCaption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
