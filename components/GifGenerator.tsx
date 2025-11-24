
import React, { useState, useEffect } from 'react';

interface GifGeneratorProps {
  images: string[];
  onClose: () => void;
}

declare global {
  interface Window {
    gifshot: any;
  }
}

export const GifGenerator: React.FC<GifGeneratorProps> = ({ images, onClose }) => {
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [interval, setInterval] = useState(0.3); // seconds
  const [width, setWidth] = useState(400); // px
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateGif = () => {
    if (!window.gifshot) {
      setError("GIF library not loaded. Please refresh.");
      return;
    }

    setProcessing(true);
    setError(null);
    setGifUrl(null);

    window.gifshot.createGIF({
      images: images,
      interval: interval,
      gifWidth: width,
      gifHeight: width, // Assuming square mostly, but gifshot handles aspect ratio well usually by fitting
      numFrames: images.length,
      frameDuration: 1, // calculated via interval
      sampleInterval: 10, // lower is better quality but slower
      numWorkers: 2,
    }, (obj: any) => {
      if (!obj.error) {
        setGifUrl(obj.image);
      } else {
        setError("Failed to create GIF.");
        console.error(obj.errorMsg);
      }
      setProcessing(false);
    });
  };

  // Auto generate on first load or when images change? Maybe better to let user click "Create"
  // to avoid heavy processing on mount.

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Generate Animated GIF
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Controls Side */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Selected Frames</label>
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 8).map((src, i) => (
                  <div key={i} className="relative aspect-square rounded overflow-hidden border border-slate-600">
                    <img src={src} className="w-full h-full object-cover" alt={`Frame ${i}`} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-bold text-white">
                      {i + 1}
                    </div>
                  </div>
                ))}
                {images.length > 8 && (
                   <div className="flex items-center justify-center bg-slate-700 rounded text-xs text-slate-400">
                     +{images.length - 8} more
                   </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">{images.length} frames selected.</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Frame Duration</label>
                <span className="text-sm font-bold text-pink-400">{interval}s</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="2.0" 
                step="0.1" 
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <p className="text-xs text-slate-500 mt-1">Faster (0.1s) &larr; &rarr; Slower (2.0s)</p>
            </div>

            <div>
               <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">GIF Resolution (Width)</label>
                <span className="text-sm font-bold text-blue-400">{width}px</span>
              </div>
              <input 
                type="range" 
                min="200" 
                max="600" 
                step="50" 
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <button
              onClick={generateGif}
              disabled={processing}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                processing 
                  ? 'bg-slate-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transform hover:scale-[1.02]'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Rendering...
                </span>
              ) : 'Render Animation'}
            </button>
          </div>

          {/* Preview Side */}
          <div className="flex flex-col items-center justify-center bg-slate-950/50 rounded-xl border border-slate-700 p-4 min-h-[300px]">
            {error && (
              <div className="text-red-400 text-center text-sm p-4">
                <p>{error}</p>
              </div>
            )}
            
            {!gifUrl && !processing && !error && (
               <div className="text-center text-slate-500">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <p className="text-sm">Adjust settings and click Render</p>
               </div>
            )}

            {processing && (
               <div className="text-center space-y-2">
                 <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <p className="text-sm text-pink-400">Encoding GIF...</p>
               </div>
            )}

            {gifUrl && (
              <div className="flex flex-col items-center gap-4 w-full">
                <img src={gifUrl} alt="Generated GIF" className="max-w-full max-h-[300px] rounded shadow-lg border border-slate-600" />
                <a 
                  href={gifUrl} 
                  download="nanobanana-animation.gif"
                  className="px-6 py-2 bg-slate-700 hover:bg-white hover:text-black text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download GIF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
