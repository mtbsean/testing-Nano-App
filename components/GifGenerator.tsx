
import React, { useState, useEffect } from 'react';

interface GifGeneratorProps {
  images: string[];
  onClose: () => void;
  // Callback to generate new frames via AI
  onGenerateFrames?: (baseImage: string, prompt: string, count: number) => Promise<string[]>;
}

declare global {
  interface Window {
    gifshot: any;
  }
}

const MOTION_PRESETS = [
  "Wind blowing hair",
  "Soft breathing",
  "Blinking eyes",
  "Water rippling",
  "Flickering lights",
  "Clouds drifting",
  "Slow camera zoom",
  "Rain falling"
];

export const GifGenerator: React.FC<GifGeneratorProps> = ({ images: initialImages, onClose, onGenerateFrames }) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [interval, setInterval] = useState(0.2); // seconds
  const [width, setWidth] = useState(400); // px
  const [aspectRatio, setAspectRatio] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Looping State
  const [loopMode, setLoopMode] = useState<'infinite' | 'once' | 'custom'>('infinite');
  const [customLoopCount, setCustomLoopCount] = useState(3);

  // Motion Generation State
  const [mode, setMode] = useState<'stitch' | 'generate'>((initialImages.length === 1 && !!onGenerateFrames) ? 'generate' : 'stitch');
  const [motionPrompt, setMotionPrompt] = useState('');
  const [frameCount, setFrameCount] = useState(5);
  const [isGeneratingFrames, setIsGeneratingFrames] = useState(false);

  // Detect aspect ratio from the first image to prevent squashing
  useEffect(() => {
    if (images.length > 0) {
      const img = new Image();
      img.src = images[0];
      img.onload = () => {
        if (img.height > 0) {
           setAspectRatio(img.width / img.height);
        }
      };
    }
  }, [images]);

  // Calculate height based on width and aspect ratio
  const height = Math.round(width / aspectRatio);

  const generateGif = () => {
    if (!window.gifshot) {
      setError("GIF library not loaded. Please refresh.");
      return;
    }

    setProcessing(true);
    setError(null);
    setGifUrl(null);

    // Calculate repeat value for gifshot
    // 0 = infinite
    // -1 = no repeat (play once)
    // n = repeat n times
    let repeatValue = 0;
    if (loopMode === 'once') repeatValue = -1;
    else if (loopMode === 'custom') repeatValue = customLoopCount;

    window.gifshot.createGIF({
      images: images,
      interval: interval,
      gifWidth: width,
      gifHeight: height,
      numFrames: images.length,
      frameDuration: 1, 
      sampleInterval: 10,
      numWorkers: 2,
      repeat: repeatValue, 
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

  const handleGenerateFrames = async () => {
    if (!onGenerateFrames || images.length === 0 || !motionPrompt.trim()) return;
    
    setIsGeneratingFrames(true);
    setError(null);
    try {
        const frames = await onGenerateFrames(images[0], motionPrompt, frameCount);
        // Combine base image with generated frames
        setImages([images[0], ...frames]);
        setMode('stitch');
    } catch (e: any) {
        setError(e.message || "Failed to generate frames");
    } finally {
        setIsGeneratingFrames(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {mode === 'generate' ? 'AI Motion Studio' : 'Generate Animated GIF'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Controls Side */}
          <div className="space-y-6">
            
            {/* Mode: Generate Frames */}
            {mode === 'generate' && (
                <div className="space-y-5 animate-in slide-in-from-left-2">
                    <div className="flex gap-4">
                       <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-600 flex-shrink-0">
                          <img src={images[0]} alt="Base" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-grow">
                          <label className="block text-sm font-bold text-slate-200 mb-1">Motion Prompt</label>
                          <p className="text-[10px] text-slate-400 mb-2">Describe the desired animation (e.g., 'wind blowing', 'eyes blinking', 'water rippling') for the AI to generate frames.</p>
                          <textarea 
                             value={motionPrompt}
                             onChange={(e) => setMotionPrompt(e.target.value)}
                             placeholder="e.g. The wind is blowing, blinking eyes, flickering neon lights, water rippling..."
                             className="w-full h-16 bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-pink-500 outline-none resize-none placeholder-slate-500"
                          />
                       </div>
                    </div>
                    
                    {/* Quick Suggestions */}
                    <div>
                      <span className="text-xs font-bold text-slate-500 mb-2 block">Quick Suggestions:</span>
                      <div className="flex flex-wrap gap-2">
                        {MOTION_PRESETS.map(preset => (
                          <button
                            key={preset}
                            onClick={() => setMotionPrompt(preset)}
                            className="px-2 py-1 rounded-md bg-slate-800 border border-slate-600 text-[10px] text-slate-300 hover:text-white hover:border-pink-500 hover:bg-slate-700 transition-colors"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-slate-300">Number of Frames</label>
                        <span className="text-sm font-bold text-pink-400">{frameCount} frames</span>
                      </div>
                      <input 
                        type="range" 
                        min="3" 
                        max="8" 
                        step="1" 
                        value={frameCount}
                        onChange={(e) => setFrameCount(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">More frames take longer to generate.</p>
                    </div>

                    <button
                        onClick={handleGenerateFrames}
                        disabled={isGeneratingFrames || !motionPrompt.trim()}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                            isGeneratingFrames || !motionPrompt.trim()
                            ? 'bg-slate-700 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500'
                        }`}
                        >
                        {isGeneratingFrames ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Animation...
                            </span>
                        ) : 'Generate Frames'}
                    </button>
                </div>
            )}

            {/* Mode: Stitch GIF (Standard) */}
            {mode === 'stitch' && (
                <div className="space-y-6 animate-in slide-in-from-right-2">
                    <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Animation Frames</label>
                    <div className="grid grid-cols-5 gap-2">
                        {images.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded overflow-hidden border border-slate-600">
                            <img src={src} className="w-full h-full object-cover" alt={`Frame ${i}`} />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-bold text-white">
                            {i + 1}
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-slate-300">Animation Speed</label>
                                <span className="text-sm font-bold text-pink-400">{interval}s</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="1.0" 
                                step="0.05" 
                                value={interval}
                                onChange={(e) => setInterval(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-slate-300">Resolution</label>
                                <span className="text-sm font-bold text-blue-400">{width} x {height}px</span>
                            </div>
                            <input 
                                type="range" 
                                min="200" 
                                max="800" 
                                step="50" 
                                value={width}
                                onChange={(e) => setWidth(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>

                    {/* Loop Controls */}
                    <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-700">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Looping Behavior</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLoopMode('infinite')}
                                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium border transition-colors ${loopMode === 'infinite' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Infinite
                            </button>
                            <button
                                onClick={() => setLoopMode('once')}
                                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium border transition-colors ${loopMode === 'once' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Play Once
                            </button>
                            <button
                                onClick={() => setLoopMode('custom')}
                                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium border transition-colors ${loopMode === 'custom' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Custom N
                            </button>
                        </div>
                        {loopMode === 'custom' && (
                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-xs text-slate-400">Loop count:</span>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="20" 
                                    value={customLoopCount}
                                    onChange={(e) => setCustomLoopCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:border-pink-500 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <button
                    onClick={generateGif}
                    disabled={processing}
                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                        processing 
                        ? 'bg-slate-600 cursor-not-allowed' 
                        : 'bg-pink-600 hover:bg-pink-500'
                    }`}
                    >
                    {processing ? 'Rendering GIF...' : 'Render Animation'}
                    </button>
                    
                    {/* Back button if came from generate mode */}
                    {onGenerateFrames && (
                        <button 
                            onClick={() => {
                                setImages([initialImages[0]]); // Reset to base
                                setMode('generate');
                            }}
                            className="w-full py-2 text-sm text-slate-400 hover:text-white"
                        >
                            Back to Motion Studio
                        </button>
                    )}
                </div>
            )}
          </div>

          {/* Preview Side */}
          <div className="flex flex-col items-center justify-center bg-slate-950/50 rounded-xl border border-slate-700 p-4 min-h-[400px]">
            {error && (
              <div className="text-red-400 text-center text-sm p-4 bg-red-900/20 rounded-lg mb-4">
                <p>{error}</p>
              </div>
            )}
            
            {!gifUrl && !processing && !error && (
               <div className="text-center text-slate-500 opacity-70">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <p className="text-sm font-medium">
                     {mode === 'generate' ? 'Define Motion' : 'Preview Area'}
                 </p>
                 <p className="text-xs mt-1">
                     {mode === 'generate' ? 'Describe movement to generate frames.' : 'Click Render to see your GIF.'}
                 </p>
               </div>
            )}

            {processing && (
               <div className="text-center space-y-3">
                 <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <p className="text-sm text-pink-400 font-bold">Encoding Frames...</p>
                 <p className="text-xs text-slate-500">This happens locally in your browser.</p>
               </div>
            )}

            {gifUrl && (
              <div className="flex flex-col items-center gap-4 w-full animate-in fade-in zoom-in">
                <img src={gifUrl} alt="Generated GIF" className="max-w-full max-h-[350px] rounded-lg shadow-2xl border border-slate-600" />
                <a 
                  href={gifUrl} 
                  download="nanobanana-animation.gif"
                  className="px-6 py-2.5 bg-slate-700 hover:bg-white hover:text-black text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg"
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
